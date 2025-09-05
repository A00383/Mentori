const popup = document.getElementById('pop-up');
const closepopup = document.getElementById('close-pop-up');

document.querySelectorAll('.organelos').forEach(organelos => {
    organelos.addEventListener('click', () => {

        popup.classList.add('active');
    })
})

closepopup.addEventListener("click", () => {
    popup.classList.remove("active");
});