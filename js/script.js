// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del formulario
    const mensajeTextarea = document.getElementById('mensaje');
    const charCount = document.getElementById('charCount');
    const form = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');

    // Contador de caracteres para el textarea
    if (mensajeTextarea && charCount) {
        mensajeTextarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            // Limitar a 1000 caracteres
            if (count > 1000) {
                this.value = this.value.substring(0, 1000);
                charCount.textContent = '1000';
            }
            
            // Cambiar color si se acerca al límite
            if (count > 900) {
                charCount.style.color = '#e53e3e';
                charCount.style.fontWeight = 'bold';
            } else {
                charCount.style.color = '#718096';
                charCount.style.fontWeight = 'normal';
            }
        });
    }

    // Validación del formulario antes de enviar
    if (form) {
        form.addEventListener('submit', function(e) {
            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const asunto = document.getElementById('asunto').value;
            const mensaje = document.getElementById('mensaje').value.trim();

            // Validar campos obligatorios
            if (!nombre || !email || !asunto || !mensaje) {
                e.preventDefault();
                alert('❌ Por favor, completa todos los campos obligatorios.');
                return false;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                e.preventDefault();
                alert('❌ Por favor, ingresa un correo electrónico válido.');
                return false;
            }

            // Validar longitud mínima del mensaje
            if (mensaje.length < 10) {
                e.preventDefault();
                alert('❌ El mensaje debe tener al menos 10 caracteres.');
                return false;
            }

            // Mostrar estado de envío
            const submitBtn = form.querySelector('.btn-submit');
            if (submitBtn) {
                submitBtn.innerHTML = '<span class="btn-text">Enviando...</span> ⏳';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';
            }

            // El formulario se enviará normalmente
            return true;
        });
    }

    // Verificar si hay parámetro success en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        if (form && successMessage) {
            form.style.display = 'none';
            successMessage.classList.add('show');
            
            // Hacer scroll al mensaje de éxito
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Limpiar la URL sin recargar
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Validación en tiempo real del email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.style.borderColor = '#e53e3e';
                this.style.backgroundColor = '#fff5f5';
            } else {
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });

        emailInput.addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.backgroundColor = '';
        });
    }

    // Formatear teléfono (solo números, espacios, + y -)
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9+\s-]/g, '');
        });
    }

    // Animación de los campos al hacer focus
    const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateX(5px)';
            this.parentElement.style.transition = 'transform 0.3s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateX(0)';
        });
    });

    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Efecto de aparición al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Aplicar animaciones a las tarjetas de servicio
    document.querySelectorAll('.servicio-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });

    // Prevenir envío múltiple del formulario
    let formSubmitted = false;
    if (form) {
        form.addEventListener('submit', function(e) {
            if (formSubmitted) {
                e.preventDefault();
                return false;
            }
            formSubmitted = true;
        });
    }

    // Mensaje de bienvenida en consola (opcional, puedes quitarlo)
    console.log('%c🚀 FyisBot - Sistema de Contacto Activo', 'color: #667eea; font-size: 16px; font-weight: bold;');
});