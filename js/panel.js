const API_URL = '/api/check_emails';

// Mostrar email del usuario
const emailDisplay = document.getElementById('emailDisplay');
const userEmail = sessionStorage.getItem('userEmail');
if (emailDisplay && userEmail) emailDisplay.textContent = userEmail;

// Función para volver al inicio
function resetPanel() {
    sessionStorage.removeItem('userEmail');
    window.location.href = window.location.hostname === 'localhost' ? 'index.html' : '/';
}

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
        let html = 
            <div class="code-card-header">
                <h3>+email.subject+</h3>
                <span class="code-time">+email.time+</span>
            </div>
        ;

        if (email.code) {
            html += <div class="code" onclick="copyCode(this)" title="Click para copiar">+email.code+</div>;
        }
        if (email.link) {
            html += <a href="+email.link+" target="_blank" class="code-link">Abrir enlace verificación</a>;
        }

        card.innerHTML = html;
        codesList.appendChild(card);
    });

    document.getElementById('results').style.display = 'block';
}

function copyCode(element) {
    const code = element.textContent;
    navigator.clipboard.writeText(code).then(() => {
        const original = element.textContent;
        element.textContent = ' Copiado';
        element.style.background = 'rgba(46, 125, 50, 0.2)';
        element.style.borderColor = '#2e7d32';
        setTimeout(() => {
            element.textContent = original;
            element.style.background = '';
            element.style.borderColor = '';
        }, 2000);
    });
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

// Modo Guiado - Cerrar tutorial
function closeTutorial() {
    document.getElementById('tutorial-content').style.display = 'none';
    document.querySelector('.device-selection').style.display = 'block';
}

// Modo Guiado - Mostrar tutorial según dispositivo
function showTutorial(device) {
    const content = document.getElementById('tutorial-content');
    const title = document.getElementById('tutorial-title');
    const steps = document.getElementById('tutorial-steps');
    
    document.querySelector('.device-selection').style.display = 'none';

    if (device === 'tv') {
        title.innerHTML = '<span class="tutorial-icon"></span> Tutorial para Smart TV';
        steps.innerHTML = 
            <div class="tutorial-step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h4>Abre Netflix en tu TV</h4>
                    <p>Verás una pantalla similar solicitando verificación de ubicación</p>
                </div>
            </div>
            <div class="tutorial-step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h4>Selecciona una opción</h4>
                    <p>Presiona <strong>"Actualizar hogar"</strong> o <strong>"Estoy de Viaje"</strong> (recomendado)</p>
                </div>
            </div>
            <div class="tutorial-step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h4>Solicita el código</h4>
                    <p>Selecciona <strong>"Enviar email"</strong> para recibir el código de verificación</p>
                </div>
            </div>
            <div class="tutorial-step final">
                <div class="step-number"></div>
                <div class="step-content">
                    <h4>¡Listo para verificar!</h4>
                    <p>Presiona el botón "Listo" cuando lo hayas hecho para ver tu código</p>
                </div>
            </div>
        ;
    } else {
        title.innerHTML = '<span class="tutorial-icon"></span> Tutorial para Móvil/Tablet';
        steps.innerHTML = 
            <div class="tutorial-step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h4>Abre Netflix en tu dispositivo</h4>
                    <p>Verás una pantalla solicitando verificación</p>
                </div>
            </div>
            <div class="tutorial-step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h4>Presiona "Ver Temporalmente"</h4>
                    <p>Esta opción te permitirá solicitar un código por email</p>
                </div>
            </div>
            <div class="tutorial-step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h4>Solicita el código</h4>
                    <p>Selecciona <strong>"Enviar email"</strong> para recibir el código</p>
                </div>
            </div>
            <div class="tutorial-step final">
                <div class="step-number"></div>
                <div class="step-content">
                    <h4>¡Listo para verificar!</h4>
                    <p>Presiona el botón "Listo" cuando lo hayas hecho para ver tu código</p>
                </div>
            </div>
        ;
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
