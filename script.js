const popup = document.getElementById('pop-up');
const closepopup = document.getElementById('close-popup');

document.querySelectorAll('.organelos').forEach(organelos => {
    organelos.addEventListener('click', () => {

        popup.classList.add('active');
    })
})
