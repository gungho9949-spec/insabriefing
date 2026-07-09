export default async function handler(req, res) {
  const WINDY_KEY = 'pIEIA44iepaxAdnmgy8FS5Stwevgdy1t';
  const headers = { 'x-windy-api-key': WINDY_KEY };

  try {
    // 여러 include 조합 동시 테스트
    const [r1, r2, r3] = await Promise.all([
      fetch('https://api.windy.com/webcams/api/v3/webcams?limit=50&offset=0&orderby=popularity&include=player,location', { headers }).then(r => r.json()),
      fetch('https://api.windy.com/webcams/api/v3/webcams?limit=50&offset=0&orderby=popularity&include=player,location,urls', { headers }).then(r => r.json()),
      fetch('https://api.windy.com/webcams/api/v3/webcams?limit=50&offset=0&orderby=popularity&include=player,location,images', { headers }).then(r => r.json()),
    ]);

    // r1: 기본 player
    const cams1 = r1.webcams || [];
    const liveCount1 = cams1.filter(c => c.player?.live).length;

    // 첫 번째 응답에서 player 키 종류 수집
    const allPlayerKeys = [...new Set(cams1.flatMap(c => Object.keys(c.player || {})))];

    // player.live 가 있는 것 샘플
    const liveSample = cams1.find(c => c.player?.live);

    // r2: urls 포함
    const cams2 = r2.webcams || [];
    const urlSample = cams2[0] ? { urlsKeys: Object.keys(cams2[0].urls || {}), playerKeys: Object.keys(cams2[0].player || {}) } : null;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      r1_total: cams1.length,
      r1_liveCount: liveCount1,
      r1_allPlayerKeys: allPlayerKeys,
      r1_liveSample: liveSample ? { title: liveSample.title, live: liveSample.player.live } : null,
      r2_urlSample: urlSample,
      r1_apiKeys: Object.keys(r1),
    });
  } catch(err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0,3) });
  }
}
