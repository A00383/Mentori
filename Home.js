import { supabase } from "./supabase.js";

const userDiv = document.getElementById("user");

// ---- Auth Helpers ----

// Login / Signup (Google OAuth)
async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
    });
    if (error) console.error("Login error:", error.message);
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    renderUser(null);
}

// ---- UI Rendering ----
function renderUser(user) {
    if (user) {
        // Logged in
        userDiv.innerHTML = `
      <span style="color:white; margin-right: 10px;">
        ${user.email}
      </span>
      <button id="logout">Cerrar sesión</button>
    `;
        document.getElementById("logout").addEventListener("click", logout);
    } else {
        // Logged out
        userDiv.innerHTML = `
      <button id="login">Iniciar sesión</button>
      <button id="signup">Registrarse</button>
    `;
        document.getElementById("login").addEventListener("click", login);
        document.getElementById("signup").addEventListener("click", login);
    }
}

// ---- Initial Session ----
supabase.auth.getSession().then(({ data: { session } }) => {
    renderUser(session?.user ?? null);
});

// ---- Listen for Auth Changes ----
supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user ?? null);
});

import { supabase } from './supabase.js';

async function listUserDocs() {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
        // hide projects UI or show message
        return;
    }
    const email = user.email;
    const { data, error } = await supabase
        .from('documents')
        .select('id, created_at, updated_at')
        .eq('creator', email)
        .order('updated_at', { ascending: false });

    if (error) return console.error(error);

    const container = document.getElementById('documents-main-projects-section');
    container.innerHTML = '';
    data.forEach(doc => {
        const a = document.createElement('a');
        a.href = `/editor.html?id=${encodeURIComponent(doc.id)}`;
        a.textContent = `${doc.id} — last saved ${new Date(doc.updated_at).toLocaleString()}`;
        a.classList.add('project-link');
        container.appendChild(a);
    });
}

// call on page load
listUserDocs();
// also consider subscribing to auth state changes to refresh list when user logs in/out

import { supabase } from './supabase.js'; // adjust path as your project uses
const loginBtn = document.getElementById('login');

loginBtn.addEventListener('click', async () => {
    // redirectTo should point to the editor page where you handle session + redirect logic
    const redirect = `${location.origin}/editor.html`;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirect }
    });
    if (error) console.error('OAuth sign-in error', error);
    // supabase will redirect the browser to Google; after successful sign-in
    // Google -> Supabase -> redirectTo (editor.html)
});