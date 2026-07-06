// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar módulos
    const themeManager = initThemeToggle();
    initCanvasParticles(themeManager);
    initMobileMenu();
    initSmoothScroll();
    initScrollEffects();
    initScrollTopButton();
    initContactForm();
    initProjectModal();
    initIntersectionObserver();
});

/* ==========================================
   1. SISTEMA DE PARTÍCULAS (CANVAS 60FPS)
   ========================================== */
function initCanvasParticles(themeManager) {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Configuración de partículas
    const config = {
        particleCount: 65,
        maxDistance: 110,
        mouseRadius: 130,
        speedMultiplier: 0.45
    };

    const mouse = {
        x: null,
        y: null,
        radius: config.mouseRadius
    };

    // Escuchar eventos del ratón
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Ajustar dimensiones del lienzo
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Re-inicializar partículas al cambiar el tamaño para que queden distribuidas
        initParticles();
    }
    
    window.addEventListener('resize', resizeCanvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Obtener colores dinámicos del tema actual
    function getThemeColors() {
        const isLight = document.body.classList.contains('light-mode');
        return {
            particleColor: isLight ? 'rgba(37, 99, 235, 0.25)' : 'rgba(56, 189, 248, 0.3)',
            lineColor: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(56, 189, 248, 0.08)'
        };
    }

    let colors = getThemeColors();
    
    // Registrar callback de actualización de colores cuando cambie el tema
    themeManager.onThemeChange(() => {
        colors = getThemeColors();
    });

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1.5; // tamaño de partículas entre 1.5 y 3.5px
            this.baseSpeedX = (Math.random() - 0.5) * config.speedMultiplier;
            this.baseSpeedY = (Math.random() - 0.5) * config.speedMultiplier;
            this.vx = this.baseSpeedX;
            this.vy = this.baseSpeedY;
        }

        update() {
            // Mover partícula
            this.x += this.vx;
            this.y += this.vy;

            // Rebotar en bordes
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

            // Interacción interactiva con el ratón
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.hypot(dx, dy);

                if (distance < mouse.radius) {
                    // Fuerza de repulsión
                    const force = (mouse.radius - distance) / mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    
                    // Empujar ligeramente en dirección opuesta
                    this.x -= Math.cos(angle) * force * 1.5;
                    this.y -= Math.sin(angle) * force * 1.5;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = colors.particleColor;
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        // Menos partículas en pantallas pequeñas
        const count = window.innerWidth < 768 ? config.particleCount / 2 : config.particleCount;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.hypot(dx, dy);

                if (distance < config.maxDistance) {
                    // Calcular opacidad en función de la distancia
                    const opacity = (1 - (distance / config.maxDistance)) * 0.45;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = colors.lineColor.replace('0.08', opacity.toFixed(2));
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        connectParticles();
        animationFrameId = requestAnimationFrame(animate);
    }

    initParticles();
    animate();
}

/* ==========================================
   2. CONTROL DE MODO OSCURO / CLARO
   ========================================== */
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const callbacks = [];

    // Cargar preferencia guardada
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    body.classList.remove('dark-mode', 'light-mode');
    body.classList.add(savedTheme);

    function triggerThemeChange() {
        callbacks.forEach(cb => cb());
    }

    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('dark-mode')) {
            body.classList.replace('dark-mode', 'light-mode');
            localStorage.setItem('theme', 'light-mode');
        } else {
            body.classList.replace('light-mode', 'dark-mode');
            localStorage.setItem('theme', 'dark-mode');
        }
        triggerThemeChange();
    });

    return {
        onThemeChange: (callback) => {
            if (typeof callback === 'function') {
                callbacks.push(callback);
            }
        }
    };
}

/* ==========================================
   3. MENÚ DE NAVEGACIÓN MÓVIL (DRAWER)
   ========================================== */
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = navMenu.querySelectorAll('a');

    const toggleMenu = () => {
        const isActive = hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
    };

    const closeMenu = () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    };

    hamburger.addEventListener('click', toggleMenu);

    // Cerrar menú al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Cerrar menú al hacer clic fuera del mismo
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
}

/* ==========================================
   4. SCROLL SUAVE CON OFFSET
   ========================================== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 75; // Altura fija de navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ==========================================
   5. EFECTOS EN NAVBAR AL SCROLL
   ========================================== */
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const handleScroll = () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);
    // Ejecutar una vez al cargar por si inicia a mitad de página
    handleScroll();
}

/* ==========================================
   6. BOTÓN DE VOLVER ARRIBA
   ========================================== */
function initScrollTopButton() {
    const scrollTopBtn = document.getElementById('scrollTop');
    if (!scrollTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ==========================================
   7. FORMULARIO DE CONTACTO & NOTIFICACIONES TOAST
   ========================================== */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = submitBtn.querySelector('span');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Obtener campos
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();

        // Validación básica
        if (!name || !email || !message) {
            showToast('Por favor, completa todos los campos del formulario.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Ingresa un correo electrónico válido.', 'error');
            emailInput.focus();
            return;
        }

        // Simular envío con carga visual
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtnText.textContent = 'Enviando...';

        setTimeout(() => {
            // Mostrar Toast de Éxito
            showToast(`¡Mensaje enviado con éxito, ${name}! Te contactaré muy pronto.`, 'success');
            
            // Restablecer botón y formulario
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtnText.textContent = 'Enviar Mensaje';
            contactForm.reset();
        }, 1500);
    });
}

// Mostrar notificaciones Toast personalizadas
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icono correspondiente en función del tipo
    const icon = type === 'success' ? '✔' : '✖';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Animación de salida programada a los 4 segundos
    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

/* ==========================================
   8. ANIMACIONES EN SCROLL (INTERSECTION OBSERVER)
   ========================================== */
function initIntersectionObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.12 // El elemento se activa cuando el 12% está en pantalla
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Dejar de observar una vez que se muestra la animación
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observar elementos con la clase "reveal"
    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

// Prevenir salto brusco en enlaces vacíos
document.addEventListener('click', (e) => {
    if (e.target.closest('a[href="#"]')) {
        e.preventDefault();
    }
});

/* ==========================================
   9. MODAL DE DETALLES DEL PROYECTO
   ========================================== */
function initProjectModal() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    const projectModal = document.getElementById('projectModal');
    const closeModalBtn = document.getElementById('closeModal');

    if (!portfolioGrid || !projectModal || !closeModalBtn) return;

    const modalImage = document.getElementById('modalImage');
    const modalTag = document.getElementById('modalTag');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalTech = document.getElementById('modalTech');
    const modalFeatures = document.getElementById('modalFeatures');
    const modalLiveBtn = document.getElementById('modalLiveBtn');

    portfolioGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-detail');
        if (!btn) return;
        
        e.preventDefault();
        const card = btn.closest('.portfolio-card');
        if (!card) return;

        // Extraer metadatos
        const title = card.getAttribute('data-title') || '';
        const tag = card.getAttribute('data-tag') || '';
        const desc = card.getAttribute('data-desc') || '';
        const img = card.getAttribute('data-img') || '';
        const tech = card.getAttribute('data-tech') ? card.getAttribute('data-tech').split(',') : [];
        const features = card.getAttribute('data-features') ? card.getAttribute('data-features').split('|') : [];
        const github = card.getAttribute('data-github') || 'https://github.com/ngortiz';
        const live = card.getAttribute('data-live') || '';

        // Cargar datos en el modal
        modalImage.src = img;
        modalImage.alt = title;
        modalTag.textContent = tag;
        modalTitle.textContent = title;
        modalDescription.textContent = desc;

        // Cargar tecnologías (etiquetas)
        modalTech.innerHTML = '';
        tech.forEach(t => {
            const badge = document.createElement('span');
            badge.className = 'modal-tech-badge';
            badge.textContent = t.trim();
            modalTech.appendChild(badge);
        });

        // Cargar características (lista)
        modalFeatures.innerHTML = '';
        features.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f.trim();
            modalFeatures.appendChild(li);
        });

        // Configurar botón de sitio web en vivo
        if (live && live.trim() !== '') {
            modalLiveBtn.href = live;
            modalLiveBtn.style.display = 'inline-block';
        } else {
            modalLiveBtn.style.display = 'none';
        }

        // Mostrar ventana modal con animación
        projectModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Cerrar modal al hacer clic en la X
    closeModalBtn.addEventListener('click', () => {
        projectModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Cerrar modal al hacer clic en el fondo oscuro
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) {
            projectModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && projectModal.classList.contains('active')) {
            projectModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}