if (localStorage.getItem('tema') === 'oscuro') document.body.classList.add('dark-theme');
const userId = localStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const currentFullName = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'Usuario';
const headerUsername = document.getElementById('header-username');
if (headerUsername) {
    headerUsername.textContent = 'Hola, ' + currentFullName;
}

const currentRol = localStorage.getItem('userRol');
const btnAdmin = document.getElementById('btn-admin');
if (btnAdmin && currentRol === 'admin') {
    btnAdmin.style.display = 'block';
}

const menuBtn = document.getElementById('user-menu-btn');
const dropdownMenu = document.getElementById('dropdown-menu');

if (menuBtn && dropdownMenu) {
    menuBtn.addEventListener('click', (event) => {
        dropdownMenu.classList.toggle('show');
        event.stopPropagation();
    });

    window.addEventListener('click', (event) => {
        if (!event.target.closest('.user-menu-container')) {
            dropdownMenu.classList.remove('show');
        }
    });
}

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });
}