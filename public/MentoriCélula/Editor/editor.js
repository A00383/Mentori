// editor.js (rewritten)
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

// Cursor: SVG data URI (same as CSS version). Hotspot at 8 8.
const ERASER_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 508.013 508.013' width='32' height='32'%3E%3Cpath fill='%23000' d='M490.3,133.177l-99.5-99.6c-33-33-74-11.4-85.5,0l-287.6,287.7c-23.6,23.6-23.6,61.9,0,85.5l81.1,81.1c2.6,2.6,6.2,4.1,10,4.1h102.4c3.7,0,7.3-1.5,10-4.1l269.2-269.2C513.9,195.077,513.9,156.777,490.3,133.177z M205.3,463.777h-90.7l-77-77c-12.6-12.6-12.6-33,0-45.5l67.4-67.4l145.1,145.1L205.3,463.777z M470.4,198.677l-200.3,200.3L125,253.877l200.3-200.3c6.1-6.1,27-18.5,45.5,0l99.5,99.5C482.9,165.777,482.9,186.177,470.4,198.677z'/%3E%3C/svg%3E\") 8 8, auto";

// -----------------------------
// Helpers
// -----------------------------
function gatherEditorContent() {
    const savedataexport = {
        description: (document.getElementById("description")?.value) || "",
        mainImages: [...(mainimagesContainer?.querySelectorAll("img") || [])].map(img => img.src),
        organelos: []
    };

    organelos.forEach((organelo) => {
        savedataexport.organelos.push({
            id: organelo?.id || null,
            content: organelo?.dataset?.content || "",
            image: organelo?.dataset?.image ? JSON.parse(organelo.dataset.image) : [],
        });
    });

    return savedataexport;
}

function populateEditorWithContent(data) {
    if (!data) return;
    if (document.getElementById("description")) document.getElementById("description").value = data.description || "";

    // main images
    if (!mainimagesContainer) return;
    mainimagesContainer.innerHTML = "";
    (data.mainImages || []).forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.classList.add("main-image");
        img.dataset.src = src;
        setupMainImage(img);
        mainimagesContainer.appendChild(img);
    });

    // organelos
    (data.organelos || []).forEach((item, index) => {
        let target = item.id ? document.getElementById(item.id) : null;
        if (!target && organelos[index]) target = organelos[index];
        if (target) {
            target.dataset.content = item.content || "";
            target.dataset.image = JSON.stringify(item.image || []);
        }
    });
}

// Ensure newly added main images have the removal/hover behaviour
function setupMainImage(img) {
    // make sure style is reset
    img.style.cursor = ""; // default

    // click behavior: remove only if in remove mode
    img.addEventListener("click", (e) => {
        if (mainimageremoveMode) {
            e.stopPropagation();
            img.remove();
            // after a deletion, disable main remove mode
            setMainRemoveMode(false);
        }
    });

    // hover behavior: only show eraser cursor when remove-mode active
    img.addEventListener("mouseenter", () => {
        if (mainimageremoveMode) {
            img.style.cursor = ERASER_CURSOR;
        }
    });
    img.addEventListener("mouseleave", () => {
        // restore to default (no eraser shown)
        img.style.cursor = "";
    });
}

// Ensure popup images get removal/hover behaviour
function setupPopupImage(img) {
    img.style.cursor = "";
    img.addEventListener("click", (e) => {
        if (popupimageremovemode) {
            e.stopPropagation();
            img.remove();
            // after deletion, keep remove mode active (user might delete more), or optionally disable:
            // Here we keep it active so user can delete multiple; if you want to disable, call setPopupRemoveMode(false);
        }
    });
    img.addEventListener("mouseenter", () => {
        if (popupimageremovemode) img.style.cursor = ERASER_CURSOR;
    });
    img.addEventListener("mouseleave", () => {
        img.style.cursor = "";
    });
}

// toggle main remove mode and update UI
function setMainRemoveMode(enabled) {
    mainimageremoveMode = !!enabled;
    // update button text if exists
    if (mainremoveBtn) mainremoveBtn.textContent = mainimageremoveMode ? "Cancelar quitar" : "Quitar imagen";

    // set cursor on existing main images only while hovering (we rely on setupMainImage for hover)
    const imgs = mainimagesContainer ? mainimagesContainer.querySelectorAll(".main-image") : [];
    imgs.forEach(img => {
        // if turning off, reset cursor
        if (!mainimageremoveMode) img.style.cursor = "";
        // if turning on, cursor will be set on mouseenter by handler
    });

    // clicking outside images cancels mode (handled by document click listener)
}

// toggle popup remove mode and update UI
function setPopupRemoveMode(enabled) {
    popupimageremovemode = !!enabled;
    if (popupimageremove) popupimageremove.textContent = popupimageremovemode ? "Cancelar quitar" : "Quitar imagen";

    const imgs = popupimagecontainer ? popupimagecontainer.querySelectorAll(".pop-up-image") : [];
    imgs.forEach(img => {
        if (!popupimageremovemode) img.style.cursor = "";
        // if enabled, cursor set on mouseenter by setupPopupImage
    });
}

// cancel both remove modes (used when clicking elsewhere or opening pop-up)
function cancelAllRemoveModes() {
    setMainRemoveMode(false);
    setPopupRemoveMode(false);
}

// -----------------------------
// Pop-up logic
// -----------------------------
organelos.forEach(selectedorganel => {
    selectedorganel.addEventListener('click', () => {
        // clicking an organelle should cancel main-image remove mode
        cancelAllRemoveModes();

        currentogranel = selectedorganel;
        popupmessage.value = selectedorganel.dataset.content || "";
        popupimagecontainer.innerHTML = "";

        if (selectedorganel.dataset.image) {
            try {
                const imgs = JSON.parse(selectedorganel.dataset.image);
                imgs.forEach(src => {
                    const popupimg = document.createElement("img");
                    popupimg.src = src;
                    popupimg.classList.add("pop-up-image");
                    setupPopupImage(popupimg);
                    popupimagecontainer.appendChild(popupimg);
                });
            } catch (err) {
                console.warn("Failed to parse organelo images:", err);
            }
        }

        popup.classList.add('active');
        // ensure popup remove mode is off when opening (so user intentionally toggles it)
        setPopupRemoveMode(false);
    });
});

// add guard for popupimageadd / input
if (popupimageadd && popupimageinput) {
    popupimageadd.addEventListener("click", () => popupimageinput.click());
}

if (popupimageinput) {
    popupimageinput.addEventListener("change", (e) => {
        const popupfile = e.target.files[0];
        if (!popupfile) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const popupimg = document.createElement("img");
            popupimg.src = event.target.result;
            popupimg.classList.add("pop-up-image");
            setupPopupImage(popupimg);
            popupimg.dataset.image = popupimg.src;
            popupimagecontainer.appendChild(popupimg);
        };
        reader.readAsDataURL(popupfile);
        popupimageinput.value = "";
    });
}

// unified popup remove toggle
if (popupimageremove) {
    popupimageremove.addEventListener("click", () => {
        setPopupRemoveMode(!popupimageremovemode);
    });
}

// Save popup content back to organelo
if (savepopup) {
    savepopup.addEventListener('click', () => {
        if (!currentogranel) return;
        currentogranel.dataset.content = popupmessage.value;
        const imgs = [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src);
        currentogranel.dataset.image = JSON.stringify(imgs);
    });
}

// Reset state when closing popup
if (closepopup) {
    closepopup.addEventListener("click", () => {
        popup.classList.remove("active");
        setPopupRemoveMode(false);
    });
}

// Clicking the backdrop (outside content) also closes & resets
if (popup) {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            // save changes into organelo if present
            if (currentogranel) {
                currentogranel.dataset.content = popupmessage.value;
                const imgs = [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src);
                currentogranel.dataset.image = JSON.stringify(imgs);
            }
            popup.classList.remove('active');
            setPopupRemoveMode(false);
        }
    });
}

// -----------------------------
// Main images logic (add / remove)
// -----------------------------
if (mainaddBtn && mainimageinput) {
    mainaddBtn.addEventListener("click", () => mainimageinput.click());
    mainimageinput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement("img");
            img.src = event.target.result;
            img.classList.add("main-image");
            img.dataset.src = img.src;
            setupMainImage(img);
            mainimagesContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
        mainimageinput.value = "";
    });
}

// unified main remove toggle
if (mainremoveBtn) {
    mainremoveBtn.addEventListener("click", () => {
        setMainRemoveMode(!mainimageremoveMode);
    });
}

// -----------------------------
// Clicking outside images cancels remove mode
// -----------------------------
document.addEventListener("click", (e) => {
    // If click target is an element that qualifies as a main-image or pop-up-image, do nothing here.
    const clickedIsMainImage = !!e.target.closest?.(".main-image");
    const clickedIsPopupImage = !!e.target.closest?.(".pop-up-image");

    // If either remove mode active and clicked not an image, cancel both modes.
    if ((mainimageremoveMode || popupimageremovemode) && !clickedIsMainImage && !clickedIsPopupImage) {
        setMainRemoveMode(false);
        setPopupRemoveMode(false);
    }
});

// -----------------------------
// Local save (.txt)
// -----------------------------
if (savebtn) {
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
}

// -----------------------------
// Supabase Online Save & Load
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

// ------------------------------
// Copy Button
// ------------------------------
const copyBtn = document.getElementById('copybtn');
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const content = gatherEditorContent();
        const user = await getCurrentUser();

        if (!user) {
            alert('You must be signed in to copy this document.');
            return;
        }

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
// Save online (kept, but unchanged behavior)
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
// Auto-load dataset & enforce creator-only access
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

//---------------------
// Return home button
//---------------------
const returnHomeBtn = document.getElementById("return-homebtn");
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
setupOrganelName(nucleolo, "Nucléolo");
setupOrganelName(nucleo, "Núcleo");
setupOrganelName(reticuloendoplasmatico, "Retículo endoplasmático");
setupOrganelName(centriolos, "Centriolos");
setupOrganelName(microtubulos, "Microtúbulos");
setupOrganelName(mitocondrias, "Mitocondrias");
setupOrganelName(lisosomas, "Lisosomas");
setupOrganelName(aparatodegolgi, "Aparato de Golgi");
