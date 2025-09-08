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
        popup.classList.remove('active');
    }
    if (currentogranel) {
        currentogranel.dataset.content = popupmessage.value;
        console.log(("Saved to div:", currentogranel, "Content:", popupmessage.value));
    }
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

