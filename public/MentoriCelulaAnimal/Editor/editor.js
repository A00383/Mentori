// editor.js — rewritten to store description in documents.content, organelle texts in organelles table,
// and upload images to Supabase Storage bucket "CelulaAnimalImgs". Local .txt export still contains Base64
// as before. Original DOM event bindings and function names are preserved.

// -----------------------------
// Top-level imports (must be at top)
// -----------------------------

import { supabase, IMGS_BUCKET } from "../../supabase.js";
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';


async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (err) {
        console.error("getCurrentUser error:", err);
        return null;
    }
}

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
// Document creation & update
// -----------------------------
async function createDocument(editorContent) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Must be logged-in to save document");

    const id = nanoid();
    const now = new Date().toISOString();

    const { error } = await supabase.from("documents").insert({
        id,
        title: "Untitled",
        description: null,
        content: { description: editorContent?.description ?? "" },
        creator: user.email,
        owner_id: user.id, // UUID from auth.users table ✅
        created_at: now,
        updated_at: now,
    });

    if (error) throw error;
    return id;
}


async function updateDocument(id, editorContent) {
    const now = new Date().toISOString();
    const { error } = await supabase
        .from("documents")
        .update({
            content: { description: editorContent?.description ?? "" },
            updated_at: now,
        })
        .eq("id", id);

    if (error) throw error;
    return true;
}

async function loadDocumentById(id) {
    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function clearDocumentImages(documentId) {
    console.log(`🧹 Clearing images for document ${documentId}...`);

    // List everything under this document folder
    const { data: files, error } = await supabase.storage
        .from(IMGS_BUCKET)
        .list(documentId, { limit: 1000 });

    if (error) {
        console.warn("⚠️ Could not list document images:", error.message);
        return;
    }

    if (!files || files.length === 0) return;

    // Collect all file paths (include subfolders)
    const filePaths = [];
    for (const f of files) {
        if (f.name.includes(".")) {
            // file directly under /documentId
            filePaths.push(`${documentId}/${f.name}`);
        } else {
            // it's a folder, recurse
            const { data: subFiles } = await supabase.storage
                .from(IMGS_BUCKET)
                .list(`${documentId}/${f.name}`);
            subFiles?.forEach(sf =>
                filePaths.push(`${documentId}/${f.name}/${sf.name}`)
            );
        }
    }

    if (filePaths.length > 0) {
        const { error: delError } = await supabase.storage
            .from(IMGS_BUCKET)
            .remove(filePaths);
        if (delError)
            console.warn("⚠️ Failed to delete old document images:", delError.message);
        else
            console.log(`🧹 Deleted ${filePaths.length} old images.`);
    }
}


// -----------------------------
// Storage Helpers
// -----------------------------
async function uploadBlobToBucket(bucketName, path, blob) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not logged in");

    console.log(`🪣 Uploading ${bucketName}/${path} for user ${user.id}`);

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, blob, {
            upsert: true,
            metadata: {
                uploaded_by: user.email, // ✅ safe field
                document_ref: path.split("/")[0], // store document ID just as a string
            },
        });

    if (error) throw error;

    // ✅ Public URL
    const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);

    console.log("✅ Uploaded URL:", publicData.publicUrl);
    return publicData.publicUrl;
}

// List files from folder
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

export function getPublicUrlForPath(path) {
    const { data } = supabase.storage.from(IMGS_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
}

// Convert dataURL → Blob
function dataURLToBlob(dataURL) {
    const [header, base64] = dataURL.split(",");
    const mime = header.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
    const bytes = atob(base64);
    const arrayBuffer = new ArrayBuffer(bytes.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < bytes.length; i++) view[i] = bytes.charCodeAt(i);
    return new Blob([view], { type: mime });
}

async function getBlobFromSrc(src) {
    if (!src) throw new Error("No src provided to getBlobFromSrc");
    if (src.startsWith("data:")) return dataURLToBlob(src);
    const resp = await fetch(src);
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
    return await resp.blob();
}

function extensionFromMime(mime) {
    if (!mime) return "png";
    const ext = mime.split("/")[1]?.split("+")[0];
    return ext === "jpeg" ? "jpg" : ext || "png";
}

//----------------------
//Copy Document Helper
//----------------------

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
// Copy Button
// -----------------------------
if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
        const content = gatherEditorContent();
        const user = await getCurrentUser();

        if (!user) {
            alert("Debes haber iniciado sesión para copiar un documento");
            return;
        }

        const oldId = new URLSearchParams(window.location.search).get("id");

        try {
            // 1️⃣ Fetch the original document to read its copy_counter
            const { data: originalDoc, error: loadErr } = await supabase
                .from("documents")
                .select("id, copy_counter")
                .eq("id", oldId)
                .maybeSingle();

            if (loadErr) throw loadErr;
            if (!originalDoc) throw new Error("Documento original no encontrado");

            // 2️⃣ Increment the counter for the *new copy*
            const newCounter = (originalDoc.copy_counter || 0) + 1;

            // 3️⃣ Create the new document (and include counter + owner info)
            const { data: newDoc, error: insertErr } = await supabase
                .from("documents")
                .insert([{
                    id: nanoid(),
                    creator: user.email,
                    owner_id: user.id,
                    content,
                    copy_counter: newCounter, // ✅ Incremented value
                }])
                .select()
                .maybeSingle();

            if (insertErr) throw insertErr;
            const newId = newDoc.id;

            // 5️⃣ Copy all images
            await copyDocumentImages(oldId, newId);

            // 6️⃣ Copy organelle text and metadata
            await upsertOrganellesText(newId, content);

            // 7️⃣ Open the new document in a new tab
            window.open(`/MentoriCelulaAnimal/Editor/editor.html?id=${newId}`, "_blank");

        } catch (err) {
            console.error("❌ Copy failed:", err);
            alert("Error al copiar el documento: " + err.message);
        }
    });
}

// -----------------------------
// Helper: Wait until organelles are rendered
// -----------------------------
async function waitForOrganeles(timeout = 4000) {
    const start = performance.now();
    while (document.querySelectorAll(".organelo").length === 0) {
        if (performance.now() - start > timeout) {
            console.warn("⚠️ waitForOrganeles timeout reached, continuing anyway");
            break;
        }
        await new Promise(r => setTimeout(r, 100));
    }
    console.log("✅ Organeles ready:", document.querySelectorAll(".organelos").length);
}


// -----------------------------
// Save Online Button (fully fixed)
// -----------------------------
if (saveonlinebutton) {
    saveonlinebutton.addEventListener("click", async () => {
        const content = gatherEditorContent();
        const currentDocId = new URLSearchParams(window.location.search).get("id");

        try {
            const user = await getCurrentUser();
            if (!user) {
                alert("Debes iniciar sesión para guardar en línea.");
                return;
            }

            // Make sure the organelles are rendered before saving
            await waitForOrganeles();

            // --- EXISTING DOCUMENT ---
            if (currentDocId) {
                console.log("💾 Updating existing document:", currentDocId);

                const doc = await loadDocumentById(currentDocId);
                if (!doc) {
                    alert("No se encontró el documento.");
                    return;
                }

                if (doc.creator !== user.email) {
                    alert("Tú no eres el creador de este documento.");
                    return;
                }

                // 1️⃣ Update document text content
                await updateDocument(currentDocId, content);

                // 2️⃣ Upload all images (main + organelles)
                await uploadAllImagesForDocument(currentDocId, content);

                // 3️⃣ Upsert organelles (text + image metadata)
                await upsertOrganellesText(currentDocId, content);

                console.log("✅ Documento actualizado correctamente");
                alert("Documento guardado exitosamente!");
            }

            // --- NEW DOCUMENT ---
            else {
                console.log("🆕 Creating new document...");

                // 1️⃣ Create document first to get its ID
                const newId = await createDocument(content);

                // 2️⃣ Upload all images after the folder exists
                await uploadAllImagesForDocument(newId, content);

                // 3️⃣ Upsert organelles (text + images)
                await upsertOrganellesText(newId, content);

                console.log("✅ Nuevo documento creado correctamente");
                alert("Documento guardado exitosamente!");
                window.location.href = `../Editor/editor.html?id=${newId}`;
            }

        } catch (err) {
            console.error("❌ Error al guardar el documento:", err);
            alert("Error al guardar el documento: " + err.message);
        }
    });
}


// -----------------------------
// UNIFIED SMART IMAGE UPLOADER (FIXED)
// -----------------------------
async function uploadAllImagesForDocument(documentId, editorContent) {
    if (!documentId) throw new Error("uploadAllImagesForDocument requires a documentId");

    console.log("🖼️ Starting upload for document:", documentId);

    // We'll track relative storage paths so cleanup doesn't remove newly uploaded files
    const uploadedPaths = new Set();

    // Helper: slugify folder names (membrana celular -> membrana_celular)
    const slugify = (s) => (s || "unknown")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^\w_-]/g, "");

    // --- MAIN IMAGES ---
    // Defensive: prefer the known container variable if available, else fallback to selector
    const mainContainer = (typeof mainimagesContainer !== "undefined" && mainimagesContainer)
        ? mainimagesContainer
        : document.getElementById("main-image-images") || document.querySelector("#mainimages");

    const mainImgs = mainContainer ? [...mainContainer.querySelectorAll("img")] : [];
    console.log(`📦 Found ${mainImgs.length} main images.`);

    for (let i = 0; i < mainImgs.length; i++) {
        const img = mainImgs[i];
        const src = img.src;
        if (!src) continue;

        try {
            // If already stored in the bucket, just keep its relative path so cleanup knows to keep it
            if (src.includes(`/storage/v1/object/public/${IMGS_BUCKET}/`)) {
                const rel = src.split(`/storage/v1/object/public/${IMGS_BUCKET}/`)[1];
                if (rel) uploadedPaths.add(rel);
                continue;
            }

            // Otherwise fetch/upload (works for data: URIs and remote URLs)
            const blob = await getBlobFromSrc(src);
            const ext = extensionFromMime(blob.type || "image/png");
            const filename = `main_imgs/img_${i}_${crypto.randomUUID()}.${ext}`;
            const path = `${documentId}/${filename}`;

            const publicUrl = await uploadBlobToBucket(IMGS_BUCKET, path, blob);

            // update DOM to point to the uploaded resource
            img.src = publicUrl;
            img.dataset.src = publicUrl;

            uploadedPaths.add(`${documentId}/${filename}`);
            console.log("✅ Uploaded main image:", publicUrl);

            // small delay to avoid throttling
            await new Promise(r => setTimeout(r, 120));
        } catch (err) {
            console.warn("⚠️ Failed to upload main image:", err);
        }
    }

    // --- ORGANELE IMAGES ---
    // Accept either .organelos (container) or .organelo (item) classes — be defensive
    const organelleNodeList = document.querySelectorAll(".organelo, .organelos .organelo, .organelos");
    // Normalize: create array of actual organelle elements (elements that represent a single organelle)
    const organelles = [];
    organelleNodeList.forEach(n => {
        // If the node is a container that contains multiple organelle children, pick children with class organelo
        if (n.classList.contains("organelos")) {
            n.querySelectorAll(".organelo").forEach(child => organelles.push(child));
            // If it has no .organelo children but itself has id and data-image, treat it as one
            if (n.id && !n.querySelector(".organelo")) organelles.push(n);
        } else {
            organelles.push(n);
        }
    });

    // Fallback: if still empty, try the legacy selector
    if (organelles.length === 0) {
        document.querySelectorAll(".organelos").forEach(n => {
            organelles.push(n);
        });
    }

    console.log(`🧬 Found ${organelles.length} organelles to process.`);

    for (const organel of organelles) {
        // Determine folder name from element id or dataset.organelId
        const rawName = organel.id || organel.dataset?.organelId || organel.dataset?.name || "unknown";
        const folderName = slugify(rawName);

        // Collect images for this organelle: prefer dataset.image JSON, else <img> children
        let imgs = [];
        try {
            imgs = JSON.parse(organel.dataset.image || "[]");
            if (!Array.isArray(imgs)) imgs = [];
        } catch {
            imgs = [];
        }

        if (imgs.length === 0) {
            imgs = [...organel.querySelectorAll("img")].map(i => i.src).filter(Boolean);
        }

        const newUrls = [];

        for (let i = 0; i < imgs.length; i++) {
            const src = imgs[i];
            if (!src) continue;

            try {
                // If already in storage, keep it and register the relative path
                if (src.includes(`/storage/v1/object/public/${IMGS_BUCKET}/`)) {
                    const rel = src.split(`/storage/v1/object/public/${IMGS_BUCKET}/`)[1];
                    if (rel) uploadedPaths.add(rel);
                    newUrls.push(src);
                    continue;
                }

                // Upload (supports data: plus remote URLs)
                const blob = await getBlobFromSrc(src);
                const ext = extensionFromMime(blob.type || "image/png");
                const filename = `${folderName}/img_${i}_${crypto.randomUUID()}.${ext}`;
                const path = `${documentId}/${filename}`;

                const publicUrl = await uploadBlobToBucket(IMGS_BUCKET, path, blob);

                // push resulting public URL
                newUrls.push(publicUrl);
                uploadedPaths.add(path);

                console.log(`✅ Uploaded organelle image (${folderName}):`, publicUrl);
                await new Promise(r => setTimeout(r, 120));
            } catch (err) {
                console.warn(`⚠️ Failed to upload organelle image for ${folderName}:`, err);
                // preserve original src if upload failed
                if (src) newUrls.push(src);
            }
        }

        // Persist URLs back to the DOM for later DB upsert
        organel.dataset.image = JSON.stringify(newUrls);
    }

    // --- CLEANUP (remove files under documentId not referenced in uploadedPaths) ---
    try {
        // get listing of top-level entries under documentId
        const { data: list, error: listErr } = await supabase.storage
            .from(IMGS_BUCKET)
            .list(documentId, { limit: 1000 });

        if (listErr) {
            console.warn("⚠️ Could not list files for cleanup:", listErr.message);
        } else {
            // For each file or folder under documentId, check whether any file path is in keep set
            for (const entry of list || []) {
                if (entry.name.includes(".")) {
                    // direct file under documentId (unlikely if you put everything in folders, but handle it)
                    const path = `${documentId}/${entry.name}`;
                    if (!uploadedPaths.has(path)) {
                        console.log("🧹 Removing unused file:", path);
                        await supabase.storage.from(IMGS_BUCKET).remove([path]);
                    }
                } else {
                    // it's a folder: list its contents
                    const { data: subFiles, error: subErr } = await supabase.storage
                        .from(IMGS_BUCKET)
                        .list(`${documentId}/${entry.name}`, { limit: 1000 });

                    if (subErr) {
                        console.warn("⚠️ Could not list subfolder for cleanup:", entry.name, subErr.message);
                        continue;
                    }

                    for (const sf of subFiles || []) {
                        const path = `${documentId}/${entry.name}/${sf.name}`;
                        if (!uploadedPaths.has(path)) {
                            console.log("🧹 Removing unused subfile:", path);
                            await supabase.storage.from(IMGS_BUCKET).remove([path]);
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.warn("⚠️ Cleanup failed:", err);
    }

    console.log("✅ All images (main + organelles) synced successfully.");
    return true;
}


// -----------------------------
// ORGANELES TABLE UPSERT (does text + uses dataset.image produced above)
// -----------------------------
async function upsertOrganellesText(documentId, editorContent) {
    console.log("🧬 Starting organelle save for:", documentId);

    const user = await getCurrentUser();
    if (!user) throw new Error("Must be logged-in to save organelles");

    const payload = {
        id: `${documentId}-organelles`,
        document_id: documentId,
        creator: user.email,
    };

    for (const domId in ORGANELLE_COLUMN_MAP) {
        const colName = ORGANELLE_COLUMN_MAP[domId];
        const el = document.getElementById(domId);
        if (!el) {
            payload[colName] = "";
            continue;
        }

        // text
        payload[colName] = el.dataset?.content ?? "";

        // images: store array of public urls (if any) as JSON string or leave empty array
        try {
            const imgs = JSON.parse(el.dataset.image || "[]");
            // If you want to store the array in a separate column, add payload[`${colName}_images`] = imgs
            // For now we won't create new DB columns; keep image info on dataset if needed
            payload[`${colName}_image_urls`] = JSON.stringify(imgs || []);
        } catch {
            payload[`${colName}_image_urls`] = JSON.stringify([]);
        }
    }

    // upsert into organelles table using document_id as unique constraint
    const { error } = await supabase
        .from("organelles")
        .upsert(payload, { onConflict: "document_id" });

    if (error) {
        console.error("❌ upsertOrganellesText failed:", error);
        throw error;
    }

    console.log("✅ Organelles saved successfully to table.");
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
// Sign-in UI handling
// -----------------------------
async function refreshSignInUI() {
    const user = await getCurrentUser();
    if (signInBtn) {
        signInBtn.style.display = user ? "none" : "inline-block";
    }
}

supabase.auth.onAuthStateChange(() => {
    refreshSignInUI().catch(err => console.error("refreshSignInUI error", err));
});

// -----------------------------
// Load document on startup
// -----------------------------
window.addEventListener("DOMContentLoaded", async () => {
    await refreshSignInUI();

    const docId = new URLSearchParams(window.location.search).get("id");
    if (!docId) return;

    try {
        const doc = await loadDocumentById(docId);
        if (!doc) {
            alert("Documento no encontrado.");
            window.location.href = "../Viewer/view.html";
            return;
        }

        const user = await getCurrentUser();
        if (!user || user.id !== doc.owner_id) {
            alert("No tienes autorización para editar este documento. Redirigiendo a vista...");
            window.location.href = `../Viewer/view.html?id=${docId}`;
            return;
        }

        // Populate text description
        if (doc.content?.description) {
            const descElem = document.getElementById("description");
            if (descElem) descElem.value = doc.content.description;
        }

        // Load main images
        const mainFolder = `${docId}/main_imgs`;
        const mainFiles = await listBucketFiles(mainFolder);
        if (mainimagesContainer) {
            mainimagesContainer.innerHTML = "";
            for (const file of mainFiles) {
                const filePath = `${mainFolder}/${file.name}`;
                const publicUrl = getPublicUrlForPath(filePath);
                if (!publicUrl) continue;
                const img = document.createElement("img");
                img.src = publicUrl;
                img.classList.add("main-image");
                img.dataset.src = publicUrl;
                attachMainImageBehavior(img);
                mainimagesContainer.appendChild(img);
            }
        }

        // Load organelles
        const { data: orgRow } = await supabase
            .from("organelles")
            .select("*")
            .eq("document_id", docId)
            .maybeSingle();

        if (orgRow) {
            for (const domId in ORGANELLE_COLUMN_MAP) {
                const colName = ORGANELLE_COLUMN_MAP[domId];
                const el = document.getElementById(domId);
                if (el) el.dataset.content = orgRow[colName] ?? "";
            }

            for (const domId in ORGANELLE_COLUMN_MAP) {
                const el = document.getElementById(domId);
                if (!el) continue;
                const folderName = organelleFolderName(domId);
                const folderPath = `${docId}/${folderName}`;
                const files = await listBucketFiles(folderPath);
                const urls = files.map(f => getPublicUrlForPath(`${folderPath}/${f.name}`)).filter(Boolean);
                el.dataset.image = JSON.stringify(urls);
            }
        }

        document.querySelectorAll(".main-image").forEach(attachMainImageBehavior);
        document.querySelectorAll(".pop-up-image").forEach(attachPopupImageBehavior);

    } catch (err) {
        console.error("❌ Failed to load document:", err);
        alert(`Error: ${err.message}`);
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

        if (popupimageremoveMode || mainimageremoveMode) {
            img.remove();
            popupimageremoveMode = false;
            mainimageremoveMode = false;
            return;
        }

        if (!popupimageremoveMode && !mainimageremoveMode) {
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
