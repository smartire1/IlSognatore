import { supabase } from "./supabase-config.js";

/* === ELEMENTI DOM === */
const adminApp = document.getElementById("admin-app");
const logoutBtn = document.getElementById("logout-btn");

/* === LOGOUT === */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
}

/* === CHECK SESSION === */
async function checkSession() {
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    adminApp?.classList.remove("d-none");
  } else {
    window.location.href = 'login.html';
  }
}

checkSession();
