import { supabase } from "./supabase.js";

const loginBtn = document.getElementById("login");
const signupBtn = document.getElementById("signin");
const userDiv = document.getElementById("user");

// Handle Google login
loginBtn.addEventListener("click", async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
    });
    if (error) console.error("Login error:", error.message);
});

// Handle logout
async function logout() {
    await supabase.auth.signOut();
    renderUser(null);
}

// Render user state
function renderUser(user) {
    if (user) {
        userDiv.innerHTML = `
      <span style="color:white; margin-right: 10px;">
        ${user.email}
      </span>
      <button id="logout">Cerrar sesión</button>
    `;
        document.getElementById("logout").addEventListener("click", logout);
    } else {
        userDiv.innerHTML = `
      <button id="login">Iniciar sesión</button>
      <button id="signin">Registrarse</button>
    `;
        document.getElementById("login").addEventListener("click", async () => {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
            });
            if (error) console.error("Login error:", error.message);
        });
    }
}

// Check session on load
supabase.auth.getSession().then(({ data: { session } }) => {
    renderUser(session?.user ?? null);
});

// Listen for login/logout changes
supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user ?? null);
});