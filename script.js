/**
 * VAGNER SANTOS (VAGOTE) - SECURE INTERACTIVE SCRIPTS
 * Hardened against DOM-based XSS, injection attacks, and unsafe innerHTML operations.
 * Compliant with OWASP Top 10:2025 and Defense-in-Depth principles.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  const videoModal = document.getElementById('video-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDialog = document.getElementById('modal-dialog');
  const modalPlayerContainer = document.getElementById('modal-player-container');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  /* ==========================================================================
     1. NAVBAR SCROLL EFFECT & MOBILE MENU
     ========================================================================== */
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        if (navbar) {
          if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpened = navMenu.classList.toggle('open');
      mobileToggle.classList.toggle('active', isOpened);
      mobileToggle.setAttribute('aria-expanded', isOpened ? 'true' : 'false');
    });

    // Close menu when clicking nav links
    document.querySelectorAll('.nav-link, .nav-cta-btn').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ==========================================================================
     2. CATEGORY FILTERING SYSTEM (SAFE ATTRIBUTE MATCHING)
     ========================================================================== */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = (btn.getAttribute('data-filter') || 'all').trim().toLowerCase();

      projectCards.forEach(card => {
        const rawCategory = card.getAttribute('data-category') || '';
        const cardCategories = rawCategory.toLowerCase().split(/\s+/);

        if (filterValue === 'all' || cardCategories.includes(filterValue)) {
          card.style.display = 'flex';
          window.requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            if (card.style.opacity === '0') {
              card.style.display = 'none';
            }
          }, 250);
        }
      });
    });
  });

  /* ==========================================================================
     3. SECURITY HELPERS & INPUT VALIDATION (DEFENSE-IN-DEPTH)
     ========================================================================== */
  
  /**
   * Sanitizes string inputs to prevent attribute breakouts and unexpected tokens
   */
  function sanitizePlainText(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  }

  /**
   * Validates and constructs secure embed URL for given media identifier
   * Returns object { type: 'iframe' | 'video' | 'error', src: string }
   */
  function buildSafeMediaSource(rawVideoId) {
    if (!rawVideoId || typeof rawVideoId !== 'string') {
      return { type: 'error', src: '' };
    }

    const trimmed = rawVideoId.trim();

    // 1. Google Drive URL or ID
    if (trimmed.includes('drive.google.com')) {
      const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/i) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/i);
      if (match && /^[a-zA-Z0-9_-]+$/.test(match[1])) {
        return { type: 'iframe', src: `https://drive.google.com/file/d/${encodeURIComponent(match[1])}/preview` };
      }
    }

    if (trimmed.startsWith('gdrive:')) {
      const gId = trimmed.replace(/^gdrive:/, '').trim();
      if (/^[a-zA-Z0-9_-]{15,}$/.test(gId)) {
        return { type: 'iframe', src: `https://drive.google.com/file/d/${encodeURIComponent(gId)}/preview` };
      }
    }

    // 2. YouTube URL or 11-char ID
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const ytMatch = trimmed.match(/(?:youtu\.be\/|v=|\/embed\/)([a-zA-Z0-9_-]{11})/i);
      if (ytMatch && /^[a-zA-Z0-9_-]{11}$/.test(ytMatch[1])) {
        return { type: 'iframe', src: `https://www.youtube.com/embed/${encodeURIComponent(ytMatch[1])}?autoplay=1&rel=0` };
      }
    }

    // 3. Direct local video asset (Must be safe relative path in assets/ without traversal)
    if (/^assets\/[a-zA-Z0-9_.-]+\.(mp4|webm)$/i.test(trimmed) && !trimmed.includes('..')) {
      return { type: 'video', src: encodeURI(trimmed) };
    }

    // 4. Fallback Google Drive raw file ID (alphanumeric >= 25 chars)
    if (trimmed.length >= 25 && /^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return { type: 'iframe', src: `https://drive.google.com/file/d/${encodeURIComponent(trimmed)}/preview` };
    }

    // 5. Adobe CCV Player short code (alphanumeric/hyphens)
    if (/^[a-zA-Z0-9_-]{8,24}$/.test(trimmed)) {
      return {
        type: 'iframe',
        src: `https://www-ccv.adobe.io/v1/player/ccv/${encodeURIComponent(trimmed)}/embed?bgcolor=%2308080a&lazyLoading=false&api_key=BehancePro2View`
      };
    }

    // Fail-Closed on unrecognized formats
    return { type: 'error', src: '' };
  }

  /* ==========================================================================
     4. HARDENED VIDEO MODAL / LIGHTBOX (NO INNERHTML)
     ========================================================================== */
  function openVideoModal(rawVideoId, rawTitle, rawDesc, rawAspect) {
    try {
      const media = buildSafeMediaSource(rawVideoId);
      if (media.type === 'error' || !media.src) {
        console.warn('Media source rejected due to security policy or invalid identifier:', rawVideoId);
        return;
      }

      const cleanTitle = sanitizePlainText(rawTitle) || 'Projeto Audiovisual';
      const cleanDesc = sanitizePlainText(rawDesc) || 'Edição audiovisual e storytelling por Vagner Santos.';
      const isVertical = String(rawAspect).toLowerCase() === 'vertical';

      // Safe DOM CSS class manipulation
      if (modalDialog) {
        modalDialog.classList.remove('modal-horizontal', 'modal-vertical');
        modalDialog.classList.add(isVertical ? 'modal-vertical' : 'modal-horizontal');
      }

      // Safe text node assignment
      if (modalTitle) modalTitle.textContent = cleanTitle;
      if (modalDesc) modalDesc.textContent = cleanDesc;

      // Safe Programmatic DOM Construction
      if (modalPlayerContainer) {
        // Clear any previous players safely
        while (modalPlayerContainer.firstChild) {
          modalPlayerContainer.removeChild(modalPlayerContainer.firstChild);
        }

        if (media.type === 'video') {
          const videoElement = document.createElement('video');
          videoElement.controls = true;
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.preload = 'auto';
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'contain';
          videoElement.style.backgroundColor = '#000';

          const sourceElement = document.createElement('source');
          sourceElement.src = media.src;
          sourceElement.type = media.src.endsWith('.webm') ? 'video/webm' : 'video/mp4';

          videoElement.appendChild(sourceElement);
          modalPlayerContainer.appendChild(videoElement);
        } else if (media.type === 'iframe') {
          const iframeElement = document.createElement('iframe');
          iframeElement.src = media.src;
          iframeElement.title = cleanTitle;
          iframeElement.setAttribute('frameborder', '0');
          iframeElement.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
          iframeElement.setAttribute('allowfullscreen', '');
          iframeElement.setAttribute('loading', 'lazy');
          iframeElement.style.width = '100%';
          iframeElement.style.height = '100%';
          iframeElement.style.border = 'none';

          modalPlayerContainer.appendChild(iframeElement);
        }
      }

      if (videoModal) {
        videoModal.classList.add('active');
        videoModal.setAttribute('aria-hidden', 'false');
      }
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error('Failed to open video modal safely:', err);
    }
  }

  function closeVideoModal() {
    try {
      if (videoModal) {
        videoModal.classList.remove('active');
        videoModal.setAttribute('aria-hidden', 'true');
      }
      document.body.style.overflow = '';

      // Immediately clear player content to stop playback and prevent memory leaks
      setTimeout(() => {
        if (modalPlayerContainer) {
          while (modalPlayerContainer.firstChild) {
            modalPlayerContainer.removeChild(modalPlayerContainer.firstChild);
          }
        }
      }, 250);
    } catch (err) {
      console.error('Error closing video modal:', err);
    }
  }

  // Trigger from Project Cards buttons
  document.querySelectorAll('.play-trigger-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const videoId = btn.getAttribute('data-video-id');
      const title = btn.getAttribute('data-title');
      const desc = btn.getAttribute('data-desc');
      const aspect = btn.getAttribute('data-aspect') || 'horizontal';
      openVideoModal(videoId, title, desc, aspect);
    });
  });

  // Trigger when clicking anywhere on the project card
  projectCards.forEach(card => {
    card.addEventListener('click', () => {
      const triggerBtn = card.querySelector('.play-trigger-btn');
      if (triggerBtn) {
        triggerBtn.click();
      }
    });
  });

  // Trigger from Reels Highlight Cards
  document.querySelectorAll('.reel-card').forEach(reel => {
    reel.addEventListener('click', () => {
      const videoId = reel.getAttribute('data-video-id');
      const title = reel.getAttribute('data-title');
      const aspect = reel.getAttribute('data-aspect') || 'vertical';
      openVideoModal(videoId, title, 'Reel / Short em formato vertical 9:16 com edição de alta retenção.', aspect);
    });
  });

  // Close handlers
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeVideoModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeVideoModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal && videoModal.classList.contains('active')) {
      closeVideoModal();
    }
  });

  console.log('🎬 Portfólio Vagner Santos (Vagote) inicializado com segurança.');
});
