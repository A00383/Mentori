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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//main page image//////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const mainimageinput = document.getElementById("main-image-input");
const mainaddBtn = document.getElementById("main-image-add");
const mainremoveBtn = document.getElementById("main-image-remove");
const mainimagesContainer = document.getElementById("main-image-images");

let mainimageremoveMode = false;

// Trigger file input when "Add image" is clicked
mainaddBtn.addEventListener("click", () => {
    mainimageinput.click();
});

// When a file is chosen, add it as an <img>
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

    // reset input so the same file can be uploaded again if needed
    mainimageinput.value = "";
});

// Toggle remove mode
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//pop up image input///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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

