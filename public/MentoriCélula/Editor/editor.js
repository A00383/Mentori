// -----------------------------
// Imports
// -----------------------------
import { supabase } from '/supabase.js';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

// -----------------------------
// DOM Elements
// -----------------------------
const popup = document.getElementById('pop-up');
const closepopup = document.getElementById('close-pop-up');
const savepopup = document.getElementById('save-pop-up');
const organelos = document.querySelectorAll('.organelos');
const popupmessage = document.getElementById('pop-up-message');
const popupimageinput = document.getElementById("pop-up-image-file");
const popupimageadd = document.getElementById("pop-up-image-add");
const popupimageremove = document.getElementById("pop-up-image-remove");
const popupimagecontainer = document.getElementById("pop-up-image-section-images");
const savebtn = document.getElementById("savebtn");
const saveonlinebutton = document.getElementById("save-online-btn");
const loadInput = document.getElementById("mainload");
const loadBtn = document.getElementById("loadbtn");
const mainimageinput = document.getElementById("main-image-input");
const mainaddBtn = document.getElementById("main-image-add");
const mainremoveBtn = document.getElementById("main-image-remove");
const mainimagesContainer = document.getElementById("main-image-images");
const popupname = document.getElementById('pop-up-name');
const mainorganelname = document.getElementById('organelo');
const copyBtn = document.getElementById('copybtn');
const returnHomeBtn = document.getElementById("return-homebtn");
const signInBtn = document.getElementById("sign-in");

// Organelles
const membranacelular = document.getElementById('membrana celular');
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
let popupimageremovemode = false;
let mainimageremoveMode = false;

// -----------------------------
// Cursor + remove mode helpers
// -----------------------------
function updateCursor() {
    if (popupimageremovemode || mainimageremoveMode) {
        document.body.classList.add('eraser-cursor');
    } else {
        document.body.classList.remove('eraser-cursor');
    }
}
function exitAllRemoveModes() {
    popupimageremovemode = false;
    mainimageremoveMode = false;
    document.querySelectorAll('.pop-up-image.removable').forEach(img => img.classList.remove('removable'));
    document.querySelectorAll('.main-image.removable').forEach(img => img.classList.remove('removable'));
    if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
    if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';
    updateCursor();
}
document.addEventListener('click', (e) => {
    const target = e.target;
    const clickedMainImage = target.classList?.contains('main-image');
    const clickedPopupImage = target.classList?.contains('pop-up-image');
    if ((popupimageremovemode || mainimageremoveMode) &&
        !clickedMainImage && !clickedPopupImage &&
        target !== mainremoveBtn && target !== popupimageremove) {
        exitAllRemoveModes();
    }
});

// -----------------------------
// Gather / populate content
// -----------------------------
function gatherEditorContent() {
    return {
        description: document.getElementById("description")?.value || "",
        mainImages: [...(mainimagesContainer?.querySelectorAll("img") || [])].map(img => img.src),
        organelos: [...organelos].map(organelo => ({
            id: organelo.id || null,
            content: organelo.dataset?.content || "",
            image: organelo.dataset?.image ? JSON.parse(organelo.dataset.image) : [],
        }))
    };
}
function populateEditorWithContent(data) {
    if (!data) return;
    const descElem = document.getElementById("description");
    if (descElem) descElem.value = data.description || "";
    if (mainimagesContainer) {
        mainimagesContainer.innerHTML = "";
        (data.mainImages || []).forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.classList.add("main-image");
            img.addEventListener("click", (ev) => {
                if (mainimageremoveMode) {
                    ev.stopPropagation();
                    mainimagesContainer.removeChild(img);
                }
            });
            mainimagesContainer.appendChild(img);
        });
    }
    (data.organelos || []).forEach((item, index) => {
        let target = item.id ? document.getElementById(item.id) : organelos[index];
        if (target) {
            target.dataset.content = item.content || "";
            target.dataset.image = JSON.stringify(item.image || []);
        }
    });
}

// -----------------------------
// Pop-up logic (open / save / close)
// -----------------------------
if (organelos.length) {
    organelos.forEach(selectedorganel => {
        selectedorganel.addEventListener('click', () => {
            if (mainimageremoveMode) exitAllRemoveModes();
            currentogranel = selectedorganel;
            if (popupmessage) popupmessage.value = selectedorganel.dataset?.content || "";
            if (popupimagecontainer) {
                popupimagecontainer.innerHTML = "";
                try {
                    (JSON.parse(selectedorganel.dataset.image || "[]")).forEach(src => {
                        const popupimg = document.createElement("img");
                        popupimg.src = src;
                        popupimg.classList.add("pop-up-image");
                        popupimg.addEventListener("click", (ev) => {
                            if (popupimageremovemode) {
                                ev.stopPropagation();
                                popupimagecontainer.removeChild(popupimg);
                            }
                        });
                        popupimagecontainer.appendChild(popupimg);
                    });
                } catch {}
            }
            popup?.classList.add('active');
        });
    });
}
if (popupimageadd && popupimageinput) popupimageadd.addEventListener("click", () => popupimageinput.click());
if (popupimageinput && popupimagecontainer) {
    popupimageinput.addEventListener("change", (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement("img");
            img.src = event.target.result;
            img.classList.add("pop-up-image");
            img.addEventListener("click", (ev) => {
                if (popupimageremovemode) {
                    ev.stopPropagation();
                    popupimagecontainer.removeChild(img);
                }
            });
            popupimagecontainer.appendChild(img);
        };
        reader.readAsDataURL(file);
        popupimageinput.value = "";
    });
}
if (popupimageremove) {
    popupimageremove.addEventListener("click", (ev) => {
        ev.stopPropagation();
        popupimageremovemode = !popupimageremovemode;
        document.querySelectorAll(".pop-up-image").forEach(img =>
            img.classList.toggle("removable", popupimageremovemode));
        popupimageremove.textContent = popupimageremovemode ? "Cancelar quitar" : "Quitar imagen";
        updateCursor();
    });
}
if (savepopup) {
    savepopup.addEventListener('click', () => {
        if (!currentogranel) return;
        currentogranel.dataset.content = popupmessage?.value || "";
        currentogranel.dataset.image = JSON.stringify(
            [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src)
        );
        popup?.classList.remove('active');
        exitAllRemoveModes();
    });
}
if (closepopup) closepopup.addEventListener("click", () => { popup?.classList.remove('active'); exitAllRemoveModes(); });
if (popup) popup.addEventListener('click', (e) => {
    if (e.target === popup) {
        if (currentogranel) {
            currentogranel.dataset.content = popupmessage?.value || "";
            currentogranel.dataset.image = JSON.stringify(
                [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src)
            );
        }
        popup.classList.remove('active');
        exitAllRemoveModes();
    }
});

// -----------------------------
// Main image logic
// -----------------------------
if (mainaddBtn && mainimageinput) mainaddBtn.addEventListener("click", () => mainimageinput.click());
if (mainimageinput && mainimagesContainer) {
    mainimageinput.addEventListener("change", (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement("img");
            img.src = event.target.result;
            img.classList.add("main-image");
            img.addEventListener("click", (ev) => {
                if (mainimageremoveMode) {
                    ev.stopPropagation();
                    mainimagesContainer.removeChild(img);
                }
            });
            mainimagesContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
        mainimageinput.value = "";
    });
}
if (mainremoveBtn) {
    mainremoveBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        mainimageremoveMode = !mainimageremoveMode;
        document.querySelectorAll(".main-image").forEach(img =>
            img.classList.toggle("removable", mainimageremoveMode));
        mainremoveBtn.textContent = mainimageremoveMode ? "Cancelar quitar" : "Quitar imagen";
        updateCursor();
    });
}

// -----------------------------
// Local save (.txt)
// -----------------------------
if (savebtn) {
    savebtn.addEventListener("click", () => {
        const content = gatherEditorContent();
        const blob = new Blob([JSON.stringify(content, null, 2)], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "datasets.txt";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// -----------------------------
// Supabase helpers
// -----------------------------
async function getCurrentUser() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
}
async function createDocument(editorContent) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged-in to save document');
    const id = nanoid();
    const now = new Date().toISOString();
    const { error } = await supabase.from('documents').insert({
        id, creator: user.email, created_at: now, updated_at: now, content: editorContent
    });
    if (error) throw error;
    return id;
}
async function updateDocument(id, editorContent) {
    const now = new Date().toISOString();
    const { error } = await supabase.from('documents')
        .update({ content: editorContent, updated_at: now }).eq('id', id);
    if (error) throw error;
    return true;
}
async function loadDocumentById(id) {
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
}

// -----------------------------
// Copy Button
// -----------------------------
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const content = gatherEditorContent();
        const user = await getCurrentUser();
        if (!user) return alert('You must be signed in to copy this document.');
        try {
            const newId = await createDocument(content);
            window.open(`/MentoriCélula/Editor/editor.html?id=${newId}`, '_blank');
        } catch (err) {
            console.error(err);
            alert('Failed to copy document: ' + err.message);
        }
    });
}

// -----------------------------
// Save Online
// -----------------------------
if (saveonlinebutton) {
    saveonlinebutton.addEventListener("click", async () => {
        const content = gatherEditorContent();
        const docId = new URLSearchParams(window.location.search).get("id");
        try {
            const user = await getCurrentUser();
            if (!user) return alert("You must be logged in to save online.");
            if (docId) {
                const doc = await loadDocumentById(docId);
                if (!doc) return alert("Document not found.");
                if (doc.creator !== user.email) return alert("You are not the creator of this document.");
                await updateDocument(docId, content);
                alert("Document saved successfully!");
            } else {
                const newId = await createDocument(content);
                alert("New document created successfully!");
                window.location.href = `/MentoriCélula/Editor/editor.html?id=${newId}`;
            }
        } catch (err) {
            console.error(err);
            alert("Error saving document: " + err.message);
        }
    });
}

// -----------------------------
// Load Local Dataset
// -----------------------------
if (loadBtn && loadInput) {
    loadBtn.addEventListener("click", () => loadInput.click());
    loadInput.addEventListener("change", (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                populateEditorWithContent(data);
                alert("Datasets loaded successfully!");
            } catch {
                alert("Error: file is not valid JSON.");
            }
        };
        reader.readAsText(file);
        loadInput.value = "";
    });
}

// -----------------------------
// Auto-load dataset
// -----------------------------
window.addEventListener('DOMContentLoaded', async () => {
    const docId = new URLSearchParams(window.location.search).get("id");
    if (!docId) return;
    try {
        const doc = await loadDocumentById(docId);
        if (!doc) {
            alert("Document not found.");
            window.location.href = "/MentoriCélula/Viewer/view.html";
            return;
        }
        const user = await getCurrentUser();
        if (!user || user.email !== doc.creator) {
            alert("You are not authorized to edit this document. Redirecting...");
            window.location.href = `/MentoriCélula/Viewer/view.html?id=${docId}`;
            return;
        }
        if (doc.content) populateEditorWithContent(doc.content);
    } catch (err) {
        console.error("Failed to load document:", err);
        alert("Error loading document. Redirecting...");
        window.location.href = `/MentoriCélula/Viewer/view.html?id=${docId}`;
    }
});

// -----------------------------
// Return Home
// -----------------------------
if (returnHomeBtn) returnHomeBtn.addEventListener("click", () => { window.location.href = "/index.html"; });

// -----------------------------
// Organelle names hover/click
// -----------------------------
function setupOrganelName(organel, displayName) {
    if (!organel) return;
    organel.addEventListener('click', () => { if (popupname) popupname.textContent = displayName; });
    organel.addEventListener('mouseenter', () => { if (mainorganelname) mainorganelname.textContent = displayName; });
    organel.addEventListener('mouseleave', () => { if (mainorganelname) mainorganelname.textContent = "Célula animal"; });
}
setupOrganelName(membranacelular, "Membrana celular");
setupOrganelName(citoplasma, "Citoplasma");
setupOrganelName(nucleolo, "Nucléolo");
setupOrganelName(nucleo, "Núcleo");
setupOrganelName(reticuloendoplasmatico, "Retículo endoplasmático");
setupOrganelName(centriolos, "Centriolos");
setupOrganelName(microtubulos, "Microtúbulos");
setupOrganelName(mitocondrias, "Mitocondrias");
setupOrganelName(lisosomas, "Lisosomas");
setupOrganelName(aparatodegolgi, "Aparato de Golgi");

// -----------------------------
// Sign In button
// -----------------------------
if (signInBtn) {
    signInBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/MentoriCélula/Editor/editor.html`
            }
        });
        if (error) console.error("Login error:", error.message);
    });
}
