const popup = document.getElementById('pop-up');
const closepopup = document.getElementById('close-pop-up');
const savepopup = document.getElementById('save-pop-up');
const organelos = document.querySelectorAll('.organelos');
const popupmessage = document.getElementById('pop-up-message');
const popupimageinput = document.getElementById("pop-up-image-file");
const popupimageadd = document.getElementById("pop-up-image-add");
const popupimageremove = document.getElementById("pop-up-image-remove");
const popupimagecontainer = document.getElementById("pop-up-image-section-images");

let currentogranel = null;
let popupimageremovemode= false


organelos.forEach(selectedorganel => {
    selectedorganel.addEventListener('click', () => {
        currentogranel = selectedorganel;
        popupmessage.value = selectedorganel.dataset.content;
        popupimagecontainer.innerHTML = ""; // clear previous
        if (selectedorganel.dataset.image) {
            const imgs = JSON.parse(selectedorganel.dataset.image); // array of base64 strings
            imgs.forEach(src => {
                const popupimg = document.createElement("img");
                popupimg.src = src;
                popupimg.classList.add("pop-up-image");

                popupimg.addEventListener("click", () => {
                    if (popupimageremovemode) {
                        popupimagecontainer.removeChild(popupimg);
                    }
                });
                popupimagecontainer.appendChild(popupimg);
            });
        }
    });
});

organelos.forEach(organelos => {
    organelos.addEventListener('click', () => {
        popup.classList.add('active');
    })
})

popupimageadd.addEventListener("click", () => {
    popupimageinput.click();
});

popupimageinput.addEventListener("change", (e) => {
    const popupfile = e.target.files[0];
    if (!popupfile) return;

    const popupreader = new FileReader();
    popupreader.onload = function(event) {
        const popupimg = document.createElement("img");
        const base64 = event.target.result;

        popupimg.src = base64;
        popupimg.classList.add("pop-up-image");

        popupimg.dataset.image = popupimg.src;

        popupimg.addEventListener("click", () => {
            if (popupimageremovemode) {
                popupimagecontainer.removeChild(popupimg);
            }
        });
        popupimagecontainer.appendChild(popupimg);
    }
    popupreader.readAsDataURL(popupfile);

    popupimageinput.value = "";
});
popupimageremove.addEventListener("click", () => {
    popupimageremovemode = !popupimageremovemode;
    const popupimgs  = document.querySelectorAll(".pop-up-image");

    popupimgs.forEach(img => {
        if (mainimageremoveMode) {
            img.classList.add("removable");
        } else {
            img.classList.remove("removable");
        }
    });

    popupimageremove.textContent = popupimageremovemode ? "Cancelar quitar" : "Quitar imagen";
});

savepopup.addEventListener('click', () => {
    if (currentogranel) {
        currentogranel.dataset.content = popupmessage.value;
        console.log(("Saved to div:", currentogranel, "Content:", popupmessage.value));
        const imgs = [...popupimagecontainer.querySelectorAll("img")].map(img => img.src);
        currentogranel.dataset.image = JSON.stringify(imgs);

        console.log("Saved:", currentogranel, {
            content: currentogranel.dataset.content,
            images: currentogranel.dataset.image
        });
    }
});

closepopup.addEventListener("click", () => {
    popup.classList.remove("active");
});

popup.addEventListener('click', (e) => {
    if (e.target === popup) { // only if clicking on overlay, not children
        if (currentogranel) {
            // Save text
            currentogranel.dataset.content = popupmessage.value;

            // Save images (array or single)
            const imgs = [...popupimagecontainer.querySelectorAll("img")].map(img => img.src);
            currentogranel.dataset.image = JSON.stringify(imgs);

            console.log("Saved to div (on outside click):", currentogranel, {
                content: currentogranel.dataset.content,
                images: currentogranel.dataset.image
            });
        }

        // Close popup
        popup.classList.remove('active');
    }
});

const mainimageinput = document.getElementById("main-image-input");
const mainaddBtn = document.getElementById("main-image-add");
const mainremoveBtn = document.getElementById("main-image-remove");
const mainimagesContainer = document.getElementById("main-image-images");

let mainimageremoveMode = false;

// Trigger file input when "Add image" is clicked
mainaddBtn.addEventListener("click", () => {
    mainimageinput.click();
});

mainimageinput.addEventListener("change", (e) => {
    const mainimagefile = e.target.files[0];
    if (!mainimagefile) return;

    const mainimagereader = new FileReader();
    mainimagereader.onload = function(event) {
        const mainimg = document.createElement("img");
        const base64 = event.target.result; // text form of image

        mainimg.src = base64;
        mainimg.classList.add("main-image");

        // 🔹 Store the image text inside dataset
        mainimg.dataset.src = base64;

        // Only removable when in remove mode
        mainimg.addEventListener("click", () => {
            if (mainimageremoveMode) {
                mainimagesContainer.removeChild(mainimg);
            }
        });

        mainimagesContainer.appendChild(mainimg);
    };
    mainimagereader.readAsDataURL(mainimagefile);

    mainimageinput.value = "";
});

mainremoveBtn.addEventListener("click", () => {
    mainimageremoveMode = !mainimageremoveMode;
    const imgs = document.querySelectorAll(".main-image");

    imgs.forEach(img => {
        if (mainimageremoveMode) {
            img.classList.add("removable");
        } else {
            img.classList.remove("removable");
        }
    });

    mainremoveBtn.textContent = mainimageremoveMode ? "Cancelar quitar" : "Quitar imagen";
});

const downloadbtn = document.getElementById("downloadbtn");

downloadbtn.addEventListener("click", () => {
    const savedataexport = {
        description: document.getElementById("description").value || "",
        mainImages: [...mainimagesContainer.querySelectorAll("img")].map(img => img.src),
        organelos: []
    };

    organelos.forEach((organelo) => {
        savedataexport.organelos.push({
            id: organelo.id || null,
            content: organelo.dataset.content || "",
            image: organelo.dataset.image ? JSON.parse(organelo.dataset.image) : [],
        });
    });

    // Convert to JSON text
    const blob = new Blob([JSON.stringify(savedataexport, null, 2)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "datasets.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

const loadInput = document.getElementById("mainload");
const loadBtn = document.getElementById("loadbtn");

loadBtn.addEventListener("click", () => {
    loadInput.click(); // trigger file selector
});

loadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            // 🔹 Restore description
            document.getElementById("description").value = data.description || "";

            // 🔹 Restore main images
            mainimagesContainer.innerHTML = "";
            if (data.mainImages) {
                data.mainImages.forEach(src => {
                    const mainimg = document.createElement("img");
                    mainimg.src = src;
                    mainimg.classList.add("main-image");

                    mainimg.dataset.src = src;

                    mainimg.addEventListener("click", () => {
                        if (mainimageremoveMode) {
                            mainimagesContainer.removeChild(mainimg);
                        }
                    });

                    mainimagesContainer.appendChild(mainimg);
                });
            }

            // 🔹 Restore organelos
            if (data.organelos) {
                data.organelos.forEach((item, index) => {
                    let target = null;
                    if (item.id) {
                        target = document.getElementById(item.id);
                    }
                    if (!target && organelos[index]) {
                        target = organelos[index];
                    }

                    if (target) {
                        target.dataset.content = item.content || "";
                        target.dataset.image = JSON.stringify(item.image || []);
                    }
                });
            }

            alert("Datasets loaded successfully!");
        } catch (err) {
            console.error("Invalid file format", err);
            alert("Error: file is not valid JSON text.");
        }
    };
    reader.readAsText(file);

    loadInput.value = ""; // reset input
});

const popupname = document.getElementById('pop-up-name');
const mainorganelname = document.getElementById('organelo');

const membranacelular = document.getElementById ('membrana celular');
const citoplasma = document.getElementById ('citoplasma');
const nucleolo = document.getElementById ('nucleolo');
const nucleo = document.getElementById ('nucleo');
const reticuloendoplasmatico = document.getElementById ('reticulo endoplasmatico');
const centriolos = document.getElementById ('centriolos');
const microtubulos = document.getElementById ('microtubulos');
const mitocondrias = document.getElementById ('mitocondrias');
const lisosomas = document.getElementById ('lisosomas');
const aparatodegolgi = document.getElementById ('aparato de golgi');

//membrana celular
membranacelular.addEventListener('click', () => {
    popupname.textContent = "Membrana celular";
})

membranacelular.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Membrana celular";
})
membranacelular.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
});

//citoplasma
citoplasma.addEventListener('click', () => {
    popupname.textContent = "Citoplasma";
})
citoplasma.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Citoplasma";
})
citoplasma.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
});

//nucleolo
nucleolo.addEventListener('click', () => {
    popupname.textContent = "Nucléolo";
})
nucleolo.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Nucléolo";
})
nucleolo.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
});

//nucleo
nucleo.addEventListener('click', () => {
    popupname.textContent = "Núcleo";
})
nucleo.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Núcleo";
})
nucleo.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
});

//retículo endoplasmático
reticuloendoplasmatico.addEventListener('click', () => {
    popupname.textContent = "Retículo endplasmático";
})
reticuloendoplasmatico.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Retículo endoplasmático";
})
reticuloendoplasmatico.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
});

//centriolos
centriolos.addEventListener('click', () => {
    popupname.textContent = "Centriolos";
})
centriolos.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Centriolos";
})
centriolos.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
});

//microtubulos
microtubulos.addEventListener('click', () => {
    popupname.textContent = "Microtúbulos";
})
microtubulos.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Microtúbulos";
})
microtubulos.addEventListener('mouseleave', () => {
        mainorganelname.textContent = "Célula animal";
});

//mitocondrias
mitocondrias.addEventListener('click', () => {
    popupname.textContent = "Mitocondrias";
})
mitocondrias.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Mitocondrias";
})
mitocondrias.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
    });

//lisosomas
lisosomas.addEventListener('click', () => {
    popupname.textContent = "Lisosomas";
})
lisosomas.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Lisosomas";
})
lisosomas.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
    });

//aparato de golgi
aparatodegolgi.addEventListener('click', () => {
    popupname.textContent = "Aparato de Golgi";
})
aparatodegolgi.addEventListener('mouseenter', () => {
    mainorganelname.textContent = "Aparato de Golgi";
})
aparatodegolgi.addEventListener('mouseleave', () => {
    mainorganelname.textContent = "Célula animal";
});

import { supabase } from '/supabase.js';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

async function getCurrentUser() {
    // getSession/getUser API
    const { data } = await supabase.auth.getSession(); // returns data.session
    // data.session?.user contains user info; cross-check docs for exact shape
    return data?.session?.user ?? null;
}

// create a new document and return its id
async function createDocument(editorContent) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged-in to save document');

    const id = nanoid();
    const now = new Date().toISOString();
    const row = {
        id,
        creator: user.email,          // store email; or use user.id (auth.sub) if you prefer
        created_at: now,
        updated_at: now,
        content: editorContent
    };

    const { data, error } = await supabase
        .from('documents')
        .insert(row)
        .select()
        .single();

    if (error) throw error;
    return id;
}

// update an existing doc by id
async function updateDocument(id, editorContent) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('documents')
        .update({ content: editorContent, updated_at: now })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// load a document by id
async function loadDocumentById(id) {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data; // may be null if not found
}

// Example wiring on editor load:
(async function initEditor() {
    const urlParams = new URLSearchParams(location.search);
    const docId = urlParams.get('id'); // null if not present

    const user = await getCurrentUser(); // null if anonymous
    if (docId) {
        const doc = await loadDocumentById(docId);
        if (!doc) {
            // doc not found — treat as blank or show 404
            console.warn('Document not found');
            return;
        }

        // owner? if not owner -> view-only mode
        const isOwner = user && (user.email === doc.creator);
        if (!isOwner) {
            setEditorReadOnly(true);     // implement this to disable edits in your editor
            populateEditorWithContent(doc.content);
        } else {
            setEditorReadOnly(false);
            populateEditorWithContent(doc.content);
        }
    } else {
        // no doc id in URL
        // if user is logged, you may offer "Create new (save)" which will call createDocument(...)
        // if not logged, the editor should behave as anonymous (no id / save disabled)
        if (!user) {
            setEditorAnonymousMode(); // implement to reflect UI differences
        } else {
            // logged-in + no id — a possible route is to auto-create on first save
        }
    }
})();

// Hook up your Save button:
document.getElementById('save-btn')?.addEventListener('click', async () => {
    const urlParams = new URLSearchParams(location.search);
    const docId = urlParams.get('id');
    const content = gatherEditorContent(); // implement to read editor state (should be a JSON-able object)

    try {
        if (docId) {
            await updateDocument(docId, content);
            // update UI, toast, etc.
        } else {
            // no id -> only create if logged in
            const user = await getCurrentUser();
            if (!user) {
                alert('You must be signed in to save.');
                return;
            }
            const id = await createDocument(content);
            // redirect to editor with id appended
            location.href = `${location.origin}/editor.html?id=${id}`;
        }
    } catch (err) {
        console.error(err);
        alert('Save failed: ' + err.message);
    }
});

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const isGuest = params.get("guest") === "true";

if (isGuest) {
    // Don’t load/save from Supabase
    console.log("Guest mode, local-only document:", id);
} else {
    // Fetch document from Supabase by id
    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error loading document:", error);
    } else {
        console.log("Loaded doc:", data);
        // TODO: populate your editor UI with data.content here
    }
}