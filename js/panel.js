const API_URL = '/api/check_emails';
let autoRefreshInterval;

const refreshBtn = document.getElementById('refreshBtn');
const retryBtn = document.getElementById('retryBtn');
const retryBtn2 = document.getElementById('retryBtn2');
const cancelBtn = document.getElementById('cancelBtn');
const loading = document.getElementById('loading');
const resultsContainer = document.getElementById('resultsContainer');
const noResults = document.getElementById('noResults');
const errorContainer = document.getElementById('errorContainer');
const emailsList = document.getElementById('emailsList');
const emailCount = document.getElementById('emailCount');
const lastCheck = document.getElementById('lastCheck');
const errorMessage = document.getElementById('errorMessage');
const userEmailEl = document.getElementById('userEmail');

// Mostrar email del usuario
const userEmail = sessionStorage.getItem('userEmail');
if (userEmailEl && userEmail) {
    userEmailEl.textContent = userEmail;
}

// Auto-iniciar verificacion
window.addEventListener('DOMContentLoaded', function() {
    checkEmails();
});

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
    
    emails.forEach(email => {
        const emailCard = document.createElement('div');
        emailCard.className = 'email-card';
        
        let contentHTML = `
            <div class="email-header">
                <h3>${email.subject}</h3>
                <span class="email-time">${email.time}</span>
            </div>
        `;
        
        if (email.code) {
            contentHTML += `
                <div class="code-section">
                    <label>Codigo de verificacion:</label>
                    <div class="code-display">${email.code}</div>
                </div>
            `;
        }
        
        if (email.link) {
            contentHTML += `
                <div class="link-section">
                    <label>Link de verificacion:</label>
                    <a href="${email.link}" target="_blank" class="link-btn">Abrir Link</a>
                </div>
            `;
        }
        
        emailCard.innerHTML = contentHTML;
        emailsList.appendChild(emailCard);
    });
    
    resultsContainer.style.display = 'block';
}

function showNoResults() {
    hideAll();
    noResults.style.display = 'block';
}

function showError(message) {
    hideAll();
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
}

function hideAll() {
    loading.style.display = 'none';
    resultsContainer.style.display = 'none';
    noResults.style.display = 'none';
    errorContainer.style.display = 'none';
}

function updateLastCheck() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    lastCheck.textContent = timeStr;
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
        autoRefreshInterval = null;
    }
}

refreshBtn.addEventListener('click', checkEmails);
retryBtn.addEventListener('click', checkEmails);
retryBtn2.addEventListener('click', checkEmails);
cancelBtn.addEventListener('click', () => {
    hideAll();
    showNoResults();
});