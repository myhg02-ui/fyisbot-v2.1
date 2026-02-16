const API_URL = '/api/check_emails';

const emailDisplay = document.getElementById('emailDisplay');
const userEmail = sessionStorage.getItem('userEmail');
if (emailDisplay && userEmail) emailDisplay.textContent = userEmail;

function resetPanel() {
    sessionStorage.removeItem('userEmail');
    window.location.href = window.location.hostname === 'localhost' ? 'index.html' : '/';
}

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

async function checkEmails() {
    showLoading();
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        updateLastCheck();
        if (data.error) { showError(data.error); return; }
        if (data.count === 0) { showNoResults(); return; }
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
        let html = `<div class="code-card-header"><h3>${email.subject}</h3><span class="code-time">${email.time}</span></div>`;
        if (email.code) html += `<div class="code" onclick="copyCode(this)" title="Click para copiar">${email.code}</div>`;
        if (email.link) html += `<a href="${email.link}" target="_blank" class="code-link">Abrir enlace verificación</a>`;
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

function cancelSearch() { hideAll(); }

function closeGuide() {
    document.getElementById('guide-content').style.display = 'none';
    document.querySelector('.error-cases-grid').style.display = 'grid';
    document.querySelector('.guide-intro').style.display = 'block';
}

function showGuide(type) {
    const content = document.getElementById('guide-content');
    const steps = document.getElementById('guide-steps');
    document.querySelector('.error-cases-grid').style.display = 'none';
    document.querySelector('.guide-intro').style.display = 'none';

    const guides = {
        code4: {
            title: 'Código de 4 dígitos',
            steps: [
                { num: '1', title: 'Situación actual', desc: 'Netflix te está pidiendo un código de 4 dígitos que fue enviado a tu correo asociado a la cuenta.' },
                { num: '2', title: 'Verifica que solicitaste el código', desc: 'Asegúrate de haber presionado el botón <strong>"Enviar email"</strong> en Netflix para que te envíen el código.' },
                { num: '3', title: 'Obtén tu código aquí', desc: 'Presiona <strong>"Obtener código ahora"</strong> abajo y podrás ver el código de 4 dígitos en la pestaña Modo Rápido.' },
                { num: '', title: '¡Todo listo!', desc: 'Ingresa el código de 4 dígitos en Netflix y podrás continuar usando tu cuenta.', final: true }
            ]
        },
        temporary: {
            title: 'Dispositivo no es del hogar',
            steps: [
                { num: '1', title: 'Error en dispositivo móvil', desc: 'Netflix detectó que tu móvil o tablet no está en la ubicación del hogar de Netflix.' },
                { num: '2', title: 'Presiona "Ver Temporalmente"', desc: 'En la pantalla de error, selecciona la opción <strong>"Ver Temporalmente"</strong> para solicitar acceso temporal.' },
                { num: '3', title: 'Solicita el código', desc: 'Netflix te pedirá verificar. Selecciona <strong>"Enviar email"</strong> para recibir el código.' },
                { num: '4', title: 'Obtén el código', desc: 'Presiona <strong>"Obtener código ahora"</strong> abajo y copia el código que aparece en Modo Rápido.' },
                { num: '', title: '¡Acceso concedido!', desc: 'Ingresa el código en Netflix y tendrás acceso temporal por 30 días.', final: true }
            ]
        },
        tv: {
            title: 'TV no es del hogar',
            steps: [
                { num: '1', title: 'Error en Smart TV', desc: 'Tu televisor no está registrado en el hogar de Netflix y necesita verificación.' },
                { num: '2', title: 'Selecciona una opción', desc: 'En la pantalla de error, elige <strong>"Actualizar hogar"</strong> o <strong>"Estoy de Viaje"</strong> (recomendado).' },
                { num: '3', title: 'Solicita el código', desc: 'Presiona <strong>"Enviar email"</strong> para que Netflix te envíe un código de verificación.' },
                { num: '4', title: 'Obtén el código', desc: 'Presiona <strong>"Obtener código ahora"</strong> abajo y encontrarás el código en la pestaña Modo Rápido.' },
                { num: '', title: '¡TV verificado!', desc: 'Ingresa el código en tu TV y podrás continuar viendo Netflix sin problemas.', final: true }
            ]
        },
        update: {
            title: 'Actualizar hogar de Netflix',
            steps: [
                { num: '1', title: 'Necesitas actualizar tu hogar', desc: 'Netflix requiere que actualices la ubicación del hogar de tu cuenta.' },
                { num: '2', title: 'Inicia el proceso', desc: 'En la pantalla de Netflix, selecciona <strong>"Actualizar hogar de Netflix"</strong>.' },
                { num: '3', title: 'Solicita verificación', desc: 'Netflix te pedirá verificar tu identidad. Presiona <strong>"Enviar email"</strong> para recibir el código.' },
                { num: '4', title: 'Obtén el código', desc: 'Presiona <strong>"Obtener código ahora"</strong> abajo y el código aparecerá en Modo Rápido.' },
                { num: '5', title: 'Completa la actualización', desc: 'Ingresa el código en Netflix y sigue los pasos para actualizar tu hogar correctamente.' },
                { num: '', title: '¡Hogar actualizado!', desc: 'Tu hogar de Netflix ha sido actualizado exitosamente.', final: true }
            ]
        }
    };

    const guide = guides[type];
    let html = `<h2>${guide.title}</h2>`;
    guide.steps.forEach(step => {
        const finalClass = step.final ? ' final' : '';
        html += `
        <div class="guide-step${finalClass}">
            <div class="step-number">${step.num}</div>
            <div class="step-content">
                <h3>${step.title}</h3>
                <p>${step.desc}</p>
            </div>
        </div>
        `;
    });

    steps.innerHTML = html;
    content.style.display = 'block';
}

document.getElementById('checkBtn').addEventListener('click', checkEmails);
document.getElementById('retryBtn').addEventListener('click', checkEmails);
document.getElementById('retryBtn2').addEventListener('click', checkEmails);

window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => checkEmails(), 300);
});
