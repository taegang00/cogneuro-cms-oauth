async function exchangeCodeForToken(code) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const resp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  const json = await resp.json();
  if (!resp.ok || json.error) {
    const msg = json.error_description || json.error || "Token exchange failed";
    throw new Error(msg);
  }
  return json.access_token;
}

function htmlSuccess(token, origin) {
  // Decap CMS는 window.opener로부터 token을 받는 방식을 사용
  // origin을 특정하고 싶으면 ORIGIN env로 제한 가능(권장)
  const target = origin || "*";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Authorization</title></head>
<body>
<script>
  (function () {
    var payload = { token: ${JSON.stringify(token)} };
    // Decap CMS 규약: authorization:<backend>:success:<json>
    var message = "authorization:github:success:" + JSON.stringify(payload);
    if (window.opener) {
      window.opener.postMessage(message, ${JSON.stringify(target)});
    }
    window.close();
  })();
</script>
</body>
</html>`;
}

function htmlError(errMsg, origin) {
  const target = origin || "*";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Authorization Error</title></head>
<body>
<script>
  (function () {
    var message = "authorization:github:error:" + ${JSON.stringify(errMsg || "Unknown error")};
    if (window.opener) {
      window.opener.postMessage(message, ${JSON.stringify(target)});
    }
    window.close();
  })();
</script>
</body>
</html>`;
}

export default async function handler(req, res) {
  const origin = process.env.ORIGIN; // 예: https://cogneuro-site.vercel.app
  const code = req.query.code;

  if (!code) {
    res.status(400).send("Missing code");
    return;
  }

  try {
    const token = await exchangeCodeForToken(code);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(htmlSuccess(token, origin));
  } catch (e) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(htmlError(e?.message, origin));
  }
}
