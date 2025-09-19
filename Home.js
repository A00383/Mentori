import { supabase } from "./supabase.js";

const userDiv = document.getElementById("user");

// ---- Auth Helpers ----

// Login / Signup (Google OAuth)
async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${location.origin}/editor.html`
        }
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
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    renderUser(session?.user ?? null);
})();

// ---- Listen for Auth Changes ----
supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user ?? null);
});

// ---- Load User Documents ----
async function listUserDocs() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

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

const createBtn = document.getElementById("documents-main-create-section-create-celula");

createBtn.addEventListener("click", async () => {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        alert("Debes iniciar sesión para crear un archivo.");
        return;
    }

    // Insert a new document
    const { data, error } = await supabase
        .from("documents")
        .insert([
            {
                creator: user.email,
                content: "", // start empty, or you can set a default template
            },
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating document:", error);
        return;
    }

    // Redirect to editor.html?id=new_doc_id
    window.location.href = `/editor.html?id=${encodeURIComponent(data.id)}`;
});