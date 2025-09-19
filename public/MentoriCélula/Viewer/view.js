const popup = document.getElementById('pop-up');
const closepopup = document.getElementById('close-pop-up');
const organelos = document.querySelectorAll('.organelos');
const popupmessage = document.getElementById('pop-up-message');
const popupimagecontainer = document.getElementById("pop-up-image-section-images");


let currentogranel = null;

popup.addEventListener('click', (e) => {
    if (e.target === popup) { // only if clicking on overlay, not children
        popup.classList.remove('active');
    }
});

// Open popup on organelle click
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
                popupimagecontainer.appendChild(popupimg);
            });
        }

        popup.classList.add('active');
    });
});

closepopup.addEventListener("click", () => {
    popup.classList.remove("active");
});

// ---------- SAVE ----------
const savebtn = document.getElementById("savebtn");
const mainimagesContainer = document.getElementById("main-image-images");

savebtn.addEventListener("click", () => {
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

// ---------- LOAD ----------
const loadInput = document.getElementById("mainload");
const loadBtn = document.getElementById("loadbtn");

loadBtn.addEventListener("click", () => {
    loadInput.click();
});

loadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            document.getElementById("description").value = data.description || "";

            mainimagesContainer.innerHTML = "";
            if (data.mainImages) {
                data.mainImages.forEach(src => {
                    const mainimg = document.createElement("img");
                    mainimg.src = src;
                    mainimg.classList.add("main-image");
                    mainimagesContainer.appendChild(mainimg);
                });
            }

            if (data.organelos) {
                data.organelos.forEach((item, index) => {
                    let target = null;
                    if (item.id) target = document.getElementById(item.id);
                    if (!target && organelos[index]) target = organelos[index];

                    if (target) {
                        target.dataset.content = item.content || "";
                        target.dataset.image = JSON.stringify(item.image || []);
                    }
                });
            }

            alert("Datasets loaded successfully!");
        } catch (err) {
            alert("Error: file is not valid JSON text.");
        }
    };
    reader.readAsText(file);
    loadInput.value = "";
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