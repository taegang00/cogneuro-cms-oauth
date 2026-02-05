export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const baseUrl = process.env.BASE_URL; // 예: https://cogneuro-cms-oauth.vercel.app
  const scope = process.env.OAUTH_SCOPE || "repo";

  if (!clientId || !baseUrl) {
    res.status(500).send("Missing OAUTH_CLIENT_ID or BASE_URL");
    return;
  }

  const redirectUri = `${baseUrl}/auth/callback`;

  // state는 간단히 timestamp로 처리 (원하시면 nonce/CSRF 강화도 가능합니다)
  const state = String(Date.now());

  const url =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  res.writeHead(302, { Location: url });
  res.end();
}
