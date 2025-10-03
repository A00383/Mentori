// -----------------------------
// --- Handle Supabase OAuth hash ---
// -----------------------------
import { supabase } from '/supabase.js';

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

// -----------------------------
// Supabase Online Save (disabled in Viewer)
// -----------------------------
if (saveonlinebutton) {
    saveonlinebutton.addEventListener("click", () => {
        alert("Guardado online no disponible en modo vista.");
    });
}

// -----------------------------
// Supabase load
// -----------------------------
async function loadDocumentById(id) {
    const { data, error } = await supabase.from('documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

window.addEventListener('DOMContentLoaded', async () => {
    const docId = new URLSearchParams(window.location.search).get("id");
    if (!docId) return;

    try {
        const doc = await loadDocumentById(docId);
        if (!doc) {
            alert("Documento no encontrado.");
            return;
        }

        if (doc.content) {
            const parsedContent = typeof doc.content === "string"
                ? JSON.parse(doc.content)
                : doc.content;
            populateViewerWithContent(parsedContent);
        }

    } catch (err) {
        console.error("Failed to load document:", err);
        alert("Error al cargar el contenido.");
    }
});

import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid/nanoid.js";

// -----------------------------
// Copy Button (duplicate doc)
// -----------------------------
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const docId = new URLSearchParams(window.location.search).get("id");
        if (!docId) {
            alert("No se encontro un documento que copiar.");
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

            const { data, error } = await supabase
                .from("documents")
                .insert([{
                    id: newId,
                    creator: user.email,
                    content: newContent
                }])
                .select()
                .maybeSingle();

            if (error) throw error;

            if (data && data.id) {
                window.location.href = `../Editor/editor.html?id=${encodeURIComponent(data.id)}`;
            } else {
                alert("Error al crear copia.");
            }

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
