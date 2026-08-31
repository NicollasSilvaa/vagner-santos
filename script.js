/**
 * VAGNER SANTOS (VAGOTE) - INTERACTIVE SCRIPTS
 * Video Modal, Dynamic Category Filtering, Navigation & Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
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
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      mobileToggle.classList.toggle('active');
    });

    // Close menu when clicking nav links
    document.querySelectorAll('.nav-link, .nav-cta-btn').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.classList.remove('active');
      });
    });
  }

  /* ==========================================================================
     2. CATEGORY FILTERING SYSTEM
     ========================================================================== */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const cardCategories = card.getAttribute('data-category').split(' ');

        if (filterValue === 'all' || cardCategories.includes(filterValue)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  /* ==========================================================================
     3. VIDEO MODAL / LIGHTBOX
     ========================================================================== */
  function openVideoModal(videoId, title, desc, aspect) {
    if (!videoId) return;

    // Reset classes
    modalDialog.classList.remove('modal-horizontal', 'modal-vertical');
    
    if (aspect === 'vertical') {
      modalDialog.classList.add('modal-vertical');
    } else {
      modalDialog.classList.add('modal-horizontal');
    }

    // Set Text Info
    modalTitle.textContent = title || 'Projeto de Vídeo';
    modalDesc.textContent = desc || 'Edição audiovisual e storytelling por Vagner Santos.';

    // Inject iframe safely with official Adobe CCV Player
    modalPlayerContainer.innerHTML = `
      <iframe 
        src="https://www-ccv.adobe.io/v1/player/ccv/${videoId}/embed?bgcolor=%2308080a&lazyLoading=false&api_key=BehancePro2View" 
        title="${title}" 
        frameborder="0" 
        allow="autoplay; fullscreen; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;

    videoModal.classList.add('active');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeVideoModal() {
    videoModal.classList.remove('active');
    videoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Clear iframe to immediately stop audio/video playback
    setTimeout(() => {
      modalPlayerContainer.innerHTML = '';
    }, 300);
  }

  // Trigger from Project Cards
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

  // Also trigger when clicking the whole project card
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
    if (e.key === 'Escape' && videoModal.classList.contains('active')) {
      closeVideoModal();
    }
  });

  console.log('🎬 Portfólio Vagner Santos (Vagote) inicializado com sucesso.');
});
