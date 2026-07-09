const WINDY_KEY = 'pIEIA44iepaxAdnmgy8FS5Stwevgdy1t';

async function fetchBatch(offset) {
  const url = 'https://api.windy.com/webcams/api/v3/webcams'
    + '?limit=50&offset=' + offset
    + '&orderby=popularity'
    + '&include=player,location'
    + '&key=' + WINDY_KEY;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.webcams || [];
}

export default async function handler(req, res) {
  try {
    // 50개 × 20배치 = 1000개를 병렬로 동시 요청
    const offsets = [];
    for (let i = 0; i < 20; i++) offsets.push(i * 50);

    const results = await Promise.allSettled(offsets.map(o => fetchBatch(o)));

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
        embed: cam.player.live.embed
      }));

    // Vercel CDN이 24시간 캐시 → Windy API는 하루 1번만 실제 호출됨
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ webcams: allCams, total: allCams.length, updatedAt: new Date().toISOString() });

  } catch (err) {
    res.status(500).json({ error: err.message, webcams: [] });
  }
}
