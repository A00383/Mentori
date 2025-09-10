const popup = document.getElementById('pop-up');
const closepopup = document.getElementById('close-pop-up');
const savepopup = document.getElementById('save-pop-up');
const organelos = document.querySelectorAll('.organelos');
const popupmessage = document.getElementById('pop-up-message');

let currentogranel = null;
organelos.forEach(selectedorganel => {
    selectedorganel.addEventListener('click', () => {
        currentogranel = selectedorganel;
        popupmessage.value = selectedorganel.dataset.content;
    })
})

organelos.forEach(organelos => {
    organelos.addEventListener('click', () => {
        popup.classList.add('active');
    })
})

savepopup.addEventListener('click', () => {
    if (currentogranel) {
        currentogranel.dataset.content = popupmessage.value;
        console.log(("Saved to div:", currentogranel, "Content:", popupmessage.value));
    }
})
closepopup.addEventListener("click", () => {
    popup.classList.remove("active");
});

popup.addEventListener('click', (e) => {
    if (e.target === popup) { // only if clicking on overlay, not children
        if (currentogranel) {
            currentogranel.dataset.content = popupmessage.value;
            console.log("Saved to div (on outside click):", currentogranel, "Content:", popupmessage.value);
        }
        popup.classList.remove('active');
    }
});

const input = document.getElementById("main-image-input");
const addBtn = document.getElementById("main-image-add");
const removeBtn = document.getElementById("main-image-remove");
const imagesContainer = document.getElementById("main-image-images");

let removeMode = false;

// Trigger file input when "Add image" is clicked
addBtn.addEventListener("click", () => {
    input.click();
});

// When a file is chosen, add it as an <img>
input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = document.createElement("img");
        const base64 = event.target.result; // text form of image

        img.src = base64;
        img.classList.add("main-image");

        // 🔹 Store the image text inside dataset
        img.dataset.src = base64;

        // Only removable when in remove mode
        img.addEventListener("click", () => {
            if (removeMode) {
                imagesContainer.removeChild(img);
            }
        });

        imagesContainer.appendChild(img);
    };
    reader.readAsDataURL(file);

    // reset input so the same file can be uploaded again if needed
    input.value = "";
});

// Toggle remove mode
removeBtn.addEventListener("click", () => {
    removeMode = !removeMode;
    const imgs = document.querySelectorAll(".main-image");

    imgs.forEach(img => {
        if (removeMode) {
            img.classList.add("removable");
        } else {
            img.classList.remove("removable");
        }
    });

    removeBtn.textContent = removeMode ? "Cancelar quitar" : "Quitar imagen";
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

