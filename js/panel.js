const API_URL = '/api/check_emails';

// Mostrar email del usuario
const emailDisplay = document.getElementById('emailDisplay');
const userEmail = sessionStorage.getItem('userEmail');
if (emailDisplay && userEmail) emailDisplay.textContent = userEmail;

// Switch entre tabs
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'rapido') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('modo-rapido').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('modo-guiado').classList.add('active');
    }
}

// Buscar códigos
async function checkEmails() {
    showLoading();
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        updateLastCheck();
        
        if (data.error) {
            showError(data.error);
            return;
        }
        
        if (data.count === 0) {
            showNoResults();
            return;
        }
        
        showResults(data.emails, data.count);
    } catch (error) {
        showError('No se pudo conectar al servidor');
    }
}

function showLoading() {
    hideAll();
    document.getElementById('loading').style.display = 'block';
}

function showResults(emails, count) {
    hideAll();
    document.getElementById('count').textContent = count;
    const codesList = document.getElementById('codesList');
    codesList.innerHTML = '';
    
    emails.forEach(email => {
        const card = document.createElement('div');
        card.className = 'code-card';
        let html = `<h3>${email.subject}</h3><p>${email.time}</p>`;
        
        if (email.code) {
            html += `<div class="code">${email.code}</div>`;
        }
        if (email.link) {
            html += `<a href="${email.link}" target="_blank" class="link">Abrir Link</a>`;
        }
        
        card.innerHTML = html;
        codesList.appendChild(card);
    });
    
    document.getElementById('results').style.display = 'block';
}

function showNoResults() {
    hideAll();
    document.getElementById('noResults').style.display = 'block';
}

function showError(msg) {
    hideAll();
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('error').style.display = 'block';
}

function hideAll() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

function updateLastCheck() {
    const now = new Date();
    const time = now.toLocaleTimeString('es-PE', {hour: '2-digit', minute: '2-digit'});
    document.getElementById('lastCheck').textContent = time;
}

function cancelSearch() {
    hideAll();
}

function showTutorial(device) {
    const content = document.getElementById('tutorial-content');
    const title = document.getElementById('tutorial-title');
    const steps = document.getElementById('tutorial-steps');
    
    if (device === 'tv') {
        title.textContent = ' Tutorial para TV';
        steps.innerHTML = '<ol><li>En tu TV, abre Netflix</li><li>Selecciona "Estoy de Viaje"</li><li>Elige "Enviar email"</li><li>Luego verifica aquí</li></ol>';
    } else {
        title.textContent = ' Tutorial para Móvil';
        steps.innerHTML = '<ol><li>Abre Netflix en tu celular</li><li>Si pide verificación, elige email</li><li>Luego verifica aquí</li></ol>';
    }
    
    content.style.display = 'block';
}

// Event listeners
document.getElementById('checkBtn').addEventListener('click', checkEmails);
document.getElementById('retryBtn').addEventListener('click', checkEmails);
document.getElementById('retryBtn2').addEventListener('click', checkEmails);

// Auto-inicio
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => checkEmails(), 300);
});