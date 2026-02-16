function goToPanel() {
    const email = document.getElementById('email').value.trim();

    if (!email) {
        alert('Ingresa tu correo electrónico');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Ingresa un correo válido');
        return;
    }

    sessionStorage.setItem('userEmail', email);
    window.location.href = window.location.hostname.includes('localhost') ? 'panel.html' : '/panel';
}

const emailInput = document.getElementById('email');
if (emailInput) {
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') goToPanel();
    });
}
