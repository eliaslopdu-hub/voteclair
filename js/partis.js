/* ============================================================
   VoteClair — partis.js
   Filtres et animations page partis
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* Hover pulse effect sur les cartes */
  document.querySelectorAll('.parti-card').forEach(card => {
    const accent = card.querySelector('.parti-card-accent');
    const color  = accent ? accent.style.background : null;

    card.addEventListener('mouseenter', () => {
      if (color) card.style.boxShadow = `0 8px 32px ${color}22`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
    });
  });
});
