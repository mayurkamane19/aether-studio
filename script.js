/**
 * AETHER STUDIO — CREATIVE AGENCY PORTFOLIO ENGINE
 * 4 Completed Master Case Studies (AURA MONOLITH™, NOVA COFFEE™, LUXE INTERIORS™, NEURA AI™)
 * Production Engineering: Keyboard Shortcuts, Deep Link Routing, Search, Toast Engine
 */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================
     1. CINEMATIC PRELOADER WITH FAIL-SAFE
     ========================================== */
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderCounter = document.getElementById('preloader-counter');

  let preloaderHidden = false;

  function dismissPreloader() {
    if (preloaderHidden || !preloader) return;
    preloaderHidden = true;

    if (window.gsap && !prefersReducedMotion) {
      gsap.to(preloader, {
        yPercent: -100,
        duration: 0.8,
        ease: "power4.inOut",
        onComplete: () => {
          preloader.style.display = 'none';
          initHeroAnimations();
        }
      });
    } else {
      preloader.style.display = 'none';
      initHeroAnimations();
    }
  }

  if (preloader && preloaderBar && preloaderCounter && !prefersReducedMotion) {
    let count = 0;
    const interval = setInterval(() => {
      count += 15;
      if (count > 100) count = 100;
      preloaderBar.style.width = `${count}%`;
      preloaderCounter.textContent = `${count}%`;

      if (count === 100) {
        clearInterval(interval);
        setTimeout(dismissPreloader, 150);
      }
    }, 30);

    setTimeout(dismissPreloader, 1200);
  } else {
    dismissPreloader();
  }

  /* ==========================================
     2. LENIS INERTIAL SMOOTH SCROLL
     ========================================== */
  let lenis;
  if (window.Lenis && !prefersReducedMotion) {
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
      });

      function raf(time) {
        if (lenis) lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          if (lenis) lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }
    } catch (e) {
      console.warn("Lenis skipped:", e);
    }
  }

  /* ==========================================
     3. HERO CAROUSEL ROTATING 4 MASTER PROJECTS
     ========================================== */
  const slides = document.querySelectorAll('.showcase-slide');
  const dots = document.querySelectorAll('.carousel-indicators .dot');
  let currentSlide = 0;
  let carouselTimer;

  function goToSlide(index) {
    if (!slides.length) return;
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    currentSlide = (index + slides.length) % slides.length;
    if (slides[currentSlide]) slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
  }

  function startCarousel() {
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 4000);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      clearInterval(carouselTimer);
      const target = parseInt(dot.getAttribute('data-slide-target'));
      goToSlide(target);
      startCarousel();
    });
  });

  if (slides.length > 0) {
    startCarousel();
  }

  /* ==========================================
     4. HERO & SCROLLTRIGGER MOTION
     ========================================== */
  function initHeroAnimations() {
    if (!window.gsap || prefersReducedMotion) return;

    try {
      const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      heroTl
        .from('.gsap-hero-reveal .status-badge', { opacity: 0, filter: 'blur(8px)', y: 20, duration: 0.8 })
        .from('.gsap-hero-reveal .hero-title', { opacity: 0, filter: 'blur(10px)', y: 30, duration: 1.0 }, '-=0.5')
        .from('.gsap-hero-reveal .hero-description', { opacity: 0, filter: 'blur(8px)', y: 20, duration: 0.9 }, '-=0.7')
        .from('.gsap-hero-reveal .service-chips-wrapper', { opacity: 0, y: 15, duration: 0.8 }, '-=0.6')
        .from('.gsap-hero-reveal .hero-cta-group', { opacity: 0, y: 20, duration: 0.8 }, '-=0.6')
        .from('.gsap-hero-reveal .hero-metrics', { opacity: 0, y: 20, duration: 0.8 }, '-=0.6')
        .from('.hero-visual', { opacity: 0, filter: 'blur(12px)', scale: 0.96, duration: 1.2 }, '-=1.0');

      initScrollTriggers();
    } catch (e) {
      console.warn("GSAP hero animation skipped:", e);
    }
  }

  function initScrollTriggers() {
    if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) return;

    try {
      gsap.utils.toArray('.gsap-scroll-header').forEach(header => {
        gsap.from(header, {
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
            once: true
          },
          opacity: 0,
          filter: 'blur(10px)',
          y: 35,
          duration: 1.0,
          ease: 'power4.out'
        });
      });

      gsap.utils.toArray('.gsap-scroll-stagger').forEach(grid => {
        const cards = grid.children;
        gsap.from(cards, {
          scrollTrigger: {
            trigger: grid,
            start: 'top 80%',
            once: true
          },
          opacity: 0,
          filter: 'blur(8px)',
          y: 40,
          stagger: 0.12,
          duration: 1.0,
          ease: 'power4.out'
        });
      });

      gsap.utils.toArray('.count-up').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        ScrollTrigger.create({
          trigger: counter,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(counter, {
              innerText: target,
              duration: 1.8,
              snap: { innerText: 1 },
              ease: 'power3.out'
            });
          }
        });
      });
    } catch (e) {
      console.warn("ScrollTrigger skipped:", e);
    }
  }

  /* ==========================================
     5. MASTER FEATURED CASE STUDIES DATA
     ========================================== */
  const projectsData = [
    {
      id: "aura-monolith",
      title: "AURA MONOLITH™",
      category: "branding",
      categoryName: "Luxury Branding & Packaging",
      badge: "Master Case Study • Luxury Branding",
      img: "assets/aura_logo_branding.jpg",
      year: "2026",
      role: "Creative Direction & Brand System",
      tools: "Figma • Midjourney v6 • Blender • Illustrator",
      services: ["Brand Strategy", "Logo Construction Grid", "Gold Foil Packaging", "Spatial Intelligence"],
      deliverables: ["Brand Manual PDF", "3D Bottle Renders", "Stationery Suite", "Retail Environment Specs"],
      desc: "Complete visual identity and luxury packaging system for an international spatial computing and architectural technology brand.",
      client: "AURA MONOLITH™ Global Holdings",
      problem: "Traditional smart home technology relies on glossy plastics and noisy screens that fail to command luxury prestige.",
      solution: "Forged a monolithic brand identity encased in raw natural materials (Nero Marquina marble, champagne gold foil, smoked oak).",
      palette: ["#08090d", "#d4af37", "#1f2430", "#f8fafc"],
      results: "Published in Behance Featured & Architectural Digest",
      review: '"Surgical precision in gold foil hot stamping and spatial grid typography."'
    },
    {
      id: "nova-coffee",
      title: "NOVA COFFEE™",
      category: "packaging",
      categoryName: "Specialty Coffee & Retail",
      badge: "Master Case Study • Coffee & Retail",
      img: "assets/nova_coffee_brand_identity_board.jpg",
      year: "2026",
      role: "Brand Identity & Café Architecture",
      tools: "Blender 3D • Figma • Photoshop • Lightroom",
      services: ["Specialty Coffee Branding", "Packaging Bags & Tins", "Flagship Café Architecture", "Digital Ecosystem"],
      deliverables: ["Coffee Bag Suite (250g/500g/1kg)", "Café Interior Specs", "E-Commerce Web App", "Mobile Ordering Flow"],
      desc: "Modern Scandinavian and Japanese minimalist specialty coffee brand identity, retail experience, and digital subscription app.",
      client: "NOVA COFFEE Roasters (Nordic & Japan)",
      problem: "Commoditized specialty coffee branding lacking cohesive retail architecture and digital subscription integration.",
      solution: "Engineered a warm cream, travertine beige, and espresso brown visual ecosystem inspired by Blue Bottle & Kinfolk.",
      palette: ["#f5f2eb", "#3d2b1f", "#556b2f", "#1c1c1c"],
      results: "International Coffee Festival Design Winner",
      review: '"Unforgettable Nordic warmth meeting Japanese minimalist café architecture."'
    },
    {
      id: "luxe-interiors",
      title: "LUXE INTERIORS™",
      category: "interior",
      categoryName: "Architectural Visualization",
      badge: "Master Case Study • Interiors",
      img: "assets/luxe_interiors_brand_identity_board.jpg",
      year: "2026",
      role: "Interior Architecture & 8K Visuals",
      tools: "Blender 3D • Unreal Engine 5 • Corona Render • Photoshop",
      services: ["Luxury Interior Design", "8K Archviz Renders", "Material Palette Library", "Hospitality Suites"],
      deliverables: ["Living Room Collection", "Kitchen & Dining Suite", "Master Bedroom Renders", "Villa Walkthrough Video"],
      desc: "Japandi and Organic Modern high-end interior architecture visualization studio for luxury residential and hospitality developments.",
      client: "LUXE INTERIORS Architecture Studio",
      problem: "Off-plan luxury real estate developers struggling to pre-sell multi-million dollar villas prior to construction.",
      solution: "Created photorealistic 8K architectural walkthrough renders with realistic chiaroscuro lighting and travertine specs.",
      palette: ["#f4f0ea", "#d8cdb8", "#4a3b32", "#1f1f1f"],
      results: "Featured in Architectural Digest & Dezeen",
      review: '"Photorealistic spatial visualization setting new global benchmarks for real estate architecture."'
    },
    {
      id: "neura-ai",
      title: "NEURA AI™",
      category: "uiux",
      categoryName: "Enterprise AI SaaS Platform",
      badge: "Master Case Study • Enterprise AI",
      img: "assets/neura_ai_brand_identity_board.jpg",
      year: "2026",
      role: "Product Design & Enterprise UI/UX",
      tools: "Figma • React • TailwindCSS • GSAP • Framer Motion",
      services: ["Enterprise Design System", "AI SaaS Dashboard", "Multi-Agent Workspace", "iOS & Mobile App"],
      deliverables: ["Component Tokens Library", "Web Marketing Platform", "Mobile App UI", "Launch Campaign Ads"],
      desc: "Enterprise AI software platform, multi-agent workspace, and analytics dashboard engineered for Fortune 500 product teams.",
      client: "NEURA AI Platform Corp",
      problem: "Complex artificial intelligence workflows overwhelming enterprise users with opaque controls.",
      solution: "Designed a dark glassmorphic interface with intuitive multi-agent canvas, prompt playground, and real-time token metrics.",
      palette: ["#0b0f19", "#2563eb", "#8b5cf6", "#f8fafc"],
      results: "+280% User Engagement in Beta Handoff",
      review: '"Apple and Linear-grade dark mode UI design system built for scalable AI platforms."'
    }
  ];

  let currentOpenProjectIndex = 0;
  const portfolioGrid = document.getElementById('portfolio-grid');

  function renderPortfolio(filter = 'all') {
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = '';

    let filtered = projectsData;
    if (filter !== 'all') {
      filtered = projectsData.filter(p => p.category === filter);
    }

    filtered.forEach(project => {
      const card = document.createElement('div');
      card.className = `project-card ${project.category === 'branding' || project.category === 'interior' ? 'masonry-tall' : ''}`;
      card.innerHTML = `
        <div class="project-img-wrapper">
          <img src="${project.img}" alt="${project.title}" loading="lazy">
          <span class="project-badge">${project.badge}</span>
        </div>
        <div class="project-info">
          <h3>${project.title}</h3>
          <p>${project.desc}</p>
          <div class="project-meta">
            <span>Year: ${project.year} • ${project.categoryName}</span>
            <span class="project-view-btn">View Case Study <i data-lucide="arrow-right"></i></span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openProjectModal(project));
      portfolioGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();

    if (window.gsap && !prefersReducedMotion) {
      gsap.from('.portfolio-masonry-grid .project-card', {
        opacity: 0,
        filter: 'blur(8px)',
        y: 30,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power4.out'
      });
    }
  }

  renderPortfolio('all');

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPortfolio(btn.getAttribute('data-filter'));
    });
  });

  /* ==========================================
     6. FULLSCREEN CASE STUDY MODAL & ROUTING
     ========================================== */
  const projectModal = document.getElementById('project-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const modalContainer = document.getElementById('modal-body-container');

  window.openProjectById = function(id) {
    const project = projectsData.find(p => p.id === id);
    if (project) openProjectModal(project);
  };

  function openProjectModal(project) {
    if (!projectModal || !modalContainer) return;
    
    currentOpenProjectIndex = projectsData.findIndex(p => p.id === project.id);
    const prevProject = projectsData[(currentOpenProjectIndex - 1 + projectsData.length) % projectsData.length];
    const nextProject = projectsData[(currentOpenProjectIndex + 1) % projectsData.length];

    // Set location hash for direct sharing
    history.replaceState(null, null, `#${project.id}`);

    modalContainer.innerHTML = `
      <!-- CASE STUDY HEADER -->
      <div style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="color:var(--accent-purple); font-weight:700; font-size:0.85rem; text-transform:uppercase;">${project.badge}</span>
          <span style="color:var(--text-muted); font-size:0.85rem;">Year: ${project.year} • Timeline: ${project.timeline || '4 - 6 Weeks'}</span>
        </div>
        <h2 style="font-size:2.4rem; margin:4px 0;">${project.title}</h2>
        <p style="color:var(--text-secondary); font-size:1.1rem;">${project.desc}</p>
      </div>

      <!-- MAIN HERO IMAGE -->
      <img src="${project.img}" alt="${project.title}" style="width:100%; height:440px; object-fit:cover; border-radius:16px; margin-bottom:24px; box-shadow:0 16px 40px rgba(0,0,0,0.5);">

      <!-- METADATA GRID: ROLE, TOOLS, DELIVERABLES, TIMELINE -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:24px;">
        <div class="glass-card" style="padding:16px;">
          <strong style="color:var(--accent-purple); display:block; margin-bottom:4px; font-size:0.85rem;">ROLE & LEADERSHIP</strong>
          <p style="font-size:0.9rem; color:var(--text-primary); margin:0;">${project.role}</p>
        </div>
        <div class="glass-card" style="padding:16px;">
          <strong style="color:var(--accent-blue); display:block; margin-bottom:4px; font-size:0.85rem;">TOOLS USED</strong>
          <p style="font-size:0.9rem; color:var(--text-primary); margin:0;">${project.tools}</p>
        </div>
        <div class="glass-card" style="padding:16px;">
          <strong style="color:var(--accent-green); display:block; margin-bottom:4px; font-size:0.85rem;">DELIVERABLES</strong>
          <p style="font-size:0.88rem; color:var(--text-primary); margin:0;">${project.deliverables.join(' • ')}</p>
        </div>
      </div>

      <!-- PROJECT OVERVIEW & CLIENT GOAL -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
        <div class="glass-card" style="padding:20px;">
          <h4 style="color:var(--accent-purple); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="target" style="width:18px;"></i> Client Commercial Goal
          </h4>
          <p style="font-size:0.92rem; color:var(--text-secondary); line-height:1.6; margin:0;">${project.clientGoal || project.desc}</p>
        </div>

        <div class="glass-card" style="padding:20px;">
          <h4 style="color:var(--accent-blue); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="alert-circle" style="width:18px;"></i> Problem Statement
          </h4>
          <p style="font-size:0.92rem; color:var(--text-secondary); line-height:1.6; margin:0;">${project.problem}</p>
        </div>
      </div>

      <!-- RESEARCH & DESIGN STRATEGY -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
        <div class="glass-card" style="padding:20px;">
          <h4 style="color:var(--accent-purple); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="search" style="width:18px;"></i> Research & Market Analysis
          </h4>
          <p style="font-size:0.92rem; color:var(--text-secondary); line-height:1.6; margin:0;">${project.research || 'Audited top global competitors to establish high-contrast dark themes, spatial grids, and monolithic luxury benchmarks.'}</p>
        </div>

        <div class="glass-card" style="padding:20px;">
          <h4 style="color:var(--accent-green); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="compass" style="width:18px;"></i> Design Strategy & Solution
          </h4>
          <p style="font-size:0.92rem; color:var(--text-secondary); line-height:1.6; margin:0;">${project.solution}</p>
        </div>
      </div>

      <!-- CREATIVE PROCESS STAGES -->
      <div class="glass-card" style="padding:20px; margin-bottom:24px;">
        <h4 style="color:var(--text-primary); margin-bottom:12px;">Creative Process & Execution</h4>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px;">
          <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; font-size:0.82rem;">
            <strong style="color:var(--accent-purple); display:block;">1. DISCOVERY</strong>
            <span style="color:var(--text-muted);">Research & Wireframes</span>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; font-size:0.82rem;">
            <strong style="color:var(--accent-blue); display:block;">2. PROTOTYPE</strong>
            <span style="color:var(--text-muted);">Visual Systems & Tokening</span>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; font-size:0.82rem;">
            <strong style="color:var(--accent-purple); display:block;">3. RENDERING</strong>
            <span style="color:var(--text-muted);">8K Renders & UI Motion</span>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; font-size:0.82rem;">
            <strong style="color:var(--accent-green); display:block;">4. HANDOFF</strong>
            <span style="color:var(--text-muted);">Code & Production Files</span>
          </div>
        </div>
      </div>

      <!-- FINAL OUTCOME & KEY RESULTS -->
      <div style="background:var(--surface-glass); padding:20px; border-radius:12px; margin-bottom:24px; border:1px solid var(--border-glass);">
        <strong style="color:var(--accent-green); font-size:1.1rem; display:block; margin-bottom:4px;">Final Outcome & Key Results: ${project.results}</strong>
        <p style="font-style:italic; font-size:0.92rem; color:var(--text-secondary); margin:0;">${project.review}</p>
      </div>

      <!-- COLOR PALETTE & SHARE LINK -->
      <div style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <h4 style="margin-bottom:8px; font-size:0.9rem;">Color Architecture:</h4>
          <div style="display:flex; gap:12px;">
            ${project.palette.map(hex => `
              <div onclick="copyHex('${hex}')" style="background:${hex}; width:36px; height:36px; border-radius:50%; border:2px solid rgba(255,255,255,0.2); cursor:pointer;" title="Click to copy ${hex}"></div>
            `).join('')}
          </div>
        </div>
        <button class="btn btn-glass btn-sm" onclick="copyProjectLink('${project.id}')"><i data-lucide="share-2"></i> Share Case Study Link</button>
      </div>

      <!-- NAVIGATION FOOTER CONTROLS: PREVIOUS, BACK TO PORTFOLIO, NEXT -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-glass); padding-top:20px; margin-top:24px; flex-wrap:wrap; gap:12px;">
        <button class="btn btn-glass btn-sm" onclick="openProjectById('${prevProject.id}')"><i data-lucide="arrow-left"></i> Previous Project: ${prevProject.title}</button>
        <button class="btn btn-gradient btn-sm" onclick="document.getElementById('project-modal').style.display='none'; location.href='#portfolio';">Back to Portfolio Grid</button>
        <button class="btn btn-glass btn-sm" onclick="openProjectById('${nextProject.id}')">Next Project: ${nextProject.title} <i data-lucide="arrow-right"></i></button>
      </div>
    `;

    projectModal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      projectModal.style.display = 'none';
      history.replaceState(null, null, ' ');
    });
  }

  window.copyProjectLink = function(id) {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    showToast(`Copied case study link: ${url}`);
  };

  // Check URL Hash on Load
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const targetProject = projectsData.find(p => p.id === hash);
    if (targetProject) openProjectModal(targetProject);
  }

  /* ==========================================
     7. KEYBOARD SHORTCUTS ENGINE
     ========================================== */
  document.addEventListener('keydown', (e) => {
    // Esc closes all active modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop, .search-modal-backdrop').forEach(m => m.style.display = 'none');
      history.replaceState(null, null, ' ');
    }

    // Ctrl/Cmd + K or '/' opens Search Modal
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      const searchModal = document.getElementById('search-modal');
      const searchInput = document.getElementById('global-search-input');
      if (searchModal) {
        searchModal.style.display = 'flex';
        if (searchInput) searchInput.focus();
      }
    }

    // Left / Right arrows navigate projects inside open modal
    if (projectModal && projectModal.style.display === 'flex') {
      if (e.key === 'ArrowLeft') {
        const prev = projectsData[(currentOpenProjectIndex - 1 + projectsData.length) % projectsData.length];
        openProjectModal(prev);
      } else if (e.key === 'ArrowRight') {
        const next = projectsData[(currentOpenProjectIndex + 1) % projectsData.length];
        openProjectModal(next);
      }
    }
  });

  /* Lead Submission Form Handler */
  window.handleLeadSubmission = function(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-lead-btn');
    const msg = document.getElementById('form-status-msg');
    
    if (!btn) return;
    
    // Loading State
    btn.disabled = true;
    btn.innerHTML = '<span>Processing Inquiry...</span> <i data-lucide="loader"></i>';
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      // Success State
      btn.disabled = false;
      btn.innerHTML = '<span>Inquiry Submitted Successfully!</span> <i data-lucide="check-circle"></i>';
      if (window.lucide) lucide.createIcons();

      if (msg) {
        msg.style.display = 'block';
        msg.style.background = 'rgba(16, 185, 129, 0.15)';
        msg.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        msg.style.color = '#34d399';
        msg.innerHTML = '✓ Thank you! Aether Studio has received your inquiry. We will respond within 4 hours.';
      }

      showToast('Lead submitted! Proposal & quote email dispatched.');

      setTimeout(() => {
        btn.innerHTML = '<span>Get a Quote & Official Proposal</span> <i data-lucide="send"></i>';
        if (window.lucide) lucide.createIcons();
      }, 5000);
    }, 1200);
  };

  /* ==========================================
     8. GLOBAL SEARCH SYSTEM
     ========================================== */
  const globalSearchInput = document.getElementById('global-search-input');
  const searchResultsList = document.getElementById('search-results-list');

  if (globalSearchInput && searchResultsList) {
    globalSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        searchResultsList.innerHTML = '<p class="search-hint">Type keywords like "AURA MONOLITH", "NOVA COFFEE", "LUXE INTERIORS", "NEURA AI"...</p>';
        return;
      }

      const matches = projectsData.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.desc.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query) ||
        p.services.some(s => s.toLowerCase().includes(query))
      );

      if (matches.length === 0) {
        searchResultsList.innerHTML = `<p class="search-hint">No case studies found matching "${query}".</p>`;
      } else {
        searchResultsList.innerHTML = matches.map(m => `
          <div class="search-result-item glass-card" onclick="document.getElementById('search-modal').style.display='none'; openProjectById('${m.id}')" style="padding:12px; margin-bottom:8px; cursor:pointer; display:flex; gap:12px; align-items:center;">
            <img src="${m.img}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
            <div>
              <strong style="color:var(--text-primary); display:block;">${m.title}</strong>
              <small style="color:var(--text-muted);">${m.categoryName}</small>
            </div>
          </div>
        `).join('');
      }
    });
  }

  /* ==========================================
     9. RESOURCE CENTER TABS & UTILS
     ========================================== */
  window.switchResTab = function(tabName) {
    document.querySelectorAll('.res-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.res-pane').forEach(p => p.style.display = 'none');

    if (tabName === 'prompts') {
      document.querySelectorAll('.res-tab-btn')[0].classList.add('active');
      document.getElementById('pane-prompts').style.display = 'block';
    } else if (tabName === 'palettes') {
      document.querySelectorAll('.res-tab-btn')[1].classList.add('active');
      document.getElementById('pane-palettes').style.display = 'block';
    } else if (tabName === 'templates') {
      document.querySelectorAll('.res-tab-btn')[2].classList.add('active');
      document.getElementById('pane-templates').style.display = 'block';
    }
  };

  window.copyPrompt = function(btn) {
    const code = btn.parentElement.querySelector('code').innerText;
    navigator.clipboard.writeText(code);
    showToast("AI Prompt recipe copied to clipboard!");
  };

  window.showToast = function(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  window.copyHex = function(hex) {
    navigator.clipboard.writeText(hex);
    showToast(`Copied color token ${hex} to clipboard!`);
  };

  /* ==========================================
     10. WIZARD & CALENDLY UTILS
     ========================================== */
  window.nextWizStep = function(stepNum) {
    const indicators = document.querySelectorAll('.wiz-step-indicator');
    const formSteps = document.querySelectorAll('.wizard-form-step');

    indicators.forEach(ind => {
      const step = parseInt(ind.getAttribute('data-step'));
      if (step === stepNum) ind.classList.add('active');
      else ind.classList.remove('active');
    });

    formSteps.forEach(fs => {
      const step = parseInt(fs.getAttribute('data-form-step'));
      if (step === stepNum) fs.classList.add('active');
      else fs.classList.remove('active');
    });
  };

  const calDaysContainer = document.getElementById('calendar-days');
  if (calDaysContainer) {
    let daysHTML = '';
    for (let d = 1; d <= 31; d++) {
      const activeClass = d === 10 ? 'day-btn active' : 'day-btn';
      daysHTML += `<button class="${activeClass}" onclick="selectCalDate(this, ${d})">${d}</button>`;
    }
    calDaysContainer.innerHTML = daysHTML;
  }

  window.selectCalDate = function(btn, day) {
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('selected-date-label').textContent = `Aug ${day}, 2026`;
  };

  window.selectTimeSlot = function(btn, slot) {
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };

  window.confirmAppointment = function() {
    const name = document.getElementById('booking-name').value;
    if (!name) { showToast("Please enter your name."); return; }
    showToast(`Consultation confirmed for ${name}!`);
  };

  const searchModal = document.getElementById('search-modal');
  const searchTrigger = document.getElementById('search-trigger-btn');
  const closeSearch = document.getElementById('close-search');

  if (searchTrigger && searchModal && closeSearch) {
    searchTrigger.addEventListener('click', () => searchModal.style.display = 'flex');
    closeSearch.addEventListener('click', () => searchModal.style.display = 'none');
  }

  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      showToast(`Switched to ${newTheme.toUpperCase()} mode`);
    });
  }
});
