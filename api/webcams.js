export default async function handler(req, res) {
  const WINDY_KEY = 'pIEIA44iepaxAdnmgy8FS5Stwevgdy1t';
  const headers = { 'x-windy-api-key': WINDY_KEY };

  try {
    const offsets = Array.from({length: 20}, (_, i) => i * 50);

    const results = await Promise.allSettled(
      offsets.map(offset =>
        fetch(
          'https://api.windy.com/webcams/api/v3/webcams?limit=50&offset=' + offset + '&orderby=popularity&include=player,location,streams',
          { headers }
        )
          .then(r => {
            console.log('[Windy] offset=' + offset + ' status=' + r.status);
            if (!r.ok) return [];
            return r.json();
          })
          .then(d => (d && d.webcams) ? d.webcams : [])
          .catch(e => {
            console.error('[Windy] offset=' + offset + ' 실패:', e.message);
            return [];
          })
      )
    );

    const allCams = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      // player.live는 문자열 URL
      .filter(cam =>
        typeof cam.player?.live === 'string' &&
        cam.player.live.length > 0 &&
        cam.location?.latitude &&
        cam.location?.longitude
      )
      .map(cam => ({
        id: 'windy-' + cam.webcamId,
        title: cam.title || '',
        city: cam.location?.city || cam.title || 'Unknown',
        country: cam.location?.country || '',
        lat: cam.location.latitude,
        lng: cam.location.longitude,
        embed: cam.player.live,
        hls: cam.streams?.hls || null
      }));

    console.log('[Windy] 최종 결과:', allCams.length + '개');

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ webcams: allCams, total: allCams.length, ts: Date.now() });

  } catch (err) {
    console.error('[Windy] 전체 오류:', err.message);
    res.status(500).json({ error: err.message, webcams: [], total: 0 });
  }
}
