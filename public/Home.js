// Import Supabase client
import { supabase } from "./supabase.js";
import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid/nanoid.js";

const userDiv = document.getElementById("user");
const createBtn = document.getElementById("documents-main-create-section-create-celula");

// =======================
// AUTH HELPERS
// =======================

// Login / Signup (Google OAuth)
async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            // Make sure this EXACT path is added in Google Console Authorized Redirect URIs
            redirectTo: `${location.origin}/MentoriCélula/Editor/editor.html`
        }
    });
    if (error) console.error("Login error:", error.message);
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    renderUser(null);
}

// =======================
// UI RENDERING
// =======================
function renderUser(user) {
    if (user) {
        userDiv.innerHTML = `
      <span style="color:white; margin-right: 10px;">${user.email}</span>
      <button id="logout">Cerrar sesión</button>
    `;
        document.getElementById("logout").addEventListener("click", logout);
    } else {
        userDiv.innerHTML = `
      <button id="login">Iniciar sesión</button>
      <button id="signup">Registrarse</button>
    `;
        document.getElementById("login").addEventListener("click", login);
        document.getElementById("signup").addEventListener("click", login);
    }
}

// =======================
// INITIAL SESSION
// =======================
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    renderUser(session?.user ?? null);
    listUserDocs();
})();

supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user ?? null);
    listUserDocs();
});

// =======================
// LOAD USER DOCUMENTS
// =======================
async function listUserDocs() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const container = document.getElementById("documents-main-projects-section-projects");

    if (!user) {
        container.innerHTML = "";
        return;
    }

    const { data, error } = await supabase
        .from("documents")
        .select("id, created_at, updated_at")
        .eq("creator", user.email)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching documents:", error);
        return;
    }

    container.innerHTML = "";
    data.forEach(doc => {
        const a = document.createElement("a");
        a.href = `/MentoriCélula/Editor/editor.html?id=${encodeURIComponent(doc.id)}`;
        a.textContent = `${doc.id} — last saved ${new Date(doc.updated_at).toLocaleString()}`;
        a.classList.add("project-link");
        container.appendChild(a);
    });
}

// =======================
// CREATE NEW FILE
// =======================
createBtn.addEventListener("click", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    const newId = nanoid();

    if (user) {
        const { data: doc, error } = await supabase
            .from("documents")
            .insert([{ id: newId, creator: user.email, content: "" }])
            .select()
            .single();

        if (error) {
            console.error("Error creating document:", error);
            return;
        }

        window.location.href = `/MentoriCélula/Editor/editor.html?id=${encodeURIComponent(doc.id)}`;
    } else {
        window.location.href = `/MentoriCélula/Editor/editor.html?id=${encodeURIComponent(newId)}&guest=true`;
    }
});
