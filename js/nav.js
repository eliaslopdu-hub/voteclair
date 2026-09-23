/* ============================================================
   VoteClair — nav.js  v2
   Navigation sticky + burger mobile + dropdown + page active
   ============================================================ */

(function () {
  'use strict';

  const navbar      = document.querySelector('.navbar');
  const burger      = document.querySelector('.nav-burger');
  const mobileMenu  = document.querySelector('.nav-mobile');

  /* ── Active state ── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a, .nav-dropdown-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* Mark dropdown toggle as active-section if a child is active */
  document.querySelectorAll('.nav-has-dropdown').forEach(item => {
    const active = item.querySelector('.nav-dropdown-menu a.active');
    if (active) item.querySelector('.nav-dropdown-toggle').classList.add('active-section');
  });

  /* ── Scroll compact ── */
  function onScroll() {
    if (navbar) navbar.classList.toggle('compact', window.scrollY > 60);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Dropdown toggles ── */
  document.querySelectorAll('.nav-has-dropdown').forEach(item => {
    const toggle = item.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = item.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      /* Close other dropdowns */
      document.querySelectorAll('.nav-has-dropdown').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const t = other.querySelector('.nav-dropdown-toggle');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  /* Close dropdowns on outside click */
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-has-dropdown.open').forEach(item => {
      item.classList.remove('open');
      const t = item.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  });

  /* Close dropdowns on Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-has-dropdown.open').forEach(item => {
        item.classList.remove('open');
        const t = item.querySelector('.nav-dropdown-toggle');
        if (t) { t.setAttribute('aria-expanded', 'false'); t.focus(); }
      });
    }
  });

  /* ── Burger toggle ── */
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Fade-in au scroll (IntersectionObserver) ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
})();
