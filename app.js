import { apiRegister, apiLogin, apiValidateToken, apiUpdateScore, apiListUsers } from "./api.js";

const $ = (s)=>document.querySelector(s);

// UI
const loginContainer = $("#loginContainer");
const appSection = $("#appSection");
const authForm = $("#authForm");
const authMsg = $("#authMsg");
const authAlert = $("#authAlert");
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

// Storage
const storage = {
  get token(){ return localStorage.getItem("sid_token") || ""; },
  set token(v){ v ? localStorage.setItem("sid_token", v) : localStorage.removeItem("sid_token"); },
  get username(){ return localStorage.getItem("sid_username") || ""; },
  set username(v){ v ? localStorage.setItem("sid_username", v) : localStorage.removeItem("sid_username"); }
};

// Helpers visuales
function showAuth(){ loginContainer.classList.remove("hidden"); appSection.classList.add("hidden"); authMsg.textContent=""; clearAlert(); }
function showApp(){ loginContainer.classList.add("hidden"); appSection.classList.remove("hidden"); welcome.textContent = `Hola, ${storage.username || "usuario"}`; }
function showAlert(type, text){ authAlert.innerHTML = `<div class="alert ${type === "error" ? "alert--error" : "alert--success"}">${text}</div>`; }
function clearAlert(){ authAlert.innerHTML = ""; }
function markInvalid(el){ el.classList.remove("is-valid"); el.classList.add("is-invalid"); }
function markValid(el){ el.classList.remove("is-invalid"); el.classList.add("is-valid"); }
function resetFieldStates(){ [inpUser, inpPass].forEach(el=>el.classList.remove("is-valid","is-invalid")); }
function shake(el){ el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }

// Auth: Login
loginButton.addEventListener("click", async (e)=>{
  e.preventDefault();
  clearAlert(); authMsg.textContent = "";

  const u = inpUser.value.trim();
  const p = inpPass.value;

  // Validación previa por longitud
  let ok = true;
  if (u.length < 3){ markInvalid(inpUser); ok = false; } else { markValid(inpUser); }
  if (p.length < 4){ markInvalid(inpPass); ok = false; } else { markValid(inpPass); }

  if (!ok){
    showAlert("error", "Usuario mínimo 3 caracteres y contraseña mínimo 4.");
    shake(authForm);
    return;
  }

  authMsg.textContent = "Autenticando...";
  try {
    const data = await apiLogin(u, p);
    if (!data?.token) throw new Error("Respuesta inesperada en login");

    // Éxito → token y estados en verde
    storage.token = data.token;
    storage.username = u;
    markValid(inpUser);
    markValid(inpPass);

    showApp();
    await loadLeaderboard();
    clearAlert();
    authMsg.textContent = "";
  } catch (err){
    // Fallo real del servidor → marcar en rojo
    showAlert("error", "Usuario o contraseña incorrectos.");
    shake(authForm);
    authMsg.textContent = "";
    markInvalid(inpUser);
    markInvalid(inpPass);
  }
});

// Auth: Register
registerButton.addEventListener("click", async ()=>{
  clearAlert(); authMsg.textContent = "";

  const u = inpUser.value.trim();
  const p = inpPass.value;

  // Validación previa por longitud
  let ok = true;
  if (u.length < 3){ markInvalid(inpUser); ok = false; } else { markValid(inpUser); }
  if (p.length < 4){ markInvalid(inpPass); ok = false; } else { markValid(inpPass); }

  if (!ok){
    showAlert("error", "Usuario mínimo 3 caracteres y contraseña mínimo 4.");
    shake(authForm);
    return;
  }

  authMsg.textContent = "Registrando...";
  try {
    await apiRegister(u, p);

    // Éxito → verde y alerta positiva
    authMsg.textContent = "";
    showAlert("success", "Registro completado. Ahora inicia sesión.");
    markValid(inpUser);
    markValid(inpPass);
  } catch (err){
    // Fallo → rojo y shake
    authMsg.textContent = "";
    showAlert("error", "No se pudo registrar (¿usuario ya existe?).");
    shake(authForm);
    markInvalid(inpUser);
    markInvalid(inpPass);
  }
});

// Logout
logoutButton.addEventListener("click", ()=>{
  storage.token = "";
  storage.username = "";
  clearAlert();
  authMsg.textContent = "";
  resetFieldStates();
  showAuth();
});

// Score
btnUpdateScore.addEventListener("click", async ()=>{
  const s = Number(inpScore.value);
  if (Number.isNaN(s) || s < 0){
    updateMsg.textContent = "Score inválido.";
    return;
  }
  updateMsg.textContent = "Actualizando...";
  try {
    await apiUpdateScore(storage.token, storage.username, s);
    updateMsg.textContent = "Score actualizado.";
    await loadLeaderboard();
  } catch (err){
    updateMsg.textContent = `Error: ${err.message}`;
  }
});

// Leaderboard
btnRefresh.addEventListener("click", loadLeaderboard);

async function loadLeaderboard(){
  listMsg.textContent = "Cargando...";
  tblBody.innerHTML = "";
  try {
    const data = await apiListUsers(storage.token);
    const users = (data?.usuarios || []).sort((a,b)=> (b.score ?? 0) - (a.score ?? 0)).reverse();
    users.forEach((u,i)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i+1}</td><td>${u.username ?? "-"}</td><td>${u.score ?? 0}</td>`;
      tblBody.appendChild(tr);
    });
    listMsg.textContent = `Total: ${users.length}`;
  } catch (err){
    listMsg.textContent = `Error al listar: ${err.message}`;
  }
}

// Auto-init
(async ()=>{
  if (storage.token){
    try {
      await apiValidateToken(storage.token);
      showApp();
      loadLeaderboard();
    } catch {
      storage.token = "";
      showAuth();
    }
  } else {
    showAuth();
  }
})();
