export default async function handler(req, res) {
  const WINDY_KEY = 'pIEIA44iepaxAdnmgy8FS5Stwevgdy1t';

  // 진단: offset=0 1개만 먼저 시도
  const testUrl = 'https://api.windy.com/webcams/api/v3/webcams?limit=10&offset=0&orderby=popularity&include=player,location&key=' + WINDY_KEY;

  let raw, parsed, fetchError;
  try {
    const r = await fetch(testUrl);
    raw = { status: r.status, ok: r.ok, headers: Object.fromEntries(r.headers.entries()) };
    parsed = await r.json();
  } catch(e) {
    fetchError = e.message;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    diagnostic: true,
    fetchError: fetchError || null,
    httpStatus: raw?.status,
    windyKeys: Object.keys(parsed || {}),
    totalWebcams: parsed?.webcams?.length ?? 'n/a',
    firstCam: parsed?.webcams?.[0] ?? null,
    errors: parsed?.errors ?? null,
    message: parsed?.message ?? null
  });
}
