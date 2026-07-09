export default async function handler(req, res) {
  const WINDY_KEY = 'pIEIA44iepaxAdnmgy8FS5Stwevgdy1t';

  try {
    // 진단: 10개만 먼저 가져와서 구조 확인
    const r = await fetch(
      'https://api.windy.com/webcams/api/v3/webcams?limit=10&offset=0&orderby=popularity&include=player,location',
      { headers: { 'x-windy-api-key': WINDY_KEY } }
    );
    const data = await r.json();
    const cams = data.webcams || [];

    // 첫 번째 웹캠의 player 구조 확인
    const sample = cams[0] ? {
      title: cams[0].title,
      playerKeys: Object.keys(cams[0].player || {}),
      liveObj: cams[0].player?.live,
      locationKeys: Object.keys(cams[0].location || {}),
      lat: cams[0].location?.latitude,
      lng: cams[0].location?.longitude
    } : null;

    // 필터 통과 개수
    const passed = cams.filter(cam =>
      cam.player?.live?.available &&
      cam.player?.live?.embed &&
      cam.location?.latitude &&
      cam.location?.longitude
    ).length;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      httpStatus: r.status,
      totalInResponse: cams.length,
      passedFilter: passed,
      topLevelKeys: Object.keys(data),
      firstCamSample: sample
    });
  } catch(err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: err.message });
  }
}
