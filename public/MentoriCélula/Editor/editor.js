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
let popupimageremoveMode = false;
let mainimageremoveMode = false;

// -----------------------------
// Cursor handling
// -----------------------------
function toggleCursor(isRemoveMode) {
    document.body.style.cursor = isRemoveMode ? "url('/eraser.svg'), auto" : "default";
}

// Exit remove mode globally
function exitRemoveModes() {
    popupimageremoveMode = false;
    mainimageremoveMode = false;
    popupimageremove.textContent = "Quitar imagen";
    mainremoveBtn.textContent = "Quitar imagen";
    toggleCursor(false);
}

// Click anywhere outside images → exit remove mode
document.addEventListener("click", (e) => {
    if (
        popupimageremoveMode || mainimageremoveMode
    ) {
        if (!e.target.classList.contains("pop-up-image") &&
            !e.target.classList.contains("main-image") &&
            e.target !== popupimageremove &&
            e.target !== mainremoveBtn) {
            exitRemoveModes();
        }
    }
});

// -----------------------------
// Gather editor content
// -----------------------------
function gatherEditorContent() {
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

// -----------------------------
// Populate editor
// -----------------------------
function populateEditorWithContent(data) {
    document.getElementById("description").value = data.description || "";
    mainimagesContainer.innerHTML = "";

    (data.mainImages || []).forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.classList.add("main-image");

        img.addEventListener("click", () => {
            if (mainimageremoveMode) {
                mainimagesContainer.removeChild(img);
            }
        });

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
// Pop-up logic
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
                popupimg.addEventListener("click", () => {
                    if (popupimageremoveMode) {
                        popupimagecontainer.removeChild(popupimg);
                    }
                });
                popupimagecontainer.appendChild(popupimg);
            });
        }

        popup.classList.add('active');
    });
});

popupimageadd.addEventListener("click", () => popupimageinput.click());

popupimageinput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const popupimg = document.createElement("img");
        popupimg.src = event.target.result;
        popupimg.classList.add("pop-up-image");

        popupimg.addEventListener("click", () => {
            if (popupimageremoveMode) {
                popupimagecontainer.removeChild(popupimg);
            }
        });

        popupimagecontainer.appendChild(popupimg);
    };
    reader.readAsDataURL(file);
    popupimageinput.value = "";
});

popupimageremove.addEventListener("click", () => {
    popupimageremoveMode = !popupimageremoveMode;
    popupimageremove.textContent = popupimageremoveMode ? "Cancelar quitar" : "Quitar imagen";
    toggleCursor(popupimageremoveMode);
});

savepopup.addEventListener("click", () => {
    if (!currentogranel) return;
    currentogranel.dataset.content = popupmessage.value;
    const imgs = [...popupimagecontainer.querySelectorAll("img")].map(img => img.src);
    currentogranel.dataset.image = JSON.stringify(imgs);
    popup.classList.remove("active");
    exitRemoveModes();
});

closepopup.addEventListener("click", () => {
    popup.classList.remove("active");
    exitRemoveModes();
});

// -----------------------------
// Main images logic
// -----------------------------
mainaddBtn.addEventListener("click", () => mainimageinput.click());

mainimageinput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target.result;
        img.classList.add("main-image");

        img.addEventListener("click", () => {
            if (mainimageremoveMode) {
                mainimagesContainer.removeChild(img);
            }
        });

        mainimagesContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
    mainimageinput.value = "";
});

mainremoveBtn.addEventListener("click", () => {
    mainimageremoveMode = !mainimageremoveMode;
    mainremoveBtn.textContent = mainimageremoveMode ? "Cancelar quitar" : "Quitar imagen";
    toggleCursor(mainimageremoveMode);
});

// -----------------------------
// Local save (.txt)
// -----------------------------
savebtn.addEventListener("click", () => {
    const content = gatherEditorContent();
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

// -----------------------------
// Supabase (Save/Load/Copy)
// -----------------------------
import { supabase } from '/supabase.js';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

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
        id,
        creator: user.email,
        created_at: now,
        updated_at: now,
        content: editorContent
    });
    if (error) throw error;
    return id;
}

async function updateDocument(id, editorContent) {
    const now = new Date().toISOString();
    const { error } = await supabase.from('documents')
        .update({ content: editorContent, updated_at: now })
        .eq('id', id);
    if (error) throw error;
    return true;
}

async function loadDocumentById(id) {
    const { data, error } = await supabase.from('documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    return data;
}

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

// -----------------------------
// Load local .txt dataset
// -----------------------------
loadBtn.addEventListener("click", () => loadInput.click());
loadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
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

// -----------------------------
// Auto-load dataset & access control
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
            alert("You are not authorized to edit this document. Redirecting to viewer...");
            window.location.href = `/MentoriCélula/Viewer/view.html?id=${docId}`;
            return;
        }
        if (doc.content) populateEditorWithContent(doc.content);
    } catch (err) {
        console.error("Failed to load document:", err);
        alert("Error loading document. Redirecting to viewer...");
        window.location.href = `/MentoriCélula/Viewer/view.html?id=${docId}`;
    }
});

// -----------------------------
// Return home button
// -----------------------------
returnHomeBtn.addEventListener("click", () => {
    window.location.href = "/index.html";
});

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
setupOrganelName(nucleolo, "Nucléolo");
setupOrganelName(nucleo, "Núcleo");
setupOrganelName(reticuloendoplasmatico, "Retículo endoplasmático");
setupOrganelName(centriolos, "Centriolos");
setupOrganelName(microtubulos, "Microtúbulos");
setupOrganelName(mitocondrias, "Mitocondrias");
setupOrganelName(lisosomas, "Lisosomas");
setupOrganelName(aparatodegolgi, "Aparato de Golgi");
