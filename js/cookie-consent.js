/* ============================================================
   VoteClair — cookie-consent.js
   Bandeau RGPD conforme — bloque AdSense jusqu'au consentement
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'vc_cookie_consent';
  const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'; // Remplacer par votre ID AdSense

  /* ── Lecture / écriture du choix ── */
  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }

  function saveConsent(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, date: new Date().toISOString() })); } catch (e) {}
  }

  /* ── Chargement conditionnel d'AdSense ── */
  function loadAdSense() {
    if (document.getElementById('adsense-script')) return;
    if (ADSENSE_CLIENT.indexOf('XXXXXXXXXXXXXXXX') !== -1) return; // ID non configuré
    const s = document.createElement('script');
    s.id = 'adsense-script';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
    document.head.appendChild(s);
  }

  /* ── Application du consentement ── */
  function applyConsent(consent) {
    if (consent && consent.advertising) {
      loadAdSense();
    }
  }

  /* ── Fermeture du bandeau ── */
  function closeBanner() {
    const banner = document.getElementById('vc-cookie-banner');
    const overlay = document.getElementById('vc-cookie-overlay');
    if (banner) banner.remove();
    if (overlay) overlay.remove();
  }

  /* ── Ouverture du panneau de personnalisation ── */
  function openCustomize() {
    const panel = document.getElementById('vc-cookie-panel');
    if (panel) panel.style.display = 'block';
  }

  function closeCustomize() {
    const panel = document.getElementById('vc-cookie-panel');
    if (panel) panel.style.display = 'none';
  }

  /* ── Affichage du bandeau ── */
  function showBanner() {
    const banner = document.createElement('div');
    banner.id = 'vc-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'Gestion des cookies');
    banner.innerHTML = `
      <div class="vc-cb-inner">
        <div class="vc-cb-content">
          <div class="vc-cb-title">🍪 Gestion des cookies</div>
          <p class="vc-cb-text">
            VoteClair utilise des cookies pour mesurer l'audience du site et afficher des publicités via
            <strong>Google AdSense</strong>. Ces cookies peuvent collecter des données de navigation.
            Vous pouvez accepter, refuser ou personnaliser votre choix.
            <a href="politique-cookies.html" class="vc-cb-link">En savoir plus</a>
          </p>
        </div>
        <div class="vc-cb-actions">
          <button id="vc-btn-customize" class="vc-btn vc-btn--outline">Personnaliser</button>
          <button id="vc-btn-refuse"    class="vc-btn vc-btn--refuse">Refuser</button>
          <button id="vc-btn-accept"    class="vc-btn vc-btn--accept">Tout accepter</button>
        </div>
      </div>

      <!-- Panneau de personnalisation -->
      <div id="vc-cookie-panel" style="display:none">
        <div class="vc-panel-title">Personnaliser mes préférences</div>
        <div class="vc-toggle-row">
          <div class="vc-toggle-info">
            <strong>Cookies essentiels</strong>
            <span>Nécessaires au fonctionnement du site (consentement cookies). Ne peuvent pas être désactivés.</span>
          </div>
          <div class="vc-toggle-ctrl vc-toggle-disabled">Toujours actif</div>
        </div>
        <div class="vc-toggle-row">
          <div class="vc-toggle-info">
            <strong>Cookies publicitaires (Google AdSense)</strong>
            <span>Permettent d'afficher des publicités personnalisées via Google. Des données de navigation peuvent être transmises à Google.</span>
          </div>
          <label class="vc-toggle">
            <input type="checkbox" id="vc-pref-advertising" />
            <span class="vc-toggle-slider"></span>
          </label>
        </div>
        <div class="vc-toggle-row">
          <div class="vc-toggle-info">
            <strong>Cookies de mesure d'audience</strong>
            <span>Permettent de mesurer l'audience du site de façon anonyme (ex. nombre de visiteurs).</span>
          </div>
          <label class="vc-toggle">
            <input type="checkbox" id="vc-pref-analytics" />
            <span class="vc-toggle-slider"></span>
          </label>
        </div>
        <div class="vc-panel-actions">
          <button id="vc-btn-save" class="vc-btn vc-btn--accept">Enregistrer mes préférences</button>
          <button id="vc-btn-cancel" class="vc-btn vc-btn--outline">Annuler</button>
        </div>
      </div>
    `;

    /* Styles injectés */
    if (!document.getElementById('vc-cookie-styles')) {
      const style = document.createElement('style');
      style.id = 'vc-cookie-styles';
      style.textContent = `
        #vc-cookie-banner {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 99999;
          background: #fff;
          border-top: 3px solid #6C63FF;
          box-shadow: 0 -4px 32px rgba(0,0,0,0.15);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          padding: 20px 24px;
          animation: vc-slide-up 0.35s ease;
        }
        @keyframes vc-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .vc-cb-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .vc-cb-content { flex: 1; min-width: 280px; }
        .vc-cb-title { font-weight: 700; font-size: 1rem; color: #1A1A2E; margin-bottom: 6px; }
        .vc-cb-text { color: #5C5C78; line-height: 1.6; margin: 0; }
        .vc-cb-link { color: #6C63FF; text-decoration: underline; }
        .vc-cb-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .vc-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          white-space: nowrap;
          transition: opacity 0.2s;
          font-family: inherit;
        }
        .vc-btn:hover { opacity: 0.85; }
        .vc-btn--accept  { background: #6C63FF; color: #fff; }
        .vc-btn--refuse  { background: #F0EFF9; color: #6C63FF; border: 1px solid #6C63FF; }
        .vc-btn--outline { background: transparent; color: #5C5C78; border: 1px solid #ddd; }
        /* Panneau personnalisation */
        #vc-cookie-panel {
          border-top: 1px solid #eee;
          margin-top: 16px;
          padding-top: 16px;
          max-width: 700px;
        }
        .vc-panel-title { font-weight: 700; color: #1A1A2E; margin-bottom: 12px; }
        .vc-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .vc-toggle-info { flex: 1; }
        .vc-toggle-info strong { display: block; color: #1A1A2E; font-size: 0.875rem; margin-bottom: 2px; }
        .vc-toggle-info span  { color: #5C5C78; font-size: 0.8rem; line-height: 1.5; }
        .vc-toggle-disabled { color: #38A169; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
        .vc-toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
        .vc-toggle input { opacity: 0; width: 0; height: 0; }
        .vc-toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: #ccc;
          border-radius: 24px;
          transition: background 0.2s;
        }
        .vc-toggle-slider::before {
          content: '';
          position: absolute;
          width: 18px; height: 18px;
          left: 3px; bottom: 3px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .vc-toggle input:checked + .vc-toggle-slider { background: #6C63FF; }
        .vc-toggle input:checked + .vc-toggle-slider::before { transform: translateX(20px); }
        .vc-panel-actions { display: flex; gap: 10px; margin-top: 16px; }
        @media (max-width: 600px) {
          .vc-cb-inner { flex-direction: column; align-items: flex-start; }
          .vc-cb-actions { width: 100%; }
          .vc-btn { flex: 1; text-align: center; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);

    /* Bouton "Tout accepter" */
    document.getElementById('vc-btn-accept').addEventListener('click', function () {
      const consent = { necessary: true, advertising: true, analytics: true };
      saveConsent(consent);
      applyConsent(consent);
      closeBanner();
    });

    /* Bouton "Refuser" */
    document.getElementById('vc-btn-refuse').addEventListener('click', function () {
      const consent = { necessary: true, advertising: false, analytics: false };
      saveConsent(consent);
      closeBanner();
    });

    /* Bouton "Personnaliser" */
    document.getElementById('vc-btn-customize').addEventListener('click', openCustomize);

    /* Bouton "Enregistrer mes préférences" */
    document.getElementById('vc-btn-save').addEventListener('click', function () {
      const consent = {
        necessary: true,
        advertising: document.getElementById('vc-pref-advertising').checked,
        analytics:   document.getElementById('vc-pref-analytics').checked,
      };
      saveConsent(consent);
      applyConsent(consent);
      closeBanner();
    });

    /* Bouton "Annuler" */
    document.getElementById('vc-btn-cancel').addEventListener('click', closeCustomize);
  }

  /* ── Widget "Gérer mes cookies" persistant ── */
  function showCookieWidget() {
    if (document.getElementById('vc-cookie-widget')) return;
    const w = document.createElement('button');
    w.id = 'vc-cookie-widget';
    w.setAttribute('aria-label', 'Gérer mes préférences cookies');
    w.textContent = '🍪';
    w.title = 'Gérer mes cookies';
    w.addEventListener('click', function () {
      const existing = getConsent();
      if (existing) {
        // Réinitialiser le choix et ré-afficher le bandeau
        localStorage.removeItem(STORAGE_KEY);
        showBanner();
        w.remove();
      }
    });
    const wStyle = document.createElement('style');
    wStyle.textContent = `
      #vc-cookie-widget {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9998;
        width: 40px; height: 40px;
        border-radius: 50%;
        border: 1px solid #ddd;
        background: #fff;
        font-size: 1.1rem;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(0,0,0,0.12);
        transition: transform 0.2s;
      }
      #vc-cookie-widget:hover { transform: scale(1.1); }
    `;
    document.head.appendChild(wStyle);
    document.body.appendChild(w);
  }

  /* ── Une régie publicitaire est-elle réellement configurée ? ── */
  function adsConfigured() {
    return ADSENSE_CLIENT.indexOf('XXXXXXXXXXXXXXXX') === -1;
  }

  /* ── Initialisation ── */
  function init() {
    // Tant qu'aucune régie n'est configurée, le site ne dépose aucun cookie
    // non essentiel : afficher un bandeau de consentement serait trompeur.
    // Dès qu'un vrai ADSENSE_CLIENT est renseigné, le bandeau se réactive seul.
    if (!adsConfigured()) return;

    const stored = getConsent();
    if (!stored) {
      // Premier chargement — afficher le bandeau
      showBanner();
    } else {
      // Consentement déjà donné — appliquer immédiatement
      applyConsent(stored);
      showCookieWidget();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
