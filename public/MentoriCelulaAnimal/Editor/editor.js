// editor.js — rewritten to store description in documents.content, organelle texts in organelles table,
// and upload images to Supabase Storage bucket "CelulaAnimalImgs". Local .txt export still contains Base64
// as before. Original DOM event bindings and function names are preserved.

// -----------------------------
// Top-level imports (must be at top)
// -----------------------------
import { supabase } from '../../supabase.js';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

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
const userDiv = document.getElementById("user"); // <-- for login/logout UI

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
const ribosomas = document.getElementById('ribosomas');

// -----------------------------
// State
// -----------------------------
let currentogranel = null;
let popupimageremoveMode = false;
let mainimageremoveMode = false;

// -----------------------------
// Configuration
// -----------------------------
const IMGS_BUCKET = "CelulaAnimalImgs";
const BUCKET_ROOT_FOLDER = ""; // root within bucket; kept blank so we upload as `${docId}/...`
const SUPABASE_PUBLIC_BASE = ""; // not used directly; we use getPublicUrl per file

// -----------------------------
// Organelles -> DB column mapping
// Note: columns come from the SQL you supplied. There are some naming differences
// (e.g. 'citplasma_content' in your SQL; we map safely).
// -----------------------------
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

// Utility to get safe folder name for an organelle (no spaces, lowercase)
function organelleFolderName(domId) {
    if (!domId) return "";
    return domId.replace(/\s+/g, '_').toLowerCase();
}

// -----------------------------
// AUTH HELPERS (added)
// -----------------------------
async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${location.origin}/MentoriCelulaAnimal/Editor/editor.html`
        }
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
      <span style="color:black; margin-right: 10px;">${user.email ?? ""}</span>
      <button id="logout">Cerrar sesión</button>
    `;
        document.getElementById("logout")?.addEventListener("click", logout);
    } else {
        userDiv.innerHTML = `<button id="login">Iniciar sesión</button>`;
        document.getElementById("login")?.addEventListener("click", login);
    }
}

(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    renderUser(session?.user ?? null);
})();

supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user ?? null);
});

// -----------------------------
// Helpers: cursor + removable helpers
// -----------------------------
function updateRemovableClass(selector, state) {
    document.querySelectorAll(selector).forEach(img => {
        img.classList.toggle('removable', state);
    });
}

function addBodyEraser() {
    document.body.classList.add('eraser-cursor');
}
function removeBodyEraser() {
    document.body.classList.remove('eraser-cursor');
}

function exitAllRemoveModes() {
    popupimageremoveMode = false;
    mainimageremoveMode = false;

    updateRemovableClass('.pop-up-image', false);
    updateRemovableClass('.main-image', false);

    if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
    if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';

    removeBodyEraser();
}

// If user clicks anywhere that's NOT an image, cancel remove modes.
document.addEventListener('click', (e) => {
    const target = e.target;
    const clickedMainImage = target.classList && target.classList.contains('main-image');
    const clickedPopupImage = target.classList && target.classList.contains('pop-up-image');

    // Any non-image click exits remove mode
    if ((popupimageremoveMode || mainimageremoveMode) &&
        !clickedMainImage && !clickedPopupImage) {
        exitAllRemoveModes();
    }
});

// -----------------------------
// Helper: attach handlers to images (main & popup)
// -----------------------------
// Attach only once per element (guard with property)
function attachMainImageBehavior(img) {
    if (!img || img.__mainHandlersAttached) return;
    img.__mainHandlersAttached = true;

    img.addEventListener('click', (ev) => {
        if (mainimageremoveMode) {
            ev.stopPropagation();
            if (img.parentElement) img.parentElement.removeChild(img);
        }
    });
}

function attachPopupImageBehavior(img) {
    if (!img || img.__popupHandlersAttached) return;
    img.__popupHandlersAttached = true;

    img.addEventListener('click', (ev) => {
        if (popupimageremoveMode) {
            ev.stopPropagation();
            if (img.parentElement) img.parentElement.removeChild(img);
        }
    });
}

// Attach handlers to currently existing images (defensive)
document.querySelectorAll('.main-image').forEach(attachMainImageBehavior);
document.querySelectorAll('.pop-up-image').forEach(attachPopupImageBehavior);

// -----------------------------
// Helper: Gather editor content (fixed variable naming)
// -----------------------------
// IMPORTANT: keep the same function name and return shape so local save still works unchanged.
// This gathers current editor state into an object. For local save we keep Base64 image data (if present).
function gatherEditorContent() {
    const savedataexport = {
        description: document.getElementById("description")?.value || "",
        mainImages: [...(mainimagesContainer?.querySelectorAll("img") || [])].map(img => img.src),
        organelos: []
    };

    Array.from(organelos).forEach((organelo) => {
        const id = organelo?.id ?? (organelo ? organelo.id : null);
        const content = organelo?.dataset?.content ?? (organelo.dataset?.content || "");
        let imagesArray = [];
        try {
            if (organelo.dataset?.image) imagesArray = JSON.parse(organelo.dataset.image);
            else if (organelo.dataset?.image === "") imagesArray = [];
        } catch (err) {
            imagesArray = [];
        }

        savedataexport.organelos.push({
            id,
            content,
            image: imagesArray
        });
    });

    return savedataexport;
}

// -----------------------------
// Helper: Populate editor with content
// -----------------------------
// This is used by local-load (JSON file import). It expects data shape identical to gatherEditorContent.
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
            img.dataset.src = src;

            attachMainImageBehavior(img);
            mainimagesContainer.appendChild(img);
        });
    }

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
// Pop-up logic (open / add images / save / close)
// -----------------------------
if (organelos && organelos.length) {
    organelos.forEach(selectedorganel => {
        selectedorganel.addEventListener('click', (e) => {
            // Opening a popup should cancel main-image remove mode
            if (mainimageremoveMode) {
                mainimageremoveMode = false;
                updateRemovableClass('.main-image', false);
                if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';
                removeBodyEraser();
            }

            currentogranel = selectedorganel;
            if (popupmessage) popupmessage.value = selectedorganel.dataset?.content || "";
            if (popupimagecontainer) popupimagecontainer.innerHTML = "";

            if (selectedorganel.dataset?.image && popupimagecontainer) {
                try {
                    const imgs = JSON.parse(selectedorganel.dataset.image || "[]");
                    imgs.forEach(src => {
                        const popupimg = document.createElement("img");
                        popupimg.src = src;
                        popupimg.classList.add("pop-up-image");
                        attachPopupImageBehavior(popupimg);
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

// popup image input (file -> dataURL -> image element)
// NOTE: still uses readAsDataURL for client-side preview + local save behavior (Base64).
// When saving online we'll upload the original file (we keep a reference in the <img>.src as Base64 for local export).
if (popupimageinput && popupimagecontainer) {
    popupimageinput.addEventListener("change", (e) => {
        const popupfile = e.target.files[0];
        if (!popupfile) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const popupimg = document.createElement("img");
            popupimg.src = event.target.result; // data URL (Base64)
            popupimg.classList.add("pop-up-image");
            // store the data URL on dataset as in the original implementation; used by local save
            popupimg.dataset.image = popupimg.src;

            attachPopupImageBehavior(popupimg);
            popupimagecontainer.appendChild(popupimg);
        };
        reader.readAsDataURL(popupfile);
        popupimageinput.value = "";
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
        popupimageremoveMode = false;
        updateRemovableClass('.pop-up-image', false);
        if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
        removeBodyEraser();
    });
}

// close popup (cancel)
if (closepopup) {
    closepopup.addEventListener("click", () => {
        popup?.classList.remove('active');
        // reset popup remove mode on close
        popupimageremoveMode = false;
        updateRemovableClass('.pop-up-image', false);
        if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
        removeBodyEraser();
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
            popupimageremoveMode = false;
            updateRemovableClass('.pop-up-image', false);
            if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
            removeBodyEraser();
        }
    });
}

// -----------------------------
// Main images logic (add / remove toggle)
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
            img.src = event.target.result; // data URL for preview and local export
            img.classList.add("main-image");
            img.dataset.src = img.src;

            // Attach removal + hover handlers
            attachMainImageBehavior(img);

            mainimagesContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
        mainimageinput.value = "";
    });
}

// -----------------------------
// MAIN IMAGE REMOVE TOGGLE
// -----------------------------
if (mainremoveBtn) {
    mainremoveBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();

        // cancel popup mode if active
        if (popupimageremoveMode) {
            popupimageremoveMode = false;
            updateRemovableClass('.pop-up-image', false);
            if (popupimageremove) popupimageremove.textContent = 'Quitar imagen';
        }

        mainimageremoveMode = !mainimageremoveMode;

        // toggle removable class
        updateRemovableClass('.main-image', mainimageremoveMode);

        // button text
        mainremoveBtn.textContent = mainimageremoveMode ? "Cancelar quitar" : "Quitar imagen";

        // eraser cursor on body
        if (mainimageremoveMode) addBodyEraser();
        else removeBodyEraser();

        console.log('mainimageremoveMode:', mainimageremoveMode);
    });
}

// -----------------------------
// POPUP IMAGE REMOVE TOGGLE
// -----------------------------
if (popupimageremove) {
    popupimageremove.addEventListener("click", (ev) => {
        ev.stopPropagation();

        // cancel main mode if active
        if (mainimageremoveMode) {
            mainimageremoveMode = false;
            updateRemovableClass('.main-image', false);
            if (mainremoveBtn) mainremoveBtn.textContent = 'Quitar imagen';
        }

        popupimageremoveMode = !popupimageremoveMode;

        // toggle removable class
        updateRemovableClass('.pop-up-image', popupimageremoveMode);

        // button text
        popupimageremove.textContent = popupimageremoveMode ? "Cancelar quitar" : "Quitar imagen";

        // eraser cursor on body
        if (popupimageremoveMode) addBodyEraser();
        else removeBodyEraser();

        console.log('popupimageremoveMode:', popupimageremoveMode);
    });
}

// -----------------------------
// Local save (.txt)
// -----------------------------
// This behavior is unchanged: we export the entire structure (including Base64 data URLs if present)
// into a JSON file which the user can re-import.
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
// Supabase Online Save & Load helpers
// -----------------------------
async function getCurrentUser() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
}

// createDocument now expects an editorContent object (the same object returned by gatherEditorContent),
// but only stores description into documents.content (per your requirements).
async function createDocument(editorContent) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged-in to save document');

    const id = nanoid();
    const now = new Date().toISOString();
    const { error } = await supabase.from('documents').insert({
        id,
        title: 'Untitled',
        description: null,
        content: { description: editorContent?.description ?? "" },
        creator: user.email,
        owner_id: user.id,
        created_at: now,
        updated_at: now
    });

    if (error) throw error;
    return id;
}

// updateDocument will update only the content (description) field on documents table
async function updateDocument(id, editorContent) {
    const now = new Date().toISOString();
    const { error } = await supabase.from('documents')
        .update({ content: { description: editorContent?.description ?? "" }, updated_at: now })
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

// -----------------------------
// Storage helpers (uploading / listing / getting public URLs)
// -----------------------------
// -----------------------------
// Storage helpers (uploading / listing / getting public URLs)
// -----------------------------
/**
 * Upload a Blob/File to Supabase storage, path is like `${docId}/main_imgs/img0.png`.
 * Returns public URL string.
 */
async function uploadBlobToBucket(blobOrFile, path) {
    if (!blobOrFile) throw new Error('No file/blob provided to uploadBlobToBucket');

    // ✅ Ensure the user is signed in — Storage requires a valid UUID owner_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData?.user) throw new Error("You must be logged in to upload files.");

    // ✅ Upload (Supabase automatically assigns owner_id = user.id)
    const { data, error } = await supabase.storage
        .from(IMGS_BUCKET)
        .upload(path, blobOrFile, { upsert: true });

    if (error) {
        console.error("❌ uploadBlobToBucket upload error:", error.message);
        throw error;
    }

    // ✅ Get the public URL
    const { data: publicData, error: publicErr } = await supabase.storage
        .from(IMGS_BUCKET)
        .getPublicUrl(path);

    if (publicErr) throw publicErr;

    const publicUrl = publicData?.publicUrl || publicData?.public_url || null;
    return publicUrl;
}

/**
 * List all files inside a Supabase Storage folder.
 * Returns an array of file objects (each with .name, .id, etc.).
 */
export async function listBucketFiles(path) {
    const { data, error } = await supabase.storage.from(IMGS_BUCKET).list(path, {
        limit: 100,
        offset: 0,
    });
    if (error) {
        console.warn("⚠️ listBucketFiles error:", error.message);
        return [];
    }
    return data || [];
}

/**
 * Get the public URL for a file in the bucket.
 */
export function getPublicUrlForPath(path) {
    const { data } = supabase.storage.from(IMGS_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
}

/**
 * Convert a dataURL (data:...base64,...) into a Blob.
 */
function dataURLToBlob(dataURL) {
    const parts = dataURL.split(',');
    const header = parts[0];
    const base64 = parts[1];
    const matches = header.match(/data:(.*?);base64/);
    const contentType = matches ? matches[1] : 'application/octet-stream';
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: contentType });
}


/**
 * Given an image src, try to produce a Blob:
 * - if src is a data URL -> convert to Blob
 * - otherwise attempt fetch(src) and return response.blob()
 */
async function getBlobFromSrc(src) {
    if (!src) throw new Error('No src provided to getBlobFromSrc');
    if (src.startsWith('data:')) {
        return dataURLToBlob(src);
    }
    // If it's already a public URL we could optionally skip re-uploading.
    // But to be robust, try fetching it and returning a blob so we can re-upload into our bucket.
    const resp = await fetch(src);
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
    return await resp.blob();
}

/**
 * Determine file extension from a blob.type (MIME) or fallback extension
 */
function extensionFromMime(mime) {
    if (!mime) return 'png';
    const parts = mime.split('/');
    if (parts.length === 2) {
        const ext = parts[1].split('+')[0]; // handle image/svg+xml etc.
        // normalize some common types
        if (ext === 'jpeg') return 'jpg';
        return ext;
    }
    return 'png';
}

// ------------------------------
// Copy Button
// ------------------------------
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const content = gatherEditorContent(); // get current editor content
        const user = await getCurrentUser();

        if (!user) {
            alert('Debes haber iniciado sesión para copiar un documento');
            return;
        }

        try {
            // Create new document with same content (only description will be stored in documents.content)
            const newId = await createDocument(content);

            // Upload images to bucket for the new document (so the copied doc is complete)
            // We reuse the same upload routine as save-online below but simplified (no permission checks needed)
            await uploadAllImagesForDocument(newId, content);

            // Create organelles row for new doc with text content
            await upsertOrganellesText(newId, content);

            // Open new editor window with new document
            window.open(`/MentoriCelulaAnimal/Editor/editor.html?id=${newId}`, '_blank');
        } catch (err) {
            console.error(err);
            alert('Error al copiar el documento: ' + err.message);
        }
    });
}

// -----------------------------
// Save online (create or update) — NEW behavior
// - documents.content stores ONLY the description (text area).
// - organelles table stores each organelle's textual content in its corresponding column.
// - images (main + organelle) are uploaded to Supabase Storage bucket under folder named after the document id.
// - local save behavior remains unchanged.
// -----------------------------
if (saveonlinebutton) {
    saveonlinebutton.addEventListener("click", async () => {
        const content = gatherEditorContent();
        const currentDocId = new URLSearchParams(window.location.search).get("id");

        try {
            const user = await getCurrentUser();
            if (!user) return alert("Debes estar en una cuenta para poder guardar en linea.");

            // if docId exists -> load and check ownership
            if (currentDocId) {
                const doc = await loadDocumentById(currentDocId);
                if (!doc) return alert("No se encontro el documento.");
                if (doc.creator !== user.email) return alert("Tú no eres el creador de este documento.");

                // Update documents.content with description only
                await updateDocument(currentDocId, content);

                // Upload images for this document into bucket
                await uploadAllImagesForDocument(currentDocId, content);

                // Upsert organelles text content into organelles table
                await upsertOrganellesText(currentDocId, content);

                alert("Documento guardado exitosamente!");
            } else {
                // create a new document and then upload assets
                const newId = await createDocument(content);

                // upload images to bucket
                await uploadAllImagesForDocument(newId, content);

                // upsert organelles text (create row)
                await upsertOrganellesText(newId, content);

                alert("Documento guardado exitosamente!");
                // Redirect to editor with new id
                window.location.href = `../Editor/editor.html?id=${newId}`;
            }
        } catch (err) {
            console.error(err);
            alert("Error al guardar el documento: " + err.message);
        }
    });
}

// ----------------------------------------------------------
// Upload all images for a given document and its organelles
// ----------------------------------------------------------
async function uploadAllImagesForDocument(documentId, editorContent) {
    if (!documentId) throw new Error("uploadAllImagesForDocument requires a documentId");

    // --- MAIN IMAGES ---
    const mainImgs = [...(mainimagesContainer?.querySelectorAll("img") || [])];
    for (let i = 0; i < mainImgs.length; i++) {
        const src = mainImgs[i].src;
        try {
            // Skip if already uploaded
            if (src && src.startsWith('http') && src.includes(`/storage/v1/object/public/${IMGS_BUCKET}/`)) {
                continue;
            }

            const blob = await getBlobFromSrc(src);
            const ext = extensionFromMime(blob.type);
            const filename = `main_imgs/img_${i}_${crypto.randomUUID()}.${ext}`;
            const path = `${documentId}/${filename}`;

            const publicUrl = await uploadBlobToBucket(blob, path);

            // Update image src to point to Supabase public URL
            mainImgs[i].src = publicUrl;
            mainImgs[i].dataset.src = publicUrl;
        } catch (err) {
            console.warn("⚠️ Failed to upload main image:", err);
        }
    }

    // --- ORGANELE IMAGES ---
    for (const organel of organelos) {
        let imgs = [];
        try {
            imgs = JSON.parse(organel.dataset.image || "[]");
        } catch {
            imgs = [];
        }

        const folderName = organelleFolderName(organel.id || organel.dataset?.organelId || 'unknown');
        const newUrls = [];

        for (let i = 0; i < imgs.length; i++) {
            const src = imgs[i];
            try {
                if (src && src.startsWith('http') && src.includes(`/storage/v1/object/public/${IMGS_BUCKET}/`)) {
                    newUrls.push(src);
                    continue;
                }

                const blob = await getBlobFromSrc(src);
                const ext = extensionFromMime(blob.type);
                const filename = `${folderName}/img_${i}_${crypto.randomUUID()}.${ext}`;
                const path = `${documentId}/${filename}`;
                const publicUrl = await uploadBlobToBucket(blob, path);
                newUrls.push(publicUrl);
            } catch (err) {
                console.warn(`⚠️ Failed to upload image for organelle ${organel.id}:`, err);
                if (src) newUrls.push(src);
            }
        }

        // Update dataset.image for the organelle
        try {
            organel.dataset.image = JSON.stringify(newUrls);
        } catch {
        }
    }

    // Return success indicator
    return true;
}


    /**
 * Upsert organelle textual contents into the organelles table for the given documentId.
 * The organelles table has one row per document (id) and many columns (one per organelle).
 *
 * We build a row object where:
 * - id = nanoid() or `${documentId}-org` (use deterministic id tied to document)
 * - document_id = documentId
 * - creator = current user email
 * - then set each column to organelle.dataset.content or empty string/null
 *
 * If a row already exists for this document_id we perform an upsert (update).
 */
async function upsertOrganellesText(documentId, editorContent) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged-in to write organelle text');

    // Build payload
    const payload = {
        id: `${documentId}-organelles`, // deterministic id so upserts are easy
        document_id: documentId,
        creator: user.email
    };

    // For each organelle in ORGANELLE_COLUMN_MAP try to read its content from the DOM
    for (const domId in ORGANELLE_COLUMN_MAP) {
        const colName = ORGANELLE_COLUMN_MAP[domId];
        const el = document.getElementById(domId);
        const content = el?.dataset?.content ?? "";
        payload[colName] = content;
    }

    // also handle any organeles that exist in the DOM but not in the mapping (defensive)
    // we won't write them to DB but we might console.warn
    const { error } = await supabase
        .from('organelles') // <-- make sure this matches your exact Supabase table name
        .upsert(payload, { onConflict: 'document_id' });

    if (error) {
        // try fallback: insert or update separately to provide clearer error
        throw error;
    }
    return true;
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
                alert("Centenido cargado correctamente!");
            } catch {
                alert("Error: El archivo no es un JSON valido.");
            }
        };
        reader.readAsText(file);
        loadInput.value = "";
    });
}

// -----------------------------
// Auto-load dataset & enforce creator-only access
//    On page load (DOMContentLoaded) we:
//     - refresh sign-in UI
//     - if docId present: load document row from documents table
//         - if not found -> redirect to viewer
//         - if user != creator -> redirect to viewer
//         - populate editor with local-style content if doc.content is JSON (backwards compat)
//         - populate description from documents.content
//         - load main images list from bucket folder `${docId}/main_imgs` and add images to mainimagesContainer
//         - load organelles text from organelles table and set dataset.content
//         - load organelle images from bucket folder `${docId}/{organelFolder}` and set dataset.image to JSON array of public urls
// -----------------------------
async function refreshSignInUI() {
    const user = await getCurrentUser();
    if (signInBtn) {
        signInBtn.style.display = user ? 'none' : 'inline-block';
    }
}

// Listen to auth state changes so UI updates instantly on sign in/out
supabase.auth.onAuthStateChange((_event, _session) => {
    refreshSignInUI().catch(err => console.error('refreshSignInUI error', err));
});

window.addEventListener('DOMContentLoaded', async () => {
    // Update sign-in button visibility at startup
    await refreshSignInUI();

    const docId = new URLSearchParams(window.location.search).get("id");
    if (!docId) return;

    try {
        // 1) Load document row
        const doc = await loadDocumentById(docId);
        if (!doc) {
            alert("Documento no encontrado.");
            window.location.href = "../Viewer/view.html";
            return;
        }

        const user = await getCurrentUser();
        console.log("👤 Auth user from Supabase:", user);
        console.log("📄 Document creator from DB:", doc.creator);
        if (!user || user.id !== doc.owner_id) {
            alert("No tienes la autorización para editar este documento, enviandote a la versión de vista...");
            window.location.href = `../Viewer/view.html?id=${docId}`;
            return;
        }

        // 2) Populate description (documents.content stores only description per your spec)
        if (doc.content) {
            const descElem = document.getElementById("description");
            if (descElem) descElem.value = doc.content;
        }

        // 3) Try to populate from doc.content if it contains JSON (legacy support)
        // If doc.content is actually JSON with the old shape, allow populateEditorWithContent to run.
        // This keeps backwards compatibility for older documents that were saved as full JSON objects.
        try {
            // If content is JSON text (starts with { or [ ) attempt parse and populate
            if (typeof doc.content === 'string' && (doc.content.trim().startsWith('{') || doc.content.trim().startsWith('['))) {
                // Attempt parsing
                const parsed = JSON.parse(doc.content);
                // populateEditorWithContent expects the shape from gatherEditorContent
                populateEditorWithContent(parsed);
            }
        } catch (err) {
            // not JSON -> ignore
        }

        // 4) Load main images from bucket `${docId}/main_imgs/`
        // We list files under `${docId}/main_imgs` to find stored images.
        const mainFolder = `${docId}/main_imgs`;
        const mainFiles = await listBucketFiles(mainFolder);
        if (mainimagesContainer) {
            mainimagesContainer.innerHTML = "";
            for (const file of mainFiles) {
                try {
                    // Construct path and fetch public URL
                    const filePath = `${mainFolder}/${file.name}`;
                    const publicUrl = getPublicUrlForPath(filePath);
                    if (!publicUrl) continue;
                    const img = document.createElement("img");
                    img.src = publicUrl;
                    img.classList.add("main-image");
                    img.dataset.src = publicUrl;
                    attachMainImageBehavior(img);
                    mainimagesContainer.appendChild(img);
                } catch (err) {
                    console.warn("Failed to append main image from bucket:", err);
                }
            }
        }

        // 5) Load organelles text row
        const { data: orgRow, error: orgErr } = await supabase
            .from('organelles')
            .select('*')
            .eq('document_id', docId)
            .maybeSingle();

        if (orgErr) {
            console.warn('Failed to fetch organelles row:', orgErr);
        }

        // If organelles row exists, set dataset.content for each organelle element
        if (orgRow) {
            for (const domId in ORGANELLE_COLUMN_MAP) {
                const colName = ORGANELLE_COLUMN_MAP[domId];
                const el = document.getElementById(domId);
                if (!el) continue;
                const val = orgRow[colName] ?? "";
                el.dataset.content = val;
            }

            // Now for each organelle also list images in `${docId}/{folderName}/` and set dataset.image to JSON array of public urls
            for (const domId in ORGANELLE_COLUMN_MAP) {
                const el = document.getElementById(domId);
                if (!el) continue;
                const folderName = organelleFolderName(domId);
                const folderPath = `${docId}/${folderName}`;
                const files = await listBucketFiles(folderPath);
                const urls = [];
                for (const file of files) {
                    try {
                        const p = `${folderPath}/${file.name}`;
                        const publicUrl = getPublicUrlForPath(p);
                        if (publicUrl) urls.push(publicUrl);
                    } catch (err) {
                        console.warn(`Failed to get public URL for ${file.name}:`, err);
                    }
                }
                // set dataset.image to the array of urls (this is what other code expects)
                el.dataset.image = JSON.stringify(urls);
            }
        } else {
            // If no organelles row exists, leave current dataset.content/dataset.image as-is (maybe they were set locally)
        }

        // Finally, if popup was open or DOM expects images to have handlers, attach behavior to any images we added
        document.querySelectorAll('.main-image').forEach(attachMainImageBehavior);
        document.querySelectorAll('.pop-up-image').forEach(attachPopupImageBehavior);

    } catch (err) {
        console.error("❌ Failed to load document, full error details:", err);
        alert(`Error: ${err.message}`);
        debugger; // Pause script so we can inspect in DevTools
    }

});

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
    organel.addEventListener('click', () => { if (popupname) popupname.textContent = displayName; });
    organel.addEventListener('mouseenter', () => { if (mainorganelname) mainorganelname.textContent = displayName; });
    organel.addEventListener('mouseleave', () => { if (mainorganelname) mainorganelname.textContent = "Célula animal"; });
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

//serviceworker//
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
            registration.unregister();
            console.log("Unregistered service worker:", registration);
        }
    });
}

// ------------------------------
// Switch to Viewer Mode
// ------------------------------
if (switchviewbtn) {
    switchviewbtn.addEventListener("click", () => {
        const docId = new URLSearchParams(window.location.search).get("id");
        if (!docId) {
            alert("No se encontró un ID de documento. Guarda el documento antes de cambiar a modo visor.");
            return;
        }
        const viewerUrl = `https://mentorigroup.com/MentoriCelulaAnimal/Viewer/view.html?id=${docId}`;
        window.open(viewerUrl, "_blank"); // opens in new tab
    });
}
