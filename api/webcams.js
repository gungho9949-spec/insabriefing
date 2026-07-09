export default async function handler(req, res) {
  const WINDY_KEY = 'pIEIA44iepaxAdnmgy8FS5Stwevgdy1t';

  try {
    const offsets = Array.from({length: 20}, (_, i) => i * 50);

    const results = await Promise.allSettled(
      offsets.map(offset => {
        const url = 'https://api.windy.com/webcams/api/v3/webcams'
          + '?limit=50'
          + '&offset=' + offset
          + '&orderby=popularity'
          + '&include=player,location,streams'
          + '&key=' + WINDY_KEY;

        return fetch(url)
          .then(r => {
            console.log('[Windy] offset=' + offset + ' status=' + r.status);
            if (!r.ok) return [];
            return r.json();
          })
          .then(d => (d && d.webcams) ? d.webcams : [])
          .catch(e => {
            console.error('[Windy] offset=' + offset + ' 실패:', e.message);
            return [];
          });
      })
    );

    const allCams = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(cam =>
        cam.player?.live?.available &&
        cam.player?.live?.embed &&
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
        embed: cam.player.live.embed,
        hls: cam.streams?.hls || null
      }));

    console.log('[Windy] 최종 결과:', allCams.length + '개');

    // 캐시 시간 1시간으로 줄임 (디버깅용, 나중에 86400으로 늘릴 것)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ webcams: allCams, total: allCams.length, ts: Date.now() });

  } catch (err) {
    console.error('[Windy] 전체 오류:', err.message);
    res.status(500).json({ error: err.message, webcams: [], total: 0 });
  }
}
