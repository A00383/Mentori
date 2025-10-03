// editor.js
// Full, corrected editor logic (documents -> organelles -> images + storage uploads)
// Expects: `export const supabase = createClient(...)` from /supabase.js
// and nanoid available from CDN as in your original setup.

import { supabase } from '/supabase.js';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

// -----------------------------
// DOM Elements (defensive lookups)
// -----------------------------
const popup = document.getElementById('pop-up');
const closepopup = document.getElementById('close-pop-up');
const savepopup = document.getElementById('save-pop-up');
const organelos = document.querySelectorAll('.organelos') || [];
const popupmessage = document.getElementById('pop-up-message');
const popupimageinput = document.getElementById("pop-up-image-file");
const popupimageadd = document.getElementById("pop-up-image-add");
const popupimageremove = document.getElementById("pop-up-image-remove");
const popupimagecontainer = document.getElementById("pop-up-image-section-images");
const savebtn = document.getElementById("savebtn");
const switchviewbtn = document.getElementById("switch-mode-btn");
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
const userDiv = document.getElementById("user");

// organelle label elements (may be absent)
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
const ribosomas = document.getElementById('ribosomas');

// -----------------------------
// State
// -----------------------------
let currentOrganel = null;
let popupImageRemoveMode = false;
let mainImageRemoveMode = false;

// -----------------------------
// AUTH helpers
// -----------------------------
async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/MentoriCelulaAnimal/Editor/editor.html` }
    });
    if (error) console.error("Login error:", error.message);
}

async function logout() {
    await supabase.auth.signOut();
    renderUser(null);
}

function renderUser(user) {
    if (!userDiv) return;
    if (user) {
        userDiv.innerHTML = `
      <span style="color:black; margin-right:10px;">${user.email ?? ""}</span>
      <button id="logout">Cerrar sesión</button>
    `;
        document.getElementById("logout")?.addEventListener("click", logout);
    } else {
        userDiv.innerHTML = `<button id="login">Iniciar sesión</button>`;
        document.getElementById("login")?.addEventListener("click", login);
    }
}

(async () => {
    const { data: { session } = {} } = await supabase.auth.getSession();
    renderUser(session?.user ?? null);
})();

supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user ?? null);
});

// -----------------------------
// UI helpers: removable class / cursor
// -----------------------------
function updateRemovableClass(selector, state) {
    document.querySelectorAll(selector).forEach(el => el.classList.toggle('removable', state));
}
function addBodyEraser() { document.body.classList.add('eraser-cursor'); }
function removeBodyEraser() { document.body.classList.remove('eraser-cursor'); }
function exitAllRemoveModes() {
    popupImageRemoveMode = false;
    mainImageRemoveMode = false;
    updateRemovableClass('.pop-up-image', false);
    updateRemovableClass('.main-image', false);
    if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
    if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';
    removeBodyEraser();
}

// clicking outside images cancels remove modes
document.addEventListener('click', (e) => {
    const t = e.target;
    const clickedMain = t.classList && t.classList.contains('main-image');
    const clickedPop = t.classList && t.classList.contains('pop-up-image');
    if ((popupImageRemoveMode || mainImageRemoveMode) && !clickedMain && !clickedPop) exitAllRemoveModes();
});

// -----------------------------
// Attach handlers to image elements (idempotent)
// -----------------------------
function attachMainImageBehavior(img) {
    if (!img || img.__mainHandlersAttached) return;
    img.__mainHandlersAttached = true;
    img.addEventListener('click', (ev) => {
        if (mainImageRemoveMode) {
            ev.stopPropagation();
            img.remove();
        }
    });
}
function attachPopupImageBehavior(img) {
    if (!img || img.__popupHandlersAttached) return;
    img.__popupHandlersAttached = true;
    img.addEventListener('click', (ev) => {
        if (popupImageRemoveMode) {
            ev.stopPropagation();
            img.remove();
        }
    });
}
document.querySelectorAll('.main-image').forEach(attachMainImageBehavior);
document.querySelectorAll('.pop-up-image').forEach(attachPopupImageBehavior);

// -----------------------------
// GATHER editor content
// -----------------------------
function gatherEditorContent() {
    const saved = {
        description: document.getElementById("description")?.value || "",
        // mainImages: { src, file?, name }
        mainImages: [...(mainimagesContainer?.querySelectorAll("img") || [])].map((img, i) => ({
            src: img.src,
            file: img.file || img.dataset.file || null,
            name: img.dataset.name || `main-${i}-${Date.now()}.png`
        })),
        // organelos: { id, content, images: [ { src, file?, name } ] }
        organelos: []
    };

    Array.from(organelos).forEach((orgEl) => {
        const id = orgEl?.id || null;
        const content = orgEl?.dataset?.content || "";
        let imagesArray = [];
        try {
            if (orgEl.dataset?.image) imagesArray = JSON.parse(orgEl.dataset.image);
        } catch (err) { imagesArray = []; }

        const images = (imagesArray || []).map((src, i) => ({
            src,
            file: null, // when user adds via popup we attach file on the image element; for dataset strings there is no file
            name: `${id || 'org'}-img-${i}-${Date.now()}.png`
        }));

        saved.organelos.push({ id, content, images });
    });

    return saved;
}

// -----------------------------
// POPULATE editor with content
// -----------------------------
function populateEditorWithContent(data) {
    if (!data) return;
    const desc = document.getElementById("description");
    if (desc) desc.value = data.description || "";

    // mainImages can be strings or objects
    if (mainimagesContainer) {
        mainimagesContainer.innerHTML = "";
        (data.mainImages || []).forEach((mi, i) => {
            const src = typeof mi === 'string' ? mi : (mi.src || '');
            const img = document.createElement('img');
            img.src = src;
            img.classList.add('main-image');
            img.dataset.src = src;
            if (typeof mi === 'object') {
                if (mi.name) img.dataset.name = mi.name;
                if (mi.file) img.file = mi.file;
            }
            attachMainImageBehavior(img);
            mainimagesContainer.appendChild(img);
        });
    }

    // organelos: map items to elements
    (data.organelos || []).forEach((item, idx) => {
        let target = item.id ? document.getElementById(item.id) : null;
        if (!target && organelos[idx]) target = organelos[idx];
        if (!target) return;
        target.dataset.content = item.content || "";
        const imageSrcs = (item.images || item.image || []).map(x => (typeof x === 'string' ? x : x.src));
        target.dataset.image = JSON.stringify(imageSrcs);
    });
}

// -----------------------------
// POPUP open / add images / save / close
// -----------------------------
if (organelos && organelos.length) {
    organelos.forEach(el => {
        el.addEventListener('click', () => {
            if (mainImageRemoveMode) {
                mainImageRemoveMode = false;
                updateRemovableClass('.main-image', false);
                if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';
                removeBodyEraser();
            }

            currentOrganel = el;
            if (popupmessage) popupmessage.value = el.dataset?.content || "";
            if (popupimagecontainer) popupimagecontainer.innerHTML = "";

            try {
                const imgs = JSON.parse(el.dataset.image || "[]");
                (imgs || []).forEach(src => {
                    const popupimg = document.createElement("img");
                    popupimg.src = src;
                    popupimg.classList.add('pop-up-image');
                    popupimg.dataset.image = src;
                    attachPopupImageBehavior(popupimg);
                    popupimagecontainer.appendChild(popupimg);
                });
            } catch (err) {
                console.warn("Failed parsing organelle images:", err);
            }

            if (popup) popup.classList.add('active');
        });
    });
}

// popup add -> file input
if (popupimageadd && popupimageinput) popupimageadd.addEventListener('click', () => popupimageinput.click());

// popup file input handler (attach File to element)
if (popupimageinput && popupimagecontainer) {
    popupimageinput.addEventListener("change", (e) => {
        const popupfile = e.target.files[0];
        if (!popupfile) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const popupimg = document.createElement('img');
            popupimg.src = event.target.result;
            popupimg.file = popupfile; // attach actual File
            popupimg.dataset.image = popupimg.src;
            popupimg.dataset.name = popupfile.name || `popup-${Date.now()}.png`;
            popupimg.classList.add('pop-up-image');
            attachPopupImageBehavior(popupimg);
            popupimagecontainer.appendChild(popupimg);
        };
        reader.readAsDataURL(popupfile);
        popupimageinput.value = "";
    });
}

// save popup: write back to organelle dataset attributes
if (savepopup) {
    savepopup.addEventListener('click', () => {
        if (!currentOrganel) return;
        currentOrganel.dataset.content = popupmessage?.value || "";
        const imgs = [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src);
        currentOrganel.dataset.image = JSON.stringify(imgs);
        popup?.classList.remove('active');
        popupImageRemoveMode = false;
        updateRemovableClass('.pop-up-image', false);
        if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
        removeBodyEraser();
    });
}

// close popup
if (closepopup) {
    closepopup.addEventListener('click', () => {
        popup?.classList.remove('active');
        popupImageRemoveMode = false;
        updateRemovableClass('.pop-up-image', false);
        if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
        removeBodyEraser();
    });
}

// backdrop click saves popup changes and closes
if (popup) {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            if (currentOrganel) {
                currentOrganel.dataset.content = popupmessage?.value || "";
                const imgs = [...(popupimagecontainer?.querySelectorAll("img") || [])].map(img => img.src);
                currentOrganel.dataset.image = JSON.stringify(imgs);
            }
            popup.classList.remove('active');
            popupImageRemoveMode = false;
            updateRemovableClass('.pop-up-image', false);
            if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
            removeBodyEraser();
        }
    });
}

// -----------------------------
// Main images add/remove
// -----------------------------
if (mainaddBtn && mainimageinput) mainaddBtn.addEventListener('click', () => mainimageinput.click());

if (mainimageinput && mainimagesContainer) {
    mainimageinput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('main-image');
            img.dataset.src = img.src;
            img.dataset.name = file.name || `main-${Date.now()}.png`;
            img.file = file;
            attachMainImageBehavior(img);
            mainimagesContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
        mainimageinput.value = "";
    });
}

// REMOVE toggles for main/popup images
if (mainremoveBtn) {
    mainremoveBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (popupImageRemoveMode) {
            popupImageRemoveMode = false;
            updateRemovableClass('.pop-up-image', false);
            if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
        }
        mainImageRemoveMode = !mainImageRemoveMode;
        updateRemovableClass('.main-image', mainImageRemoveMode);
        mainremoveBtn.textContent = mainImageRemoveMode ? "Cancelar quitar" : "Quitar imagen";
        if (mainImageRemoveMode) addBodyEraser(); else removeBodyEraser();
    });
}
if (popupimageremove) {
    popupimageremove.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (mainImageRemoveMode) {
            mainImageRemoveMode = false;
            updateRemovableClass('.main-image', false);
            if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';
        }
        popupImageRemoveMode = !popupImageRemoveMode;
        updateRemovableClass('.pop-up-image', popupImageRemoveMode);
        popupimageremove.textContent = popupImageRemoveMode ? "Cancelar quitar" : "Quitar imagen";
        if (popupImageRemoveMode) addBodyEraser(); else removeBodyEraser();
    });
}

// -----------------------------
// Local save (.txt)
// -----------------------------
if (savebtn) {
    savebtn.addEventListener('click', () => {
        const content = gatherEditorContent();
        const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dataset.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
}

// -----------------------------
// Upload helper (supports File or dataURL string)
// -----------------------------
async function uploadImage(fileOrDataUrl, filename) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Must be logged in to upload images");

    // convert dataURL to Blob if necessary
    let fileToUpload = fileOrDataUrl;
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
        const res = await fetch(fileOrDataUrl);
        fileToUpload = await res.blob();
    }

    // Ensure filename is safe
    const safeName = filename.replace(/[^\w.\-]/g, '_');
    const filePath = `${user.id}/${Date.now()}-${safeName}`;

    const { error: uploadErr } = await supabase.storage.from("images").upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false });
    if (uploadErr) {
        throw uploadErr;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    return data.publicUrl;
}

// -----------------------------
// Auth helper
// -----------------------------
async function getCurrentUser() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
}

// -----------------------------
// CREATE document + organelles + images
// -----------------------------
async function createDocumentAndAssets(editorContent) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Must be logged in to create document");

    const id = nanoid();
    const now = new Date().toISOString();

    // insert document row (content saved too)
    const { error: docErr } = await supabase.from('documents').insert({
        id,
        creator: user.email,
        owner_id: user.id,
        created_at: now,
        updated_at: now,
        content: editorContent
    });

    if (docErr) throw docErr;

    // create organelles & images
    for (const organelle of (editorContent.organelos || [])) {
        const { data: organelleRow, error: orgErr } = await supabase.from('organelles')
            .insert({
                document_id: id,
                name: organelle.id || `org-${Date.now()}`,
                content: organelle.content || ""
            })
            .select()
            .single();
        if (orgErr) throw orgErr;

        for (const img of (organelle.images || organelle.image || [])) {
            let finalUrl = img.src;
            if (img.file) {
                finalUrl = await uploadImage(img.file, img.name || `${organelleRow.id}-${Date.now()}.png`);
            }
            const { error: imgErr } = await supabase.from('images').insert({
                organelle_id: organelleRow.id,
                url: finalUrl
            });
            if (imgErr) throw imgErr;
        }
    }

    // main images
    for (const mi of (editorContent.mainImages || [])) {
        let finalUrl = mi.src;
        if (mi.file) {
            finalUrl = await uploadImage(mi.file, mi.name || `main-${Date.now()}.png`);
        }
        const { error: imgErr } = await supabase.from('images').insert({
            document_id: id,
            url: finalUrl
        });
        if (imgErr) throw imgErr;
    }

    return id;
}

// -----------------------------
// UPDATE document + assets (clear & reinsert)
// -----------------------------
async function updateDocumentAndAssets(documentId, editorContent) {
    const now = new Date().toISOString();

    // update document's content and updated_at
    const { error: docErr } = await supabase.from('documents').update({
        updated_at: now,
        content: editorContent
    }).eq('id', documentId);
    if (docErr) throw docErr;

    // fetch organelle ids for this document
    const { data: existingOrganelles } = await supabase.from('organelles').select('id').eq('document_id', documentId);
    const organelleIds = (existingOrganelles || []).map(r => r.id);

    // delete images tied to document (document-level)
    await supabase.from('images').delete().eq('document_id', documentId);

    // delete images tied to those organelles (if any)
    if (organelleIds.length) {
        await supabase.from('images').delete().in('organelle_id', organelleIds);
    }

    // delete organelles
    await supabase.from('organelles').delete().eq('document_id', documentId);

    // reinsert organelles & images
    for (const organelle of (editorContent.organelos || [])) {
        const { data: organelleRow, error: orgErr } = await supabase.from('organelles')
            .insert({
                document_id: documentId,
                name: organelle.id || `org-${Date.now()}`,
                content: organelle.content || ""
            })
            .select()
            .single();
        if (orgErr) throw orgErr;

        for (const img of (organelle.images || organelle.image || [])) {
            let finalUrl = img.src;
            if (img.file) {
                finalUrl = await uploadImage(img.file, img.name || `${organelleRow.id}-${Date.now()}.png`);
            }
            const { error: imgErr } = await supabase.from('images').insert({
                organelle_id: organelleRow.id,
                url: finalUrl
            });
            if (imgErr) throw imgErr;
        }
    }

    // reinsert main images
    for (const mi of (editorContent.mainImages || [])) {
        let finalUrl = mi.src;
        if (mi.file) {
            finalUrl = await uploadImage(mi.file, mi.name || `main-${Date.now()}.png`);
        }
        const { error: imgErr } = await supabase.from('images').insert({
            document_id: documentId,
            url: finalUrl
        });
        if (imgErr) throw imgErr;
    }

    return true;
}

// -----------------------------
// LOAD document and build editor-format content
// -----------------------------
async function loadDocumentById(id) {
    const { data: doc, error: docErr } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
    if (docErr) throw docErr;
    if (!doc) throw new Error("Document not found");

    const { data: organellesRows, error: orgErr } = await supabase.from('organelles').select('*').eq('document_id', id);
    if (orgErr) throw orgErr;

    const { data: docImages, error: diErr } = await supabase.from('images').select('*').eq('document_id', id);
    if (diErr) throw diErr;

    // organelle images lookup
    const organelleImages = {};
    for (const o of (organellesRows || [])) {
        const { data: imgs, error: imgErr } = await supabase.from('images').select('*').eq('organelle_id', o.id);
        if (imgErr) throw imgErr;
        organelleImages[o.name] = imgs || [];
    }

    return {
        ...doc,
        content: {
            description: doc.description,
            mainImages: (docImages || []).map(i => i.url),
            organelos: (organellesRows || []).map(o => ({
                id: o.name,
                content: o.content,
                image: (organelleImages[o.name] || []).map(i => i.url)
            }))
        }
    };
}

// =======================
// EVENT HANDLERS
// =======================

// --- SAVE ONLINE ---
if (saveonlinebutton) {
    saveonlinebutton.addEventListener("click", async () => {
        console.log("💾 Save Online button clicked");

        const content = gatherEditorContent();
        console.log("📦 Gathered editor content:", content);

        try {
            const docId = new URLSearchParams(window.location.search).get("id");
            const savedId = await createDocumentAndAssets(content, docId);

            if (savedId) {
                alert("✅ Document saved online!");
                console.log("🔗 Saved document ID:", savedId);
            }
        } catch (err) {
            console.error("❌ Save failed:", err);
            alert("Save failed, check console");
        }
    });
} else {
    console.error("❌ Save Online button NOT found in DOM");
}

// --- COPY LINK ---
if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
        console.log("📋 Copy button clicked");

        const docId = new URLSearchParams(window.location.search).get("id");
        if (!docId) {
            alert("❌ No document ID found in URL");
            return;
        }

        const shareUrl = `${window.location.origin}/editor.html?id=${docId}`;
        console.log("🔗 Share URL generated:", shareUrl);

        try {
            await navigator.clipboard.writeText(shareUrl);
            alert("✅ Link copied to clipboard!");
        } catch (err) {
            console.error("❌ Clipboard write failed:", err);
            alert("Failed to copy link. Try manually: " + shareUrl);
        }
    });
} else {
    console.error("❌ Copy button NOT found in DOM");
}


// -----------------------------
// Local load from .txt/.json
// -----------------------------
if (loadBtn && loadInput) {
    loadBtn.addEventListener("click", () => loadInput.click());
    loadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                populateEditorWithContent(data);
                alert("Contenido cargado correctamente!");
            } catch (err) {
                console.error("Local load parse error:", err);
                alert("El archivo no es un JSON válido.");
            }
        };
        reader.readAsText(file);
        loadInput.value = "";
    });
}

// -----------------------------
// Auto-load on DOMContentLoaded + authorization checks
// -----------------------------
async function refreshSignInUI() {
    const user = await getCurrentUser();
    if (signInBtn) signInBtn.style.display = user ? 'none' : 'inline-block';
}
supabase.auth.onAuthStateChange((_e, _s) => refreshSignInUI().catch(console.error));

window.addEventListener('DOMContentLoaded', async () => {
    await refreshSignInUI();
    const docId = new URLSearchParams(window.location.search).get('id');
    if (!docId) return;
    try {
        const doc = await loadDocumentById(docId);
        if (!doc) { alert("Documento no encontrado."); window.location.href = "../Viewer/view.html"; return; }
        const user = await getCurrentUser();
        if (!user || user.email !== doc.creator) {
            alert("No tienes autorización para editar este documento. Redirigiendo a la vista...");
            window.location.href = `../Viewer/view.html?id=${docId}`;
            return;
        }
        if (doc.content) populateEditorWithContent(doc.content);
    } catch (err) {
        console.error("Load doc error:", err);
        alert("Error cargando documento — redirigiendo a vista...");
        window.location.href = `../Viewer/view.html?id=${docId}`;
    }
});

// -----------------------------
// Return home, switch to viewer, organelle hover names
// -----------------------------
if (returnHomeBtn) returnHomeBtn.addEventListener('click', () => window.location.href = "/index.html");

if (switchviewbtn) {
    switchviewbtn.addEventListener('click', () => {
        const docId = new URLSearchParams(window.location.search).get('id');
        if (!docId) { alert("Guarda el documento antes de entrar en modo visor."); return; }
        const viewerUrl = `https://mentorigroup.com/MentoriCelulaAnimal/Viewer/view.html?id=${docId}`;
        window.open(viewerUrl, "_blank");
    });
}

function setupOrganelName(orgEl, displayName) {
    if (!orgEl) return;
    orgEl.addEventListener('click', () => { if (popupname) popupname.textContent = displayName; });
    orgEl.addEventListener('mouseenter', () => { if (mainorganelname) mainorganelname.textContent = displayName; });
    orgEl.addEventListener('mouseleave', () => { if (mainorganelname) mainorganelname.textContent = "Célula animal"; });
}

setupOrganelName(membranacelular, "Membrana celular");
setupOrganelName(ribosomas, "Ribosomas");
setupOrganelName(citoplasma, "Citoplasma");
setupOrganelName(nucleolo, "Nucléolo");
setupOrganelName(nucleo, "Núcleo");
setupOrganelName(reticuloendoplasmatico, "Retículo endoplasmático");
setupOrganelName(centriolos, "Centriolos");
setupOrganelName(microtubulos, "Microtúbulos");
setupOrganelName(mitocondrias, "Mitocondrias");
setupOrganelName(lisosomas, "Lisosomas");
setupOrganelName(aparatodegolgi, "Aparato de Golgi");

// End of editor.js
