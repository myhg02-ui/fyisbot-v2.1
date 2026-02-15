function goToPanel() {
    const email = document.getElementById('email').value;

    if (!email || !validateEmail(email)) {
        alert('Por favor ingresa un correo válido');
        return;
    }

    sessionStorage.setItem('userEmail', email);
    // Funciona tanto en Vercel (sin .html) como en local (con .html)
    window.location.href = window.location.hostname === 'localhost' ? 'panel.html' : '/panel';
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                goToPanel();
            }
        });
    }
});
