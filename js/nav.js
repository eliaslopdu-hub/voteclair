/* ============================================================
   VoteClair — nav.js
   Navigation sticky + burger mobile + page active
   ============================================================ */

(function () {
  'use strict';

  const navbar  = document.querySelector('.navbar');
  const burger  = document.querySelector('.nav-burger');
  const mobileMenu = document.querySelector('.nav-mobile');

  /* ── Active state ── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Scroll compact ── */
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    if (navbar) {
      navbar.classList.toggle('compact', y > 60);
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Burger toggle ── */
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    /* Fermer si clic lien */
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
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
