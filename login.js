const btnTheme = document.getElementById('theme-toggle');
const body = document.body;

if (localStorage.getItem('tema') === 'oscuro') {
    body.classList.add('dark-theme');
    btnTheme.textContent = 'Modo Claro';
}

btnTheme.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('tema', 'oscuro');
        btnTheme.textContent = 'Modo Claro';
    } else {
        localStorage.setItem('tema', 'claro');
        btnTheme.textContent = 'Modo Oscuro';
    }
});

const form = document.getElementById('loginForm');
const toggleLink = document.getElementById('toggle-form');
const tituloForm = document.getElementById('titulo-form');
const btnSubmit = document.getElementById('btn-submit');
const messageDiv = document.getElementById('message');
const inputNombreCompleto = document.getElementById('nombre_completo');

let modoRegistro = false;

toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    modoRegistro = !modoRegistro;

    if (modoRegistro) {
        tituloForm.textContent = 'Crear Cuenta';
        btnSubmit.textContent = 'Registrarse';
        toggleLink.textContent = '¿Ya tienes cuenta? Inicia sesión';
        inputNombreCompleto.style.display = 'block';
        inputNombreCompleto.required = true;
    } else {
        tituloForm.textContent = 'Iniciar Sesión';
        btnSubmit.textContent = 'Entrar';
        toggleLink.textContent = '¿No tienes cuenta? Regístrate aquí';
        inputNombreCompleto.style.display = 'none';
        inputNombreCompleto.required = false;
        inputNombreCompleto.value = '';
    }
    messageDiv.textContent = '';
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const nombreCompleto = inputNombreCompleto.value;

    let response;
    if (modoRegistro) {
        response = await window.api.registrar(user, nombreCompleto, pass);
    } else {
        response = await window.api.login(user, pass);
    }

    if (response.success) {
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('userName', user);
        if (response.nombreCompleto) {
            localStorage.setItem('userFullName', response.nombreCompleto);
        }
        if (response.rol) {
            localStorage.setItem('userRol', response.rol);
        }

        window.location.href = 'dashboard.html';
    } else {
        messageDiv.textContent = response.message;
    }
});

const inputPassword = document.getElementById('password');
const btnOjito = document.getElementById('btn-ojito');
const iconoOjo = document.getElementById('icono-ojo');

btnOjito.addEventListener('click', () => {
    if (inputPassword.type === 'password') {
        inputPassword.type = 'text';
        iconoOjo.classList.remove('fa-eye');
        iconoOjo.classList.add('fa-eye-slash');
    } else {
        inputPassword.type = 'password';
        iconoOjo.classList.remove('fa-eye-slash');
        iconoOjo.classList.add('fa-eye');
    }
});