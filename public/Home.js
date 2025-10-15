import { supabase } from "./supabase.js";

// =======================
// STORAGE CLEANUP HELPER
// =======================
async function deleteDocumentImages(documentId) {
    try {
        console.log(`🗑️ Deleting images for document: ${documentId}`);

        // List all files and folders inside this document’s folder
        const { data: files, error: listError } = await supabase.storage
            .from("CelulaAnimalImgs") // ✅ your bucket name
            .list(documentId, { limit: 1000 });

        if (listError) {
            console.warn("⚠️ Failed to list folder:", listError.message);
            return;
        }

        // If there are no files or folders, nothing to do
        if (!files || files.length === 0) {
            console.log("📂 No images to delete for", documentId);
            return;
        }

        // Collect all paths (files and subfiles)
        const pathsToDelete = [];

        for (const f of files) {
            if (f.name.includes(".")) {
                // It's a file directly in /documentId/
                pathsToDelete.push(`${documentId}/${f.name}`);
            } else {
                // It's a folder — list its contents too
                const { data: subFiles } = await supabase.storage
                    .from("CelulaAnimalImgs")
                    .list(`${documentId}/${f.name}`);
                for (const sf of subFiles) {
                    pathsToDelete.push(`${documentId}/${f.name}/${sf.name}`);
                }
            }
        }

        if (pathsToDelete.length === 0) return;

        // Delete all files in one call
        const { error: deleteError } = await supabase.storage
            .from("CelulaAnimalImgs")
            .remove(pathsToDelete);

        if (deleteError) {
            console.error("❌ Failed to delete storage files:", deleteError.message);
        } else {
            console.log(`✅ Deleted ${pathsToDelete.length} files for document ${documentId}`);
        }
    } catch (err) {
        console.error("⚠️ deleteDocumentImages failed:", err);
    }
}


async function testConnection() {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error("Auth session error:", error);
    else console.log("✅ Supabase connected, session:", data);
}

testConnection();

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
        .select("id, title, created_at, updated_at")   // ✅ use title
        .eq("creator", user.email)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching documents:", error);
        return;
    }

    container.innerHTML = "";

    data.forEach(doc => {
        const card = document.createElement("div");
        card.classList.add("project-card");
        card.id = doc.id;

        const title = document.createElement("div");
        title.classList.add("project-title");
        title.textContent = doc.title || doc.id;   // ✅ use title

        const thumbnail = document.createElement("img");
        thumbnail.classList.add("project-thumbnail");
        thumbnail.src = "https://via.placeholder.com/220x140?text=Thumbnail";
        thumbnail.alt = "Project Thumbnail";

        card.appendChild(thumbnail);
        card.appendChild(title);

        card.addEventListener("click", () => {
            window.location.href = `MentoriCelulaAnimal/Editor/editor.html?id=${encodeURIComponent(doc.id)}`;
        });

        // Actions container
        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.justifyContent = "space-between";
        actions.style.padding = "0 10px 10px";

        // Rename button
        const renameBtn = document.createElement("button");
        renameBtn.textContent = "Renombrar";
        renameBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const newTitle = prompt("Enter new title for this document:", doc.title || "");
            if (newTitle) {
                const { error: updateError } = await supabase
                    .from("documents")
                    .update({ title: newTitle, updated_at: new Date().toISOString() })  // ✅ title
                    .eq("id", doc.id);
                if (updateError) {
                    console.error("Rename error:", updateError);
                } else {
                    title.textContent = newTitle;
                }
            }
        });

        // Delete button (unchanged)
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Borrar";
        deleteBtn.style.color = "red";
        deleteBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!confirm("¿Seguro que quieres borrar este documento y sus imágenes?")) return;

            try {
                // 1️⃣ Delete the document record
                const { error: deleteError } = await supabase
                    .from("documents")
                    .delete()
                    .eq("id", doc.id);

                if (deleteError) throw deleteError;

                // 2️⃣ Delete all its images from the bucket
                await deleteDocumentImages(doc.id);

                // 3️⃣ Remove the card from the UI
                card.remove();
                console.log(`✅ Deleted document ${doc.id} and its images`);
            } catch (err) {
                console.error("❌ Delete error:", err);
                alert("Error al borrar el documento: " + err.message);
            }
        });


        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);
        card.appendChild(actions);

        container.appendChild(card);
    });
}

createBtn.addEventListener("click", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
        const newId = nanoid();
        const { data: doc, error } = await supabase
            .from("documents")
            .insert([{
                id: newId,
                creator: user.email,
                owner_id: user.id,              // ✅ added
                title: "Untitled Document"
            }])
            .select()
            .single();

        if (error) {
            console.error("Error creating document:", error);
            return;
        }

        window.location.href = `MentoriCelulaAnimal/Editor/editor.html?id=${encodeURIComponent(doc.id)}`;
    } else {
        window.location.href = "https://mentorigroup.com/MentoriCelulaAnimal/Editor/editor.html";
    }
});

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

        // Close popup when clicking on the background (not its children)
        sharePopup.addEventListener("click", (event) => {
            if (event.target === sharePopup) {
                sharePopup.classList.remove("active");
            }
        });
    }

    if (copyBtn && urlDiv) {
        copyBtn.addEventListener("click", async () => {
            const textToCopy = urlDiv.textContent.trim();
            try {
                await navigator.clipboard.writeText(textToCopy);
                copyBtn.textContent = "✔";
                setTimeout(() => (copyBtn.textContent = "Copiar link"), 1500);
            } catch (err) {
                console.error("Failed to copy: ", err);
            }
        });
    }
});
