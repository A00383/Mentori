// -----------------------------
// --- Handle Supabase OAuth hash ---
// -----------------------------
import { supabase, IMGS_BUCKET } from '../../supabase.js';

(async () => {
    if (window.location.hash.includes("access_token")) {
        // Let Supabase process the OAuth hash into a session first
        await supabase.auth.getSession();

        // Clean the URL (remove hash, keep query string)
        const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
        window.history.replaceState({}, document.title, cleanUrl);
    }
})();

// -----------------------------
// DOM Elements
// -----------------------------
const popup = document.getElementById('pop-up');
const closepopup = document.getElementById('close-pop-up');
const popupmessage = document.getElementById('pop-up-message');
const popupimagecontainer = document.getElementById("pop-up-image-section-images");
const popupname = document.getElementById('pop-up-name');
const mainorganelname = document.getElementById('organelo');
const organelos = document.querySelectorAll('.organelos');

const savebtn = document.getElementById("savebtn");
const switchviewbtn = document.getElementById("switch-mode-btn");
const saveonlinebutton = document.getElementById("save-online-btn");
const loadInput = document.getElementById("mainload");
const loadBtn = document.getElementById("loadbtn");
const mainimagesContainer = document.getElementById("main-image-images");
const copyBtn = document.getElementById('copybtn');
const returnHomeBtn = document.getElementById("return-homebtn");
const userDiv = document.getElementById("user");

// Organelles
const membranacelular = document.getElementById('membrana celular');
const ribosomas = document.getElementById('ribosomas');
const citoplasma = document.getElementById('citoplasma');
const nucleolo = document.getElementById('nucleolo');
const nucleo = document.getElementById('nucleo');
const reticuloendoplasmatico = document.getElementById('reticulo endoplasmatico');
const centriolos = document.getElementById('centriolos');
const microtubulos = document.getElementById('microtubulos');
const mitocondrias = document.getElementById('mitocondrias');
const lisosomas = document.getElementById('lisosomas');
const aparatodegolgi = document.getElementById('aparato de golgi');

// -----------------------------
// State
// -----------------------------
let currentogranel = null;

//-----------------------------
//Organelles column map
//------------------------------
const ORGANELLE_COLUMN_MAP = {
    // DOM element id            // SQL column
    "membrana celular": "membrana_celular_content",
    "citoplasma": "citoplasma_content",
    "nucleolo": "nucleolo_content",
    "nucleo": "nucleo_content",
    "reticulo endoplasmatico": "reticulo_endoplasmatico_content",
    "centriolos": "centriolos_content",
    "microtubulos": "microtubulos_content",
    "mitocondrias": "mitocondrias_content",
    "lisosomas": "lisosomas_content",
    "aparato de golgi": "aparato_de_golgi_content",
    "ribosomas": "ribosomas_content"
};
// -----------------------------
// Auth Helpers
// -----------------------------
async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

async function login() {
    const currentParams = new URLSearchParams(window.location.search);
    const docId = currentParams.get("id"); // preserve the doc id
    const redirectUrl = `${window.location.origin}/MentoriCelulaAnimal/Viewer/view.html${docId ? `?id=${docId}` : ""}`;

    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl }
    });

    if (error) {
        console.error("Inicio de sesión fallido:", error.message);
        alert("Inicio de sesión fallido: " + error.message);
    }
}

async function logout() {
    const currentParams = new URLSearchParams(window.location.search);
    const docId = currentParams.get("id");

    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Logout error:", error.message);
        alert("Falla al cerrar sesión: " + error.message);
        return;
    }

    window.location.href = `${location.origin}/MentoriCelulaAnimal/Viewer/view.html${docId ? `?id=${docId}` : ""}`;
}

async function renderUser() {
    const user = await getCurrentUser();
    userDiv.innerHTML = "";

    if (user) {
        const emailSpan = document.createElement("span");
        emailSpan.textContent = user.email ?? "";
        emailSpan.classList.add("mr-2");

        const logoutBtn = document.createElement("button");
        logoutBtn.textContent = "Cerrar sesión";
        logoutBtn.addEventListener("click", logout);

        userDiv.appendChild(emailSpan);
        userDiv.appendChild(logoutBtn);
    } else {
        const loginBtn = document.createElement("button");
        loginBtn.textContent = "Iniciar sesión";
        loginBtn.addEventListener("click", login);
        userDiv.appendChild(loginBtn);
    }
}

// ✅ Ensure session restored before rendering
window.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.log("No active session");
    }
    await renderUser();
});

// Re-render user on auth changes
supabase.auth.onAuthStateChange((_event, session) => {
    console.log("Auth state changed:", _event, session);
    renderUser();
});

// -----------------------------
// Helpers
// -----------------------------
function gatherViewerContent() {
    return {
        description: document.getElementById("description").value || "",
        mainImages: [...mainimagesContainer.querySelectorAll("img")].map(img => img.src),
        organelos: [...organelos].map(organelo => ({
            id: organelo.id || null,
            content: organelo.dataset.content || "",
            image: organelo.dataset.image ? JSON.parse(organelo.dataset.image) : [],
        }))
    };
}

function populateViewerWithContent(data) {
    document.getElementById("description").value = data.description || "";

    mainimagesContainer.innerHTML = "";
    (data.mainImages || []).forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.classList.add("main-image");
        mainimagesContainer.appendChild(img);
    });

    (data.organelos || []).forEach((item, index) => {
        let target = item.id ? document.getElementById(item.id) : organelos[index];
        if (target) {
            target.dataset.content = item.content || "";
            target.dataset.image = JSON.stringify(item.image || []);
        }
    });
}

// ----------------------
// Copy Helpers (same as editor)
// ----------------------
async function copyDocumentImages(oldId, newId) {
    console.log(`📦 Copying images from ${oldId} → ${newId}`);

    const { data: files, error } = await supabase.storage
        .from(IMGS_BUCKET)
        .list(oldId, { limit: 1000 });

    if (error) {
        console.warn("⚠️ Failed to list source folder:", error.message);
        return;
    }

    for (const f of files) {
        if (f.name.includes(".")) {
            // File directly under /oldId
            await copyFile(`${oldId}/${f.name}`, `${newId}/${f.name}`);
        } else {
            // Folder — recurse
            const { data: subFiles } = await supabase.storage
                .from(IMGS_BUCKET)
                .list(`${oldId}/${f.name}`);
            for (const sf of subFiles) {
                await copyFile(
                    `${oldId}/${f.name}/${sf.name}`,
                    `${newId}/${f.name}/${sf.name}`
                );
            }
        }
    }

    console.log(`✅ Finished copying images for ${newId}`);
}

async function copyFile(srcPath, destPath) {
    const { data, error } = await supabase.storage
        .from(IMGS_BUCKET)
        .download(srcPath);
    if (error) {
        console.warn("⚠️ Failed to download file:", srcPath, error.message);
        return;
    }

    const blob = data;
    const { error: uploadError } = await supabase.storage
        .from(IMGS_BUCKET)
        .upload(destPath, blob, { upsert: true });
    if (uploadError) {
        console.warn("⚠️ Failed to upload file:", destPath, uploadError.message);
    } else {
        console.log(`📁 Copied ${srcPath} → ${destPath}`);
    }
}


// -----------------------------
// Pop-up logic (read-only)
// -----------------------------
organelos.forEach(selectedorganel => {
    selectedorganel.addEventListener('click', () => {
        currentogranel = selectedorganel;
        popupmessage.value = selectedorganel.dataset.content || "";
        popupimagecontainer.innerHTML = "";

        if (selectedorganel.dataset.image) {
            const imgs = JSON.parse(selectedorganel.dataset.image);
            imgs.forEach(src => {
                const popupimg = document.createElement("img");
                popupimg.src = src;
                popupimg.classList.add("pop-up-image");
                popupimagecontainer.appendChild(popupimg);
            });
        }

        popup.classList.add('active');
    });
});

if (closepopup) {
    closepopup.addEventListener("click", () => popup.classList.remove("active"));
}

popup.addEventListener('click', (e) => {
    if (e.target === popup) popup.classList.remove('active');
});

// -----------------------------
// Local save (.txt)
// -----------------------------
if (savebtn) {
    savebtn.addEventListener("click", () => {
        const content = gatherViewerContent();
        const blob = new Blob([JSON.stringify(content, null, 2)], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "datasets.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

const overlay = document.getElementById("image-viewer-overlay");
const overlayImg = document.getElementById("image-viewer-img");
const closeoverlayBtn = document.getElementById("close-image-viewer");

// Handle clicks on any image
const imageContainers = [
    document.getElementById("main-image-images"),
    document.getElementById("pop-up-image-section-images")
];

// Attach listener to each (if it exists)
imageContainers.forEach(container => {
    if (!container) return;

    container.addEventListener("click", (e) => {
        const img = e.target.closest("img");
        if (!img) return;

        else {
            openImageViewer(img.src);
        }
    });
});

// Open the image viewer
function openImageViewer(src) {
    overlayImg.src = src;
    overlay.classList.remove("hidden");

    // prevent clicks from closing other popups
    overlay.addEventListener("click", handleOverlayClick);
}

// Close viewer
function closeImageViewer() {
    overlay.classList.add("hidden");
    overlayImg.src = "";
    overlay.removeEventListener("click", handleOverlayClick);
}

// Click outside image closes viewer
function handleOverlayClick(e) {
    if (e.target === overlay) {
        closeImageViewer();
    }
}

closeoverlayBtn.addEventListener("click", closeImageViewer);

// -----------------------------
// Supabase Online Save (disabled in Viewer)
// -----------------------------
if (saveonlinebutton) {
    saveonlinebutton.addEventListener("click", () => {
        alert("Guardado online no disponible en modo vista.");
    });
}


//------------------------------
// Load Document On Start-up (Public & Private Safe)
//------------------------------
window.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Loading document...");

    const docId = new URLSearchParams(window.location.search).get("id");
    if (!docId) {
        console.warn("❌ No document ID in URL");
        return;
    }

    // Check if user is logged in
    let session = null;
    try {
        const { data } = await supabase.auth.getSession();
        session = data?.session || null;
        await renderUser();
    } catch (err) {
        console.warn("⚠️ Could not restore session:", err);
    }

    const isLoggedIn = !!session;
    console.log("👤 Logged in?", isLoggedIn);

    // Base Supabase public URL
    const supabaseUrl = supabase.supabaseUrl || supabase.storageUrl || supabase.rest?.url;
    const projectMatch = supabaseUrl?.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    const projectRef = projectMatch ? projectMatch[1] : "unknown";
    const basePublicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${IMGS_BUCKET}`;

    try {
        //--------------------------------
        // 1️⃣ Load document content
        //--------------------------------
        const doc = await loadDocumentById(docId);
        if (!doc) throw new Error("Documento no encontrado");

        const descriptionInput = document.getElementById("description");
        if (descriptionInput && doc.content?.description) {
            descriptionInput.value = doc.content.description;
        }

        //--------------------------------
        // 2️⃣ Load main images (/main_imgs/)
        //--------------------------------
        const mainImagesContainer = document.getElementById("main-image-images");
        mainImagesContainer.innerHTML = "";

        const mainImgs = await listFolderImages(`${docId}/main_imgs`, basePublicUrl);
        if (mainImgs.length > 0) {
            for (const url of mainImgs) {
                const img = document.createElement("img");
                img.src = url;
                img.classList.add("main-image");
                mainImagesContainer.appendChild(img);
            }
        } else {
            console.log("ℹ️ No main images found for document");
        }

        //--------------------------------
        // 3️⃣ Load organelle text data
        //--------------------------------
        const { data: organelles, error: orgErr } = await supabase
            .from("organelles")
            .select("*")
            .eq("document_id", docId);

        if (orgErr) throw orgErr;

        if (organelles && organelles.length === 1) {
            const orgRow = organelles[0];
            for (const domId in ORGANELLE_COLUMN_MAP) {
                const col = ORGANELLE_COLUMN_MAP[domId];
                const el = document.getElementById(domId);
                if (el) el.dataset.content = orgRow[col] ?? "";
            }
        }

        //--------------------------------
        // 4️⃣ Load organelle images (folders per organelle)
        //--------------------------------
        for (const domId in ORGANELLE_COLUMN_MAP) {
            const folderName = domId.replaceAll(" ", "_").toLowerCase();
            const el = document.getElementById(domId);
            if (!el) continue;

            const urls = await listFolderImages(`${docId}/${folderName}`, basePublicUrl);
            el.dataset.image = JSON.stringify(urls);
        }

        console.log("✅ Document loaded successfully");
    } catch (err) {
        console.error("❌ Error loading document:", err);
        alert("No se pudo cargar el documento: " + err.message);
    }
});


// 🧩 Helper: List images in a folder (public-safe)
async function listFolderImages(path, basePublicUrl) {
    try {
        // Always attempt listing — works for both public and logged-in buckets
        const { data, error } = await supabase.storage
            .from(IMGS_BUCKET)
            .list(path, { limit: 100 });

        if (error) {
            console.warn("⚠️ Error listing folder:", path, error.message);
            return [];
        }

        if (!data || data.length === 0) return [];

        // Accept all standard formats
        return data
            .filter(f =>
                /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name)
            )
            .map(f => `${basePublicUrl}/${path}/${f.name}`);
    } catch (err) {
        console.warn("⚠️ Could not list images for", path, err.message);
        return [];
    }
}


// -----------------------------
// Helper: Load document by ID (safe JSON parsing)
// -----------------------------
async function loadDocumentById(id) {
    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (typeof data.content === "string") {
        try {
            data.content = JSON.parse(data.content);
        } catch {
            console.warn("⚠️ Could not parse document content JSON");
            data.content = {};
        }
    }

    return data;
}




import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid/nanoid.js";

// -----------------------------
// Copy Button (duplicate doc)
// -----------------------------
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const docId = new URLSearchParams(window.location.search).get("id");
        if (!docId) {
            alert("No se encontró un documento que copiar.");
            return;
        }

        try {
            const originalDoc = await loadDocumentById(docId);
            if (!originalDoc) {
                alert("Documento no encontrado.");
                return;
            }

            const user = await getCurrentUser();
            if (!user) {
                alert("Debes estar dentro de una sesión para crear una copia.");
                return;
            }

            // ✅ generate a new unique id
            const newId = nanoid();

            // ✅ clone the content safely
            const newContent = JSON.parse(JSON.stringify(originalDoc.content || {}));

            // ✅ insert the new document owned by the user
            const { data, error } = await supabase
                .from("documents")
                .insert([{
                    id: newId,
                    creator: user.email,
                    owner_id: user.id,
                    content: newContent,
                    copy_counter: (originalDoc.copy_counter || 0) + 1,
                }])
                .select()
                .maybeSingle();

            if (error) throw error;

            // ✅ copy all associated images from old → new
            await copyDocumentImages(docId, newId);

            // ✅ redirect to editor view of the new doc
            window.location.href = `../Editor/editor.html?id=${encodeURIComponent(newId)}`;
        } catch (err) {
            console.error("Copy failed:", err);
            alert("Error al copiar el documento: " + (err.message || err));
        }
    });
}


// -----------------------------
// Load local .txt dataset
// -----------------------------
if (loadBtn && loadInput) {
    loadBtn.addEventListener("click", () => loadInput.click());
    loadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                populateViewerWithContent(data);
                alert("Contenido cargado correctamente!");
            } catch {
                alert("Error: el archivo no es un JSON valido.");
            }
        };
        reader.readAsText(file);
        loadInput.value = "";
    });
}

//---------------------
// Return home button
//---------------------
if (returnHomeBtn) {
    returnHomeBtn.addEventListener("click", () => {
        window.location.href = "/index.html";
    });
}

//Image overlay


// -----------------------------
// Organelles hover + click names
// -----------------------------
function setupOrganelName(organel, displayName) {
    if (!organel) return;
    organel.addEventListener('click', () => { popupname.textContent = displayName; });
    organel.addEventListener('mouseenter', () => { mainorganelname.textContent = displayName; });
    organel.addEventListener('mouseleave', () => { mainorganelname.textContent = "Célula animal"; });
}

setupOrganelName(membranacelular, "Membrana celular");
setupOrganelName(citoplasma, "Citoplasma");
setupOrganelName(ribosomas, "Ribosomas");
setupOrganelName(nucleolo, "Nucléolo");
setupOrganelName(nucleo, "Núcleo");
setupOrganelName(reticuloendoplasmatico, "Retículo endoplasmático");
setupOrganelName(centriolos, "Centriolos");
setupOrganelName(microtubulos, "Microtúbulos");
setupOrganelName(mitocondrias, "Mitocondrias");
setupOrganelName(lisosomas, "Lisosomas");
setupOrganelName(aparatodegolgi, "Aparato de Golgi");

if (switchviewbtn) {
    switchviewbtn.addEventListener("click", () => {
        const docId = new URLSearchParams(window.location.search).get("id");
        if (!docId) {
            alert("No se encontró un ID de documento. Guarda el documento antes de cambiar a modo visor.");
            return;
        }
        const viewerUrl = `https://mentorigroup.com/MentoriCelulaAnimal/Editor/editor.html?id=${docId}`;
        window.open(viewerUrl, "_blank"); // opens in new tab
        // Or use window.location.href = viewerUrl; if you want to replace instead of opening
    });
}
