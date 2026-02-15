function goToPanel() {
    const email = document.getElementById(''email'').value;
    
    if (!email || !validateEmail(email)) {
        alert(''Por favor ingresa un correo valido'');
        return;
    }
    
    sessionStorage.setItem(''userEmail'', email);
    window.location.href = ''/panel.html'';
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.getElementById(''email'').addEventListener(''keypress'', function(e) {
    if (e.key === ''Enter'') {
        goToPanel();
    }
});