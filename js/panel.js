// Auto-iniciar verificacion al cargar
window.addEventListener('DOMContentLoaded', function() {
    // Ocultar tutorial y mostrar panel automaticamente
    const tutorialSection = document.getElementById('tutorialSection');
    const panelSection = document.getElementById('panelSection');
    
    if (tutorialSection) tutorialSection.style.display = 'none';
    if (panelSection) panelSection.style.display = 'block';
    
    // Iniciar verificacion automatica
    setTimeout(() => {
        checkEmails();
    }, 500);
});
// Panel JavaScript - Lógica Simplificada

// Tutorial Device Selection
document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const device = this.dataset.device;
        
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.tutorial-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tutorialContent = document.getElementById(`tutorial-${device}`);
        if (tutorialContent) {
            tutorialContent.classList.add('active');
            setTimeout(() => {
                tutorialContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    });
});

// Start verification - Oculta tutorial, muestra panel
function startVerification() {
    document.getElementById('tutorialSection').style.display = 'none';
    document.getElementById('panelSection').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('panelSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Auto-verificar
    setTimeout(() => {
        checkEmails();
    }, 500);
}

// Back to tutorial
function backToTutorial() {
    document.getElementById('panelSection').style.display = 'none';
    document.getElementById('tutorialSection').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('tutorialSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    stopAutoRefresh();
    hideAll();
}

// Email checking functionality
const API_URL = '/api/check_emails';
let autoRefreshInterval;

const checkBtn = document.getElementById('checkBtn');
const refreshBtn = document.getElementById('refreshBtn');
const retryBtn = document.getElementById('retryBtn');
const loading = document.getElementById('loading');
const resultsContainer = document.getElementById('resultsContainer');
const noResults = document.getElementById('noResults');
const errorContainer = document.getElementById('errorContainer');
const emailsList = document.getElementById('emailsList');
const emailCount = document.getElementById('emailCount');
const lastCheck = document.getElementById('lastCheck');
const errorMessage = document.getElementById('errorMessage');

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
        startAutoRefresh();
        
    } catch (error) {
        console.error('Error:', error);
        showError('No se pudo conectar al servidor. Intenta nuevamente.');
    }
}

function showLoading() {
    hideAll();
    loading.style.display = 'block';
}

function showResults(emails, count) {
    hideAll();
    
    emailCount.textContent = count;
    emailsList.innerHTML = '';
    
    emails.forEach((email, index) => {
        const emailCard = createEmailCard(email, index);
        emailsList.appendChild(emailCard);
    });
    
    resultsContainer.style.display = 'block';
}

function createEmailCard(email, index) {
    const card = document.createElement('div');
    card.className = 'email-card';
    card.style.animation = `slideIn 0.4s ease ${index * 0.1}s both`;
    
    const date = formatDate(email.date);
    
    card.innerHTML = `
        <div class="email-header">
            <div class="email-info">
                <div class="email-subject">📌 ${email.subject || 'Nuevo correo de Netflix'}</div>
            </div>
            ${email.has_link ? '<span class="email-badge">✅ Enlace activo</span>' : ''}
        </div>
        <div class="email-meta">
            <span>📧 "${email.to}"</span>
            <span>📅 ${date}</span>
        </div>
        ${email.has_link ? `
            <p style="color: #b3b3b3; font-size: 0.9rem; margin: 0.75rem 0;">
                👉 Verifica tu acceso con el siguiente link 👇
            </p>
            <a href="${email.link}" target="_blank" class="email-link">
                🔗 Verificar Acceso Netflix
            </a>
            <p style="color: #e50914; font-size: 0.85rem; margin-top: 0.75rem; font-weight: 600;">
                ⚠️ Importante: Este enlace vence en 15 minutos
            </p>
        ` : '<p style="color: #999;">⚠️ Este correo no contiene enlace de verificación</p>'}
    `;
    
    return card;
}

function formatDate(dateString) {
    if (typeof dateString === 'string' && dateString.includes('/')) {
        return dateString + ' 🇵🇪';
    }
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes} 🇵🇪`;
}

function showNoResults() {
    hideAll();
    noResults.style.display = 'block';
}

function showError(message) {
    hideAll();
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
    stopAutoRefresh();
}

function hideAll() {
    loading.style.display = 'none';
    resultsContainer.style.display = 'none';
    noResults.style.display = 'none';
    errorContainer.style.display = 'none';
}

function updateLastCheck() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    lastCheck.textContent = `${hours}:${minutes}:${seconds}`;
}

function startAutoRefresh() {
    stopAutoRefresh();
    autoRefreshInterval = setInterval(() => {
        checkEmails();
    }, 30000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}

checkBtn.addEventListener('click', checkEmails);
refreshBtn.addEventListener('click', checkEmails);
retryBtn.addEventListener('click', checkEmails);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        if (resultsContainer.style.display === 'block') {
            startAutoRefresh();
        }
    }
});

console.log('🎬 FyisBot Panel Netflix v2.0 - Lógica Simplificada');
