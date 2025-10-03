// editor.js — fixed, full file with login/logout rendering
// -----------------------------
// Top-level imports (must be at top)
import { supabase } from '/supabase.js';
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
const userDiv = document.getElementById("user"); // <-- for login/logout U
const organelleSections = document.querySelectorAll(".organelos");
// I

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

// -----------------------------
// Get current user (auth helper)
// -----------------------------
async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        console.error("getCurrentUser error:", error);
        return null;
    }
    return data?.user ?? null;
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
function gatherEditorContent() {
    const savedataexport = {
        description: document.getElementById("description")?.value || "",
        mainImages: [...(mainimagesContainer?.querySelectorAll("img") || [])].map(img => img.src),
        organelos: []
    };

    Array.from(organelos).forEach((organelo) => {
        // Use organelo variable consistently
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
            img.src = event.target.result;
            img.classList.add("main-image");
            img.dataset.src = img.src;

            // Attach removal + hover handlers (safe: these handlers check the mode at runtime)
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
// Supabase Online Save & Load (normalized schema)
// -----------------------------
async function createDocumentOnline() {
    const user = await getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    const id = nanoid();
    const now = new Date().toISOString();

    const insertPayload = {
        id,
        title: "Untitled",
        description: "",
        creator: user.email ?? "",   // ✅ email
        owner_id: user.id ?? null,   // ✅ UUID
        created_at: now,
        updated_at: now
    };

    console.log("Insert payload:", insertPayload);

    const { data, error } = await supabase
        .from("documents")
        .insert(insertPayload)
        .select()
        .single();

    if (error) throw error;
    console.log("Inserted doc:", data);

    return data.id;
}

async function updateDocumentOnline(documentId) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    const now = new Date().toISOString();

    const { error } = await supabase
        .from("documents")
        .update({
            updated_at: now,
            creator: user.email ?? "",   // keep consistent
            owner_id: user.id ?? null    // keep consistent
        })
        .eq("id", documentId);

    if (error) throw error;
}




async function saveOrganellesAndImages(documentId) {
    const organelleSections = document.querySelectorAll(".organelos");

    for (let section of organelleSections) {
        const name = section.dataset.organelle || section.id;
        const content = section.dataset.content || "";

        // Upsert organelle
        const { data: organelle, error: orgErr } = await supabase.from("organelles")
            .upsert({
                document_id: documentId,
                name,
                content,
                updated_at: new Date()
            }, { onConflict: "document_id,name" })
            .select()
            .single();

        if (orgErr) {
            console.error("Error saving organelle:", orgErr);
            continue;
        }

        // ✅ Save images
        const imgs = section.querySelectorAll("img");
        for (let img of imgs) {
            let imageUrl = img.src;

            // If it's a base64 Data URL → upload to Supabase Storage
            if (imageUrl.startsWith("data:")) {
                try {
                    const filePath = `${documentId}/${organelle.id}/${Date.now()}.png`;

                    // Convert base64 to Blob
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();

                    const { error: uploadError } = await supabase.storage
                        .from("images") // your storage bucket name
                        .upload(filePath, blob, { upsert: true });

                    if (uploadError) throw uploadError;

                    // Get public URL
                    const { data: publicUrlData } = supabase.storage
                        .from("images")
                        .getPublicUrl(filePath);

                    imageUrl = publicUrlData.publicUrl;
                } catch (e) {
                    console.error("Image upload failed:", e);
                    continue;
                }
            }

            // Save only the URL in DB
            const { error: imgErr } = await supabase.from("images").upsert({
                document_id: documentId,
                organelle_id: organelle.id,
                url: imageUrl
            }, { onConflict: "organelle_id,url" });

            if (imgErr) console.error("Error saving image:", imgErr);
        }
    }

    // ✅ Handle "main images" (outside organelles)
    const mainImgs = [...(mainimagesContainer?.querySelectorAll("img") || [])];
    for (let img of mainImgs) {
        let imageUrl = img.src;

        if (imageUrl.startsWith("data:")) {
            try {
                const filePath = `${documentId}/main/${Date.now()}.png`;

                const response = await fetch(imageUrl);
                const blob = await response.blob();

                const { error: uploadError } = await supabase.storage
                    .from("images")
                    .upload(filePath, blob, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from("images")
                    .getPublicUrl(filePath);

                imageUrl = publicUrlData.publicUrl;
            } catch (e) {
                console.error("Main image upload failed:", e);
                continue;
            }
        }

        await supabase.from("images").upsert({
            document_id: documentId,
            url: imageUrl
        }, { onConflict: "document_id,url" });
    }
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
            // Create new document with same content
            const newId = await createDocument(content);

            // Open new editor window with new document
            window.open(`/MentoriCelulaAnimal/Editor/editor.html?id=${newId}`, '_blank');
        } catch (err) {
            console.error(err);
            alert('Error al copiar el documento: ' + err.message);
        }
    });
}

// -----------------------------
// Save online (create or update)
// -----------------------------
if (saveonlinebutton) {
    saveonlinebutton.addEventListener("click", async () => {
        const docId = new URLSearchParams(window.location.search).get("id");
        try {
            const user = await getCurrentUser();
            if (!user) return alert("Debes haber iniciado sesión.");

            if (docId) {
                await updateDocumentOnline(docId);
                alert("Documento actualizado!");
            } else {
                const newId = await createDocumentOnline();
                await saveOrganellesAndImages(newId);
                alert("Documento guardado en línea!");
                window.location.href = `../Editor/editor.html?id=${newId}`;
            }
        } catch (err) {
            console.error(err);
            alert("Error al guardar en línea: " + err.message);
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
// -----------------------------
async function refreshSignInUI() {
    const user = await getCurrentUser();
    if (signInBtn) {
        signInBtn.style.display = user ? 'none' : 'inline-block';
    }
}

// =======================
// AUTH STATE HANDLING
// =======================
supabase.auth.onAuthStateChange((_event, _session) => {
    refreshSignInUI().catch(err => console.error("refreshSignInUI error", err));
});

// =======================
// DOCUMENT LOADING
// =======================
window.addEventListener("DOMContentLoaded", async () => {
    console.log("🔄 DOM ready, starting document load...");

    try {
        await refreshSignInUI();
    } catch (err) {
        console.error("⚠️ refreshSignInUI error", err);
    }

    const docId = new URLSearchParams(window.location.search).get("id");
    if (!docId) {
        console.warn("⚠️ No docId in URL");
        return;
    }

    let user = null;
    try {
        user = await getCurrentUser();
        console.log("✅ Current user:", user?.email);
    } catch (err) {
        console.warn("⚠️ Failed to get user:", err);
    }

    // ---------- Try normalized schema ----------
    try {
        const { doc, organelles } = await tryLoadNormalizedWithRetry(docId, 6, 400);
        console.log("📄 Normalized document:", doc);

        if (doc) {
            if (!user || user.email !== doc.creator) {
                alert("No puedes editar este documento. Abriendo en modo visor...");
                window.location.href = `../Viewer/view.html?id=${docId}`;
                return;
            }

            // Fill title + description (safe lookup)
            const titleElem = document.getElementById("document-title");
            if (titleElem) {
                titleElem.innerText = doc.title || "Untitled";
            } else {
                console.warn("⚠️ Missing element: #document-title");
            }

            const descElem = document.getElementById("description");
            if (descElem) {
                descElem.value = doc.description || "";
            } else {
                console.warn("⚠️ Missing element: #description");
            }

            // Fill organelles
            (organelles || []).forEach(o => {
                let section = document.querySelector(`[data-organelle="${o.name}"]`);
                if (!section) section = document.getElementById(o.name);

                if (section) {
                    section.dataset.content = o.content || "";
                    section.dataset.image = JSON.stringify((o.images || []).map(i => i.url));
                } else {
                    console.warn(`⚠️ Missing organelle section for: ${o.name}`);
                }
            });

            return; // ✅ Loaded successfully
        }
    } catch (normErr) {
        console.error("❌ Normalized load error", normErr);
        // Don’t redirect yet — try legacy
    }

    // ---------- Fallback: legacy JSON ----------
    try {
        const legacyDoc = await loadDocumentById(docId);
        console.log("📄 Legacy document:", legacyDoc);

        if (!legacyDoc) {
            alert("Documento no encontrado. Si acabas de crearlo, espera y recarga.");
            return;
        }

        if (!user || user.email !== legacyDoc.creator) {
            alert("No puedes editar este documento. Abriendo en modo visor...");
            window.location.href = `../Viewer/view.html?id=${docId}`;
            return;
        }

        if (legacyDoc.content) {
            populateEditorWithContent(legacyDoc.content);
        } else {
            console.warn("⚠️ Legacy doc has no content");
        }
        return;
    } catch (legacyErr) {
        console.error("❌ Legacy load error", legacyErr);
        alert("Error cargando el documento. Abriendo en visor...");
        window.location.href = `../Viewer/view.html?id=${docId}`;
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
        // Or use window.location.href = viewerUrl; if you want to replace instead of opening
    });
}
