const API_BASE = "https://sid-restapi.onrender.com";

function headers(token, body){
  const h = {};
  if (body) h["Content-Type"] = "application/json";
  if (token){ h["x-token"] = token; h["token"] = token; }
  return h;
}

async function jfetch(url, { method="GET", body, token } = {}){
  const res = await fetch(url, {
    method, headers: headers(token, body),
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

export async function apiRegister(username, password){
  return jfetch(`${API_BASE}/api/usuarios`, { method:"POST", body:{ username, password } });
}

export async function apiLogin(username, password){
  try {
    return await jfetch(`${API_BASE}/api/login`, { method:"POST", body:{ username, password } });
  } catch {
    return jfetch(`${API_BASE}/api/auth/login`, { method:"POST", body:{ username, password } });
  }
}

export async function apiValidateToken(token){
  return jfetch(`${API_BASE}/api/usuarios?limit=1`, { token });
}

export async function apiUpdateScore(token, username, score){
  return jfetch(`${API_BASE}/api/usuarios`, {
    method:"PATCH", token, body:{ username, data:{ score:Number(score) } }
  });
}

export async function apiListUsers(token){
  return jfetch(`${API_BASE}/api/usuarios?limit=200&sort=true`, { token });
}
