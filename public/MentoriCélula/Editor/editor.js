// editor.js (rewritten)
// -----------------------------
// DOM Elements (defensive lookups)
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

// Organelles (may be null if not present)
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
// Helpers: cursor + mode management
// -----------------------------
function updateCursor() {
    // Show eraser if any remove mode active
    if (popupimageremovemode || mainimageremoveMode) {
        document.body.classList.add('eraser-cursor');
    } else {
        document.body.classList.remove('eraser-cursor');
    }
}

function exitAllRemoveModes() {
    popupimageremovemode = false;
    mainimageremoveMode = false;

    // Remove 'removable' class from any images
    document.querySelectorAll('.pop-up-image.removable').forEach(img => img.classList.remove('removable'));
    document.querySelectorAll('.main-image.removable').forEach(img => img.classList.remove('removable'));

    // Reset remove buttons text if they exist
    if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
    if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';

    updateCursor();
}

// If user clicks anywhere that's NOT an image, cancel remove modes.
// We use capture=false (bubbling) so clicks on images are seen first by image handlers.
document.addEventListener('click', (e) => {
    const target = e.target;
    const clickedMainImage = target.classList && target.classList.contains('main-image');
    const clickedPopupImage = target.classList && target.classList.contains('pop-up-image');
    const clickedMainRemoveBtn = target === mainremoveBtn;
    const clickedPopupRemoveBtn = target === popupimageremove;

    // If a remove mode is active but click wasn't on an image or the remove buttons -> exit modes
    if ((popupimageremovemode || mainimageremoveMode) &&
        !clickedMainImage && !clickedPopupImage && !clickedMainRemoveBtn && !clickedPopupRemoveBtn) {
        exitAllRemoveModes();
    }
});

// -----------------------------
// Helper: Gather editor content
// -----------------------------
function gatherEditorContent() {
    const savedataexport = {
        description: document.getElementById("description")?.value || "",
        mainImages: [...(mainimagesContainer?.querySelectorAll("img") || [])].map(img => img.src),
        organelos: []
    };

    organelos.forEach((organelo) => {
        savedataexport.organelos.push({
            id: organelo.id || null,
            content: organelo.dataset?.content || "",
            image: organelo.dataset?.image ? JSON.parse(organelo.dataset.image) : [],
        });
    });

    return savedataexport;
}

// -----------------------------
// Helper: Populate editor with content
// -----------------------------
function populateEditorWithContent(data) {
    if (!data) return;
    const descElem = document.getElementById("description");
    if (descElem) descElem.value = data.description || "";

    if (!mainimagesContainer) return;
    mainimagesContainer.innerHTML = "";
    (data.mainImages || []).forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.classList.add("main-image");
        img.dataset.src = src;

        // clicking an image removes it only when mainimageremoveMode is active
        img.addEventListener("click", (ev) => {
            if (mainimageremoveMode) {
                ev.stopPropagation();
                mainimagesContainer.removeChild(img);
            }
        });

        mainimagesContainer.appendChild(img);
    });

    (data.organelos || []).forEach((item, index) => {
        let target = item.id ? document.getElementById(item.id) : null;
        if (!target && organelos[index]) target = organelos[index];
        if (target) {
            target.dataset.content = item.content || "";
            target.dataset.image = JSON.stringify(item.image || []);
        }
    });
}

// -----------------------------
// Pop-up logic
// -----------------------------
if (organelos && organelos.length) {
    organelos.forEach(selectedorganel => {
        selectedorganel.addEventListener('click', (e) => {
            // Opening a popup should cancel main-image remove mode so cursor doesn't persist
            if (mainimageremoveMode) {
                mainimageremoveMode = false;
                document.querySelectorAll('.main-image.removable').forEach(i => i.classList.remove('removable'));
                if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';
                updateCursor();
            }

            currentogranel = selectedorganel;
            popupmessage && (popupmessage.value = selectedorganel.dataset?.content || "");
            if (popupimagecontainer) popupimagecontainer.innerHTML = "";

            if (selectedorganel.dataset?.image && popupimagecontainer) {
                try {
                    const imgs = JSON.parse(selectedorganel.dataset.image || "[]");
                    imgs.forEach(src => {
                        const popupimg = document.createElement("img");
                        popupimg.src = src;
                        popupimg.classList.add("pop-up-image");

                        // clicking a popup image removes it only when popupimageremovemode is active
                        popupimg.addEventListener("click", (ev) => {
                            if (popupimageremovemode) {
                                ev.stopPropagation();
                                popupimagecontainer.removeChild(popupimg);
                            }
                        });
                        popupimagecontainer.appendChild(popupimg);
                    });
                } catch (err) {
                    console.warn("Failed to parse organelle images:", err);
                }
            }

            if (popup) popup.classList.add('active');
        });
    });
}

// popup image add (if element exists)
if (popupimageadd && popupimageinput) {
    popupimageadd.addEventListener("click", () => popupimageinput.click());
}

// popup image input
if (popupimageinput && popupimagecontainer) {
    popupimageinput.addEventListener("change", (e) => {
        const popupfile = e.target.files[0];
        if (!popupfile) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const popupimg = document.createElement("img");
            popupimg.src = event.target.result;
            popupimg.classList.add("pop-up-image");
            popupimg.dataset.image = popupimg.src;

            popupimg.addEventListener("click", (ev) => {
                if (popupimageremovemode) {
                    ev.stopPropagation();
                    popupimagecontainer.removeChild(popupimg);
                }
            });

            popupimagecontainer.appendChild(popupimg);
        };
        reader.readAsDataURL(popupfile);
        popupimageinput.value = "";
    });
}

// popup remove toggle
if (popupimageremove) {
    popupimageremove.addEventListener("click", (ev) => {
        ev.stopPropagation();
        popupimageremovemode = !popupimageremovemode;

        // toggle removable appearance
        document.querySelectorAll(".pop-up-image").forEach(img =>
            img.classList.toggle("removable", popupimageremovemode)
        );

        popupimageremove.textContent = popupimageremovemode ? "Cancelar quitar" : "Quitar imagen";
        updateCursor();
    });
}

// save popup (apply changes back to organelle)
if (savepopup) {
    savepopup.addEventListener('click', () => {
        if (!currentogranel) return;
        currentogranel.dataset.content = popupmessage?.value || "";
        const imgs = [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src);
        currentogranel.dataset.image = JSON.stringify(imgs);
        // close popup and reset popup remove mode
        popup?.classList.remove('active');
        popupimageremovemode = false;
        document.querySelectorAll('.pop-up-image.removable').forEach(i => i.classList.remove('removable'));
        if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
        updateCursor();
    });
}

// close popup (cancel)
if (closepopup) {
    closepopup.addEventListener("click", () => {
        popup?.classList.remove('active');
        // reset popup remove mode on close
        popupimageremovemode = false;
        document.querySelectorAll('.pop-up-image.removable').forEach(i => i.classList.remove('removable'));
        if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
        updateCursor();
    });
}

// clicking backdrop closes popup and resets modes
if (popup) {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            // save content back to current organelle (keeps consistent with previous behavior)
            if (currentogranel) {
                currentogranel.dataset.content = popupmessage?.value || "";
                const imgs = [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src);
                currentogranel.dataset.image = JSON.stringify(imgs);
            }
            popup.classList.remove('active');

            // reset popup remove mode
            popupimageremovemode = false;
            document.querySelectorAll('.pop-up-image.removable').forEach(i => i.classList.remove('removable'));
            if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
            updateCursor();
        }
    });
}

// -----------------------------
// Main images logic
// -----------------------------
if (mainaddBtn && mainimageinput) {
    mainaddBtn.addEventListener("click", () => mainimageinput.click());
}

if (mainimageinput && mainimagesContainer) {
    mainimageinput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement("img");
            img.src = event.target.result;
            img.classList.add("main-image");
            img.dataset.src = img.src;

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

// main remove toggle
if (mainremoveBtn) {
    mainremoveBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        mainimageremoveMode = !mainimageremoveMode;

        document.querySelectorAll(".main-image").forEach(img =>
            img.classList.toggle("removable", mainimageremoveMode)
        );

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
        const content = gatherEditorContent(); // get current editor content
        const user = await getCurrentUser();

        if (!user) {
            alert('You must be signed in to copy this document.');
            return;
        }

        try {
            // Create new document with same content
            const newId = await createDocument(content);

            // Open new editor window with new document
            window.open(`/MentoriCélula/Editor/editor.html?id=${newId}`, '_blank');
        } catch (err) {
            console.error(err);
            alert('Failed to copy document: ' + err.message);
        }
    });
}

// -----------------------------
// Save online (kept, but will error if not implemented server-side)
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
                // Redirect using absolute path from root
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

        // Populate editor with content
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

