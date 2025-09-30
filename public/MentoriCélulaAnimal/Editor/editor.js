// =============================
// editor.js — full fixed version
// =============================

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

// Organelle nodes
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
let currentorganel = null;
let popupimageremovemode = false;
let mainimageremoveMode = false;

// -----------------------------
// Helpers
// -----------------------------
function updateRemovableClass(selector, state) {
    document.querySelectorAll(selector).forEach(img =>
        img.classList.toggle('removable', state)
    );
}
function addBodyEraser() { document.body.classList.add('eraser-cursor'); }
function removeBodyEraser() { document.body.classList.remove('eraser-cursor'); }

function exitAllRemoveModes() {
    popupimageremovemode = false;
    mainimageremoveMode = false;
    updateRemovableClass('.pop-up-image', false);
    updateRemovableClass('.main-image', false);
    if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
    if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';
    removeBodyEraser();
}

// cancel remove modes when clicking outside
document.addEventListener('click', (e) => {
    if ((popupimageremovemode || mainimageremoveMode) &&
        !e.target.classList.contains('main-image') &&
        !e.target.classList.contains('pop-up-image') &&
        e.target !== mainremoveBtn &&
        e.target !== popupimageremove) {
        exitAllRemoveModes();
    }
});

// -----------------------------
// Attach behaviors to images
// -----------------------------
function attachMainImageBehavior(img) {
    if (!img || img.__mainHandlersAttached) return;
    img.__mainHandlersAttached = true;

    img.addEventListener('click', (ev) => {
        if (mainimageremoveMode) {
            ev.stopPropagation();
            img.remove();
        }
    });
    img.addEventListener('mouseenter', () => {
        if (mainimageremoveMode) addBodyEraser();
    });
    img.addEventListener('mouseleave', removeBodyEraser);
}

function attachPopupImageBehavior(img) {
    if (!img || img.__popupHandlersAttached) return;
    img.__popupHandlersAttached = true;

    img.addEventListener('click', (ev) => {
        if (popupimageremovemode) {
            ev.stopPropagation();
            img.remove();
        }
    });
    img.addEventListener('mouseenter', () => {
        if (popupimageremovemode) addBodyEraser();
    });
    img.addEventListener('mouseleave', removeBodyEraser);
}

// initialize handlers
document.querySelectorAll('.main-image').forEach(attachMainImageBehavior);
document.querySelectorAll('.pop-up-image').forEach(attachPopupImageBehavior);

// -----------------------------
// Gather & Populate editor content
// -----------------------------
function gatherEditorContent() {
    return {
        description: document.getElementById("description")?.value || "",
        mainImages: [...(mainimagesContainer?.querySelectorAll("img") || [])].map(img => img.src),
        organelos: Array.from(organelos).map(o => ({
            id: o?.id ?? null,
            content: o?.dataset?.content || "",
            image: safeParse(o?.dataset?.image, [])
        }))
    };
}
function populateEditorWithContent(data) {
    if (!data) return;

    const desc = document.getElementById("description");
    if (desc) desc.value = data.description || "";

    if (mainimagesContainer) {
        mainimagesContainer.innerHTML = "";
        (data.mainImages || []).forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.classList.add("main-image");
            attachMainImageBehavior(img);
            mainimagesContainer.appendChild(img);
        });
    }

    (data.organelos || []).forEach((item, idx) => {
        const target = document.getElementById(item.id) || organelos[idx];
        if (target) {
            target.dataset.content = item.content || "";
            target.dataset.image = JSON.stringify(item.image || []);
        }
    });
}
function safeParse(str, fallback) {
    try { return JSON.parse(str || ""); }
    catch { return fallback; }
}

// -----------------------------
// Pop-up logic
// -----------------------------
if (organelos) {
    organelos.forEach(organel => {
        organel.addEventListener('click', () => {
            if (mainimageremoveMode) exitAllRemoveModes();

            currentorganel = organel;
            if (popupmessage) popupmessage.value = organel.dataset?.content || "";
            if (popupimagecontainer) {
                popupimagecontainer.innerHTML = "";
                safeParse(organel.dataset?.image, []).forEach(src => {
                    const img = document.createElement("img");
                    img.src = src;
                    img.classList.add("pop-up-image");
                    attachPopupImageBehavior(img);
                    popupimagecontainer.appendChild(img);
                });
            }
            popup?.classList.add('active');
        });
    });
}
if (popupimageadd && popupimageinput) {
    popupimageadd.addEventListener("click", () => popupimageinput.click());
}
if (popupimageinput) {
    popupimageinput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = document.createElement("img");
            img.src = evt.target.result;
            img.classList.add("pop-up-image");
            attachPopupImageBehavior(img);
            popupimagecontainer?.appendChild(img);
        };
        reader.readAsDataURL(file);
        popupimageinput.value = "";
    });
}
if (popupimageremove) {
    popupimageremove.addEventListener("click", (ev) => {
        ev.stopPropagation();
        popupimageremovemode = !popupimageremovemode;
        updateRemovableClass('.pop-up-image', popupimageremovemode);
        popupimageremove.textContent = popupimageremovemode ? "Cancelar quitar" : "Quitar imagen";
    });
}
if (savepopup) {
    savepopup.addEventListener('click', () => {
        if (!currentorganel) return;
        currentorganel.dataset.content = popupmessage?.value || "";
        currentorganel.dataset.image = JSON.stringify(
            [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src)
        );
        popup?.classList.remove('active');
        exitAllRemoveModes();
    });
}
if (closepopup) {
    closepopup.addEventListener("click", () => {
        popup?.classList.remove('active');
        exitAllRemoveModes();
    });
}
if (popup) {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            if (currentorganel) {
                currentorganel.dataset.content = popupmessage?.value || "";
                currentorganel.dataset.image = JSON.stringify(
                    [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src)
                );
            }
            popup.classList.remove('active');
            exitAllRemoveModes();
        }
    });
}

// -----------------------------
// Main images logic
// -----------------------------
if (mainaddBtn && mainimageinput) {
    mainaddBtn.addEventListener("click", () => mainimageinput.click());
}
if (mainimageinput) {
    mainimageinput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = document.createElement("img");
            img.src = evt.target.result;
            img.classList.add("main-image");
            attachMainImageBehavior(img);
            mainimagesContainer?.appendChild(img);
        };
        reader.readAsDataURL(file);
        mainimageinput.value = "";
    });
}
if (mainremoveBtn) {
    mainremoveBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        mainimageremoveMode = !mainimageremoveMode;
        updateRemovableClass('.main-image', mainimageremoveMode);
        mainremoveBtn.textContent = mainimageremoveMode ? "Cancelar quitar" : "Quitar imagen";
        if (!mainimageremoveMode) removeBodyEraser();
    });
}

// -----------------------------
// Local save (.txt)
// -----------------------------
if (savebtn) {
    savebtn.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(gatherEditorContent(), null, 2)], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "datasets.txt";
        document.body.appendChild(a); a.click(); a.remove();
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
async function createDocument(content) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Must be logged in");
    const id = nanoid();
    const now = new Date().toISOString();
    const { error } = await supabase.from('documents').insert({
        id, creator: user.email, created_at: now, updated_at: now, content
    });
    if (error) throw error;
    return id;
}
async function updateDocument(id, content) {
    const now = new Date().toISOString();
    const { error } = await supabase.from('documents')
        .update({ content, updated_at: now }).eq('id', id);
    if (error) throw error;
}
async function loadDocumentById(id) {
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
}

// -----------------------------
// Copy button
// -----------------------------
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return alert("You must be logged in to copy.");
            const newId = await createDocument(gatherEditorContent());
            window.open(`/MentoriCélulaAnimal/Editor/editor.html?id=${newId}`, "_blank");
        } catch (err) {
            console.error(err);
            alert("Failed to copy: " + err.message);
        }
    });
}

// -----------------------------
// Save online
// -----------------------------
if (saveonlinebutton) {
    saveonlinebutton.addEventListener("click", async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return alert("You must be logged in to save online.");
            const docId = new URLSearchParams(window.location.search).get("id");
            const content = gatherEditorContent();

            if (docId) {
                const doc = await loadDocumentById(docId);
                if (!doc) return alert("Document not found.");
                if (normalize(user.email) !== normalize(doc.creator))
                    return alert("You are not the creator.");
                await updateDocument(docId, content);
                alert("Saved!");
            } else {
                const newId = await createDocument(content);
                alert("Created new document!");
                window.location.href = `../Editor/editor.html?id=${newId}`;
            }
        } catch (err) {
            console.error(err);
            alert("Save error: " + err.message);
        }
    });
}
function normalize(email) {
    return (email || "").trim().toLowerCase();
}

// -----------------------------
// Load local dataset
// -----------------------------
if (loadBtn && loadInput) {
    loadBtn.addEventListener("click", () => loadInput.click());
    loadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                populateEditorWithContent(JSON.parse(evt.target.result));
                alert("Loaded dataset!");
            } catch {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
        loadInput.value = "";
    });
}

// -----------------------------
// Auth UI & auto-load doc
// -----------------------------
async function refreshSignInUI() {
    const user = await getCurrentUser();
    if (signInBtn) signInBtn.style.display = user ? "none" : "inline-block";
}
supabase.auth.onAuthStateChange(() => refreshSignInUI());

window.addEventListener('DOMContentLoaded', async () => {
    await refreshSignInUI();

    const docId = new URLSearchParams(window.location.search).get("id");
    if (!docId) return;

    try {
        const doc = await loadDocumentById(docId);
        if (!doc) {
            alert("Document not found."); window.location.href = "../Viewer/view.html"; return;
        }
        const user = await getCurrentUser();
        if (!user || normalize(user.email) !== normalize(doc.creator)) {
            alert("Not authorized. Redirecting to viewer...");
            window.location.href = `../Viewer/view.html?id=${docId}`; return;
        }
        if (doc.content) populateEditorWithContent(doc.content);
    } catch (err) {
        console.error("Load error:", err);
        alert("Error loading doc."); window.location.href = `../Viewer/view.html?id=${docId}`;
    }
});

// -----------------------------
// Misc buttons
// -----------------------------
if (returnHomeBtn) {
    returnHomeBtn.addEventListener("click", () => window.location.href = "/index.html");
}
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
// Sign-in button
// -----------------------------
if (signInBtn) {
    signInBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${location.origin}/MentoriCélulaAnimal/Editor/editor.html` }
        });
        if (error) {
            console.error("Login error:", error);
            alert("Login failed: " + error.message);
        }
    });
}
