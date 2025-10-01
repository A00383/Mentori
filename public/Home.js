// Import Supabase client
import { supabase } from "./supabase.js";
import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid/nanoid.js";

const userDiv = document.getElementById("user");
const createBtn = document.getElementById("documents-main-create-section-create-celula-animal-make");

// =======================
// AUTH HELPERS
// =======================

// Login / Signup (Google OAuth)
async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            // Redirect back to the current page (homepage) after login
            redirectTo: `${location.origin}${location.pathname}`
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
    `;
        document.getElementById("login").addEventListener("click", login);
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
        // Create project card
        const card = document.createElement("div");
        card.classList.add("project-card");
        card.id = doc.id; // Use the document's ID as the div's ID

        // Project title
        const title = document.createElement("div");
        title.classList.add("project-title");
        title.textContent = doc.id; // or any custom title

        // Project thumbnail (placeholder for now)
        const thumbnail = document.createElement("img");
        thumbnail.classList.add("project-thumbnail");
        thumbnail.src = "https://via.placeholder.com/220x140?text=Thumbnail"; // placeholder
        thumbnail.alt = "Project Thumbnail";

        // Append title and thumbnail to card
        card.appendChild(thumbnail);
        card.appendChild(title);

        // Add click handler to open editor for this project
        card.addEventListener("click", () => {
            window.location.href = `MentoriCelulaAnimal/Editor/editor.html?id=${encodeURIComponent(doc.id)}`;
        });

        // Add card to container
        container.appendChild(card);
    });
}

// =======================
// CREATE NEW FILE
// =======================
createBtn.addEventListener("click", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
        // User is logged in → create a new document in Supabase
        const newId = nanoid();
        const { data: doc, error } = await supabase
            .from("documents")
            .insert([{ id: newId, creator: user.email, content: "" }])
            .select()
            .single();

        if (error) {
            console.error("Error creating document:", error);
            return;
        }

        window.location.href = `MentoriCelulaAnimal/Editor/editor.html?id=${encodeURIComponent(doc.id)}`;
    } else {
        // Guest user → go directly to static editor
        window.location.href = "https://mentorigroup.com/MentoriCelulaAnimal/Editor/editor.html";
    }
});
//General share button//
document.addEventListener("DOMContentLoaded", () => {
    const sharePopup = document.getElementById("general-share-pop-up");
    const shareBtn = document.getElementById("general-celula-animal-share-button");
    const closeShareBtn = document.getElementById("general-share-pop-up-close-button");
    const copyBtn = document.getElementById("general-share-pop-up-copy-button");
    const urlDiv = document.getElementById("general-share-pop-up-url");

    if (shareBtn && sharePopup && closeShareBtn) {
        shareBtn.addEventListener("click", () => {
            sharePopup.classList.add("active");
        });

        closeShareBtn.addEventListener("click", () => {
            sharePopup.classList.remove("active");
        });
    }

    if (copyBtn && urlDiv) {
        copyBtn.addEventListener("click", async () => {
            const textToCopy = urlDiv.textContent.trim();
            try {
                await navigator.clipboard.writeText(textToCopy);
                // optional feedback
                copyBtn.textContent = "✔";
                setTimeout(() => (copyBtn.textContent = "Copiar link"), 1500);
            } catch (err) {
                console.error("Failed to copy: ", err);
            }
        });
    }
});
