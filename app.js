/* ===== Martin Moore — app.js v9 ===== */

// ===== PRODUCT DATABASE (loaded dynamically) =====
let PRODUCTS = [];

async function loadProductsForSearch() {
    try {
        const res = await fetch('products.json');
        if (!res.ok) throw new Error(res.status);
        PRODUCTS = await res.json();
    } catch (e) {
        try {
            await new Promise((resolve, reject) => {
                if (window.PRODUCTS_DATA) { PRODUCTS = window.PRODUCTS_DATA; resolve(); return; }
                const script = document.createElement('script');
                script.src = 'products-fallback.js';
                script.onload = () => { PRODUCTS = window.PRODUCTS_DATA || []; resolve(); };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (e2) { /* search will work without products */ }
    }
}

// ===== TYPO CORRECTIONS (for smart search) =====
const TYPO_MAP = {
    'пропл': 'Pro Plan', 'проплан': 'Pro Plan', 'роял': 'Royal Canin', 'ройял': 'Royal Canin',
    'ройал': 'Royal Canin', 'хиллс': "Hill's", 'хилс': "Hill's", 'акана': 'Acana',
    'ориджен': 'Orijen', 'ориджн': 'Orijen', 'грандорф': 'Grandorf', 'конг': 'Kong',
    'хантер': 'Hunter', 'корм': 'корм', 'игрушк': 'игрушка', 'ошейник': 'ошейник',
    'монж': 'Monge', 'фёст чойс': 'First Choice', 'трикси': 'Trixie',
};

// ===== SMART SEARCH =====
function initSearch() {
    const input = document.getElementById('searchInput');
    const suggestions = document.getElementById('searchSuggestions');
    if (!input || !suggestions) return;

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 2) { suggestions.classList.remove('active'); return; }

        let corrected = q;
        for (const [typo, fix] of Object.entries(TYPO_MAP)) {
            if (q.includes(typo)) { corrected = fix.toLowerCase(); break; }
        }

        const results = PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(corrected) ||
            p.brand.toLowerCase().includes(corrected) ||
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q)
        ).slice(0, 6);

        if (!results.length) {
            suggestions.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted)">Ничего не найдено</div>';
        } else {
            suggestions.innerHTML = results.map(p => `
                <a href="product.html?id=${p.id}">
                    <img src="${p.image}" alt="${p.name}">
                    <div>
                        <div style="font-weight:600;font-size:.9rem">${highlight(p.brand + ' ' + p.name, q)}</div>
                        <div style="font-size:.8rem;color:var(--text-muted)">${p.price.toLocaleString('ru-RU')} &#8381;</div>
                    </div>
                </a>
            `).join('');
        }
        suggestions.classList.add('active');
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.search-bar')) suggestions.classList.remove('active');
    });
}

function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function highlight(text, query) {
    const safe = escapeHTML(text);
    const safeQuery = escapeHTML(query);
    const idx = safe.toLowerCase().indexOf(safeQuery.toLowerCase());
    if (idx === -1) return safe;
    return safe.slice(0, idx) + '<strong style="color:var(--accent)">' + safe.slice(idx, idx + safeQuery.length) + '</strong>' + safe.slice(idx + safeQuery.length);
}

// ===== CART (localStorage) =====
function addToCart(item) {
    try {
        const cart = JSON.parse(localStorage.getItem('mm_cart') || '[]');
        const entry = { id: item.id, name: item.name, price: Number(item.price) };
        if (item.image) entry.image = item.image;
        cart.push(entry);
        localStorage.setItem('mm_cart', JSON.stringify(cart));
    } catch (e) { /* localStorage недоступен */ }
    updateCartCount();
    showToast(`${item.name} добавлен в корзину 🛒`);
}

function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('mm_cart') || '[]');
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = cart.length;
            el.style.display = cart.length ? 'flex' : 'none';
        });
    } catch (e) { /* localStorage недоступен */ }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== MOBILE MENU =====
function initBurger() {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('navLinks');
    if (!burger || !nav) return;
    burger.addEventListener('click', () => {
        nav.classList.toggle('open');
        const spans = burger.querySelectorAll('span');
        if (nav.classList.contains('open')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    });
}

// ===== ADD-TO-CART BUTTONS (prevent link navigation) =====
function initAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            addToCart({
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: btn.dataset.price,
                image: btn.dataset.image || ''
            });
            btn.style.transform = 'scale(1.3)';
            setTimeout(() => btn.style.transform = '', 200);
        });
    });
}

// ===== SCROLL ANIMATIONS =====
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${entry.target.dataset.delay || 0}s`;
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-in').forEach((el, i) => {
        el.style.opacity = '0';
        el.dataset.delay = (i % 4) * 0.1;
        observer.observe(el);
    });
}

// ===== HEADER SCROLL EFFECT =====
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.style.boxShadow = window.scrollY > 60 ? 'var(--shadow)' : '';
    }, { passive: true });
}

// ===== HERO INTERACTIVITY =====
function initHeroInteractivity() {
    const heroSection = document.querySelector('.hero');
    const dogContainer = document.getElementById('interactiveDog');
    const flipWrapper = dogContainer ? dogContainer.querySelector('.dog-flip-wrapper') : null;
    const lottieEl = document.getElementById('lottie-dog');

    if (!heroSection || !dogContainer || !lottieEl) return;

    // Init Lottie animation
    if (typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: lottieEl,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'фото для проекта/dog-walk.json'
        });
    }

    let theta = 0;
    let lastTime = performance.now();
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        lottieEl.style.width = '213px';
        lottieEl.style.height = '213px';
        dogContainer.style.marginLeft = '-106px';
        dogContainer.style.marginTop = '-106px';
    }

    function animateDog(time) {
        const dt = time - lastTime;
        lastTime = time;
        theta += 0.0004 * dt;

        const rect = heroSection.getBoundingClientRect();
        if (rect.width > 0) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            let rx, ry;
            if (rect.width < 1024) {
                rx = rect.width * 0.38;
                ry = rect.height * 0.35;
            } else {
                rx = Math.min(rect.width * 0.42, 550);
                ry = Math.min(rect.height * 0.38, 260);
            }
            const nextX = centerX + rx * Math.cos(theta);
            const nextY = centerY + ry * Math.sin(theta);
            const dx = -Math.sin(theta);

            dogContainer.style.transform = `translate(${nextX}px, ${nextY}px)`;
            if (dx > 0) flipWrapper.classList.add('flipped');
            else flipWrapper.classList.remove('flipped');
        }
        requestAnimationFrame(animateDog);
    }

    setTimeout(() => {
        lastTime = performance.now();
        requestAnimationFrame(animateDog);
    }, 100);
}

// ===== PRELOADER =====
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    function hidePreloader() {
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => preloader.remove(), 500);
        }, 1600);
    }
    if (document.readyState === 'complete') {
        hidePreloader();
    } else {
        window.addEventListener('load', hidePreloader);
    }
}

// ===== BACK TO TOP =====
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== ANIMATED COUNTERS =====
function initCounters() {
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                if (isNaN(target)) return;
                let start = 0;
                const step = target / (1500 / 16);
                const timer = setInterval(() => {
                    start += step;
                    if (start >= target) {
                        el.textContent = target.toLocaleString('ru-RU');
                        clearInterval(timer);
                    } else {
                        el.textContent = Math.floor(start).toLocaleString('ru-RU');
                    }
                }, 16);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));
}

// ===== NEWSLETTER =====
function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input');
        showToast('Вы подписаны! Ждите первое письмо 📬');
        input.value = '';
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    initPreloader();
    initBurger();
    initAddToCartButtons();
    initAnimations();
    initHeaderScroll();
    updateCartCount();
    initHeroInteractivity();
    initBackToTop();
    initCounters();
    initNewsletter();
    await loadProductsForSearch();
    initSearch();
});
