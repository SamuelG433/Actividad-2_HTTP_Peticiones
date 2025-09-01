import { apiRegister, apiLogin, apiValidateToken, apiUpdateScore, apiListUsers } from "./api.js";

const $ = (s)=>document.querySelector(s);

const loginContainer = $("#loginContainer");
const appSection = $("#appSection");
const authMsg = $("#authMsg");
const welcome = $("#welcome");

const inpUser = $("#usernameInput");
const inpPass = $("#passwordInput");
const loginButton = $("#loginButton");
const registerButton = $("#registerButton");
const logoutButton = $("#logoutButton");

const inpScore = $("#inpScore");
const btnUpdateScore = $("#btnUpdateScore");
const updateMsg = $("#updateMsg");

const btnRefresh = $("#btnRefresh");
const tblBody = $("#tblBody");
const listMsg = $("#listMsg");

const storage = {
  get token(){ return localStorage.getItem("sid_token") || ""; },
  set token(v){ v ? localStorage.setItem("sid_token", v) : localStorage.removeItem("sid_token"); },
  get username(){ return localStorage.getItem("sid_username") || ""; },
  set username(v){ v ? localStorage.setItem("sid_username", v) : localStorage.removeItem("sid_username"); }
};

function showAuth(){ loginContainer.classList.remove("hidden"); appSection.classList.add("hidden"); authMsg.textContent=""; }
function showApp(){ loginContainer.classList.add("hidden"); appSection.classList.remove("hidden"); welcome.textContent = `Hola, ${storage.username || "usuario"}`; }

loginButton.addEventListener("click", async (e)=>{
  e.preventDefault();
  const u = inpUser.value.trim(), p = inpPass.value;
  if (u.length<3 || p.length<4){ authMsg.textContent="Usuario/clave inválidos."; return; }
  authMsg.textContent = "Autenticando...";
  try {
    const data = await apiLogin(u,p);
    if (!data?.token) throw new Error("Respuesta inesperada en login");
    storage.token = data.token; storage.username = u;
    showApp(); await loadLeaderboard();
  } catch(err){ authMsg.textContent = `Error login: ${err.message}`; }
});

registerButton.addEventListener("click", async ()=>{
  const u = inpUser.value.trim(), p = inpPass.value;
  if (u.length<3 || p.length<4){ authMsg.textContent="Usuario/clave inválidos."; return; }
  authMsg.textContent = "Registrando...";
  try { await apiRegister(u,p); authMsg.textContent="Registro OK. Ahora haz login."; }
  catch(err){ authMsg.textContent = `Error registro: ${err.message}`; }
});

logoutButton.addEventListener("click", ()=>{
  storage.token=""; storage.username="";
  showAuth();
});

btnUpdateScore.addEventListener("click", async ()=>{
  const s = Number(inpScore.value);
  if (Number.isNaN(s) || s<0){ updateMsg.textContent="Score inválido."; return; }
  updateMsg.textContent = "Actualizando...";
  try { await apiUpdateScore(storage.token, storage.username, s); updateMsg.textContent="Score actualizado."; await loadLeaderboard(); }
  catch(err){ updateMsg.textContent = `Error: ${err.message}`; }
});

btnRefresh.addEventListener("click", loadLeaderboard);

async function loadLeaderboard(){
  listMsg.textContent = "Cargando...";
  tblBody.innerHTML = "";
  try {
    const data = await apiListUsers(storage.token);
    const users = (data?.usuarios || []).sort((a,b)=> (b.score??0) - (a.score??0));
    users.forEach((u,i)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i+1}</td><td>${u.username ?? "-"}</td><td>${u.score ?? 0}</td>`;
      tblBody.appendChild(tr);
    });
    listMsg.textContent = `Total: ${users.length}`;
  } catch(err){ listMsg.textContent = `Error al listar: ${err.message}`; }
}

// auto-init
(async ()=>{
  if (storage.token){
    try { await apiValidateToken(storage.token); showApp(); loadLeaderboard(); }
    catch { storage.token=""; showAuth(); }
  } else { showAuth(); }
})();
