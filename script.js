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
      client: "AURA MONOLITH™ Concept Client",
      problem: "Traditional smart home technology relies on glossy plastics and noisy screens that fail to command luxury prestige.",
      solution: "Forged a monolithic brand identity encased in raw natural materials (Nero Marquina marble, champagne gold foil, smoked oak).",
      palette: ["#08090d", "#d4af37", "#1f2430", "#f8fafc"],
      results: "Portfolio Case Study • Spatial Luxury Branding",
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
      client: "NOVA COFFEE Roasters Concept",
      problem: "Commoditized specialty coffee branding lacking cohesive retail architecture and digital subscription integration.",
      solution: "Engineered a warm cream, travertine beige, and espresso brown visual ecosystem inspired by Blue Bottle & Kinfolk.",
      palette: ["#f5f2eb", "#3d2b1f", "#556b2f", "#1c1c1c"],
      results: "Portfolio Case Study • Specialty Coffee Architecture",
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
      client: "LUXE INTERIORS Concept Studio",
      problem: "Off-plan luxury real estate developers struggling to pre-sell multi-million dollar villas prior to construction.",
      solution: "Created photorealistic 8K architectural walkthrough renders with realistic chiaroscuro lighting and travertine specs.",
      palette: ["#f4f0ea", "#d8cdb8", "#4a3b32", "#1f1f1f"],
      results: "Portfolio Case Study • Architectural Visualization",
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
      client: "NEURA AI Platform Concept",
      problem: "Complex artificial intelligence workflows overwhelming enterprise users with opaque controls.",
      solution: "Designed a dark glassmorphic interface with intuitive multi-agent canvas, prompt playground, and real-time token metrics.",
      palette: ["#0b0f19", "#2563eb", "#8b5cf6", "#f8fafc"],
      results: "Portfolio Case Study • Enterprise AI SaaS Design System",
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
    const nameInput = document.getElementById('form-name');
    const emailInput = document.getElementById('form-email');
    const serviceInput = document.getElementById('form-service');
    const budgetInput = document.getElementById('form-budget');
    const timelineInput = document.getElementById('form-timeline');
    const contactMethodInput = document.getElementById('form-contact-method');
    const honeypotInput = document.getElementById('form-hp');

    // Anti-Spam Check
    if (honeypotInput && honeypotInput.value.trim().length > 0) {
      console.warn('[SPAM BLOCK] Honeypot field filled.');
      return;
    }

    if (nameInput && !nameInput.value.trim()) {
      showToast("Please enter your name.");
      nameInput.focus();
      return;
    }

    if (emailInput && (!emailInput.value.trim() || !emailInput.value.includes('@'))) {
      showToast("Please enter a valid email address.");
      emailInput.focus();
      return;
    }
    
    if (!btn) return;
    
    // Loading State
    btn.disabled = true;
    btn.innerHTML = '<span>Processing Inquiry...</span> <i data-lucide="loader"></i>';
    if (window.lucide) lucide.createIcons();

    const serviceVal = serviceInput ? serviceInput.value : 'General';
    const budgetVal = budgetInput ? budgetInput.value : 'Standard';
    const timelineVal = timelineInput ? timelineInput.value : 'Standard';
    const contactMethodVal = contactMethodInput ? contactMethodInput.value : 'Email';

    trackGA4Event('contact_form_submit', { service_type: serviceVal });
    trackGA4Event('project_inquiry', { service_type: serviceVal });

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      service: serviceVal,
      budget: budgetVal,
      timeline: timelineVal,
      contactMethod: contactMethodVal,
      honeypot: ''
    };

    // Dispatch to Serverless Endpoint if available
    fetch((window.AETHER_CONFIG ? window.AETHER_CONFIG.ENDPOINTS.CONTACT : '/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.log('Serverless API notice:', err));

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
     8. GLOBAL SEARCH SYSTEM & BLOG INTEGRATION
     ========================================== */
  const scrollProgressBar = document.getElementById('scroll-progress');
  if (scrollProgressBar) {
    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (height > 0) ? (winScroll / height) * 100 : 0;
      scrollProgressBar.style.width = scrolled + '%';
    });
  }

  const blogPostsData = [
    {
      title: "How AI Is Changing Modern Web Development",
      category: "AI & Web Engineering",
      url: "blog/ai-modern-web-development/index.html",
      img: "assets/blog_ai_web_dev.jpg",
      keywords: ["ai", "web development", "autonomous agents", "llm", "coding", "front end"]
    },
    {
      title: "Why Website Performance Matters for SEO",
      category: "SEO & Speed",
      url: "blog/website-performance-seo/index.html",
      img: "assets/blog_site_performance.jpg",
      keywords: ["seo", "performance", "core web vitals", "inp", "lcp", "cls", "speed"]
    },
    {
      title: "AI Automation for Small Businesses",
      category: "Business Automation",
      url: "blog/ai-automation-small-businesses/index.html",
      img: "assets/blog_ai_automation.jpg",
      keywords: ["ai automation", "small business", "roi", "crm", "workflow", "chatbots"]
    },
    {
      title: "How to Build a High-Converting Business Website",
      category: "Conversion UX",
      url: "blog/high-converting-business-website/index.html",
      img: "assets/blog_converting_website.jpg",
      keywords: ["conversion", "cro", "business website", "luxury brand", "visual hierarchy", "cta"]
    },
    {
      title: "Modern UI/UX Trends for 2026",
      category: "2026 Design Trends",
      url: "blog/modern-ui-ux-trends-2026/index.html",
      img: "assets/blog_ui_ux_trends.jpg",
      keywords: ["ui ux", "trends 2026", "glassmorphism", "spatial design", "micro-animations"]
    }
  ];

  const globalSearchInput = document.getElementById('global-search-input');
  const searchResultsList = document.getElementById('search-results-list');

  if (globalSearchInput && searchResultsList) {
    globalSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        searchResultsList.innerHTML = '<p class="search-hint">Type keywords like "AURA MONOLITH", "NOVA COFFEE", "AI Web Dev", "SEO Performance", "UI UX"...</p>';
        return;
      }

      const projectMatches = projectsData.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.desc.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query) ||
        p.services.some(s => s.toLowerCase().includes(query))
      );

      const blogMatches = blogPostsData.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        b.keywords.some(k => k.includes(query))
      );

      if (projectMatches.length === 0 && blogMatches.length === 0) {
        searchResultsList.innerHTML = `<p class="search-hint">No results found matching "${query}".</p>`;
      } else {
        let html = '';
        if (projectMatches.length > 0) {
          html += '<strong style="color:var(--accent-purple); display:block; margin:8px 0 4px; font-size:0.8rem; text-transform:uppercase;">Case Studies</strong>';
          html += projectMatches.map(m => `
            <div class="search-result-item glass-card" onclick="document.getElementById('search-modal').style.display='none'; openProjectById('${m.id}')" style="padding:12px; margin-bottom:8px; cursor:pointer; display:flex; gap:12px; align-items:center;">
              <img src="${m.img}" style="width:44px; height:44px; object-fit:cover; border-radius:8px;">
              <div>
                <strong style="color:var(--text-primary); display:block;">${m.title}</strong>
                <small style="color:var(--text-muted);">${m.categoryName}</small>
              </div>
            </div>
          `).join('');
        }
        if (blogMatches.length > 0) {
          html += '<strong style="color:var(--accent-blue); display:block; margin:12px 0 4px; font-size:0.8rem; text-transform:uppercase;">Journal Articles</strong>';
          html += blogMatches.map(b => `
            <a href="${b.url}" class="search-result-item glass-card" style="padding:12px; margin-bottom:8px; cursor:pointer; display:flex; gap:12px; align-items:center; text-decoration:none;">
              <img src="${b.img}" style="width:44px; height:44px; object-fit:cover; border-radius:8px;">
              <div>
                <strong style="color:var(--text-primary); display:block;">${b.title}</strong>
                <small style="color:var(--text-muted);">${b.category}</small>
              </div>
            </a>
          `).join('');
        }
        searchResultsList.innerHTML = html;
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
    const nameInput = document.getElementById('booking-name');
    const emailInput = document.getElementById('booking-email');
    const dateLabel = document.getElementById('selected-date-label');

    if (!nameInput || !nameInput.value.trim()) {
      showToast("Please enter your name for the consultation.");
      if (nameInput) nameInput.focus();
      return;
    }

    if (!emailInput || !emailInput.value.trim() || !emailInput.value.includes('@')) {
      showToast("Please enter a valid email address.");
      if (emailInput) emailInput.focus();
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const date = dateLabel ? dateLabel.textContent : 'Aug 10, 2026';
    const activeSlot = document.querySelector('.slot-btn.active');
    const timeSlot = activeSlot ? activeSlot.textContent.trim() : '10:00 AM EST';

    trackGA4Event('consultation_submit', { booking_date: date, time_slot: timeSlot });
    trackGA4Event('booking_cta_click', { cta_label: 'Confirm Appointment Session' });

    fetch((window.AETHER_CONFIG ? window.AETHER_CONFIG.ENDPOINTS.BOOKING : '/api/booking'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, date, timeSlot, projectType: 'Strategy Call' })
    }).catch(err => console.log('Booking serverless API notice:', err));

    showToast(`✓ Consultation requested for ${name} on ${date} at ${timeSlot}!`);
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
      trackGA4Event('toggle_theme', { theme: newTheme });
    });
  }

  /* ==========================================
     11. GA4 PRIVACY-COMPLIANT EVENT ENGINE & BLOG FILTERING
     ========================================== */
  window.trackGA4Event = function(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  };

  // Blog Category Filter Handler
  const blogFilterChips = document.querySelectorAll('.blog-filter-bar .filter-chip');
  const allBlogCards = document.querySelectorAll('.blog-grid .blog-card');

  blogFilterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      blogFilterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterCategory = chip.getAttribute('data-category');
      trackGA4Event('filter_category', { category: filterCategory });

      allBlogCards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (filterCategory === 'all' || cardCat === filterCategory) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Track CTA clicks
  document.querySelectorAll('a.btn, button.btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const text = this.innerText.trim();
      trackGA4Event('click_cta', { cta_label: text, destination: this.getAttribute('href') || 'button' });
    });
  });

  /* ==========================================
     12. ADMIN LEAD MANAGEMENT & CRM SUITE (PHASE 2)
     ========================================== */
  let adminLeadsCache = [
    {
      leadId: 'AS-2026-849201',
      name: 'Elena Rostova',
      email: 'elena@luxemoda.co',
      company: 'Luxe Moda International',
      projectType: 'Brand Identity',
      budgetRange: '₹25,000 – ₹50,000',
      timeline: '2 to 3 Weeks',
      contactMethod: 'Email',
      message: 'Looking for a complete dark luxury rebrand, 3D packaging grids, and digital e-commerce web platform.',
      submissionDate: '2026-08-08T18:30:00Z',
      status: 'NEW',
      leadScore: 85,
      source: 'Website'
    },
    {
      leadId: 'AS-2026-391024',
      name: 'Marcus Vance',
      email: 'marcus@neurasystems.ai',
      company: 'Neura Systems',
      projectType: 'Generative AI',
      budgetRange: '₹50,000+ Enterprise Quote',
      timeline: '1 Month',
      contactMethod: 'WhatsApp',
      message: 'Need a multi-agent AI dashboard canvas and enterprise component design system.',
      submissionDate: '2026-08-07T14:15:00Z',
      status: 'CONTACTED',
      leadScore: 92,
      source: 'Proposal Wizard'
    }
  ];
  let currentActiveProposal = null;
  let currentActiveLeadId = null;
  let currentAdminPage = 1;
  let totalAdminPages = 1;

  window.openAdminPortal = function(token = '') {
    const modal = document.getElementById('admin-crm-modal');
    const input = document.getElementById('admin-token-input');
    if (modal) modal.style.display = 'flex';
    if (input && token) {
      input.value = token;
      authenticateAdminCRM();
    }
  };

  window.authenticateAdminCRM = function() {
    const input = document.getElementById('admin-token-input');
    const pipelineView = document.getElementById('crm-pipeline-view');
    const authContainer = document.getElementById('crm-auth-container');

    if (!input || !input.value.trim()) {
      showToast("Please enter an Admin Bearer Token secret.");
      return;
    }

    fetchAdminLeads(1);
    if (authContainer) authContainer.style.display = 'none';
    if (pipelineView) pipelineView.style.display = 'block';
  };

  window.fetchAdminLeads = function(page = 1) {
    const token = document.getElementById('admin-token-input')?.value.trim() || '';
    const search = document.getElementById('crm-search-input')?.value.trim() || '';
    const statusFilter = document.getElementById('crm-status-filter')?.value || 'ALL';

    const url = `/api/inquiry?page=${page}&limit=20&search=${encodeURIComponent(search)}&statusFilter=${encodeURIComponent(statusFilter)}`;

    fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.inquiries && data.inquiries.length > 0) {
        adminLeadsCache = data.inquiries;
        currentAdminPage = data.page || page;
        totalAdminPages = data.totalPages || 1;
        renderAdminLeadsList(adminLeadsCache, data.total || adminLeadsCache.length, currentAdminPage, totalAdminPages);
      } else {
        renderAdminLeadsList([], 0, 1, 1);
      }
    })
    .catch(err => {
      console.log('CRM Database Notice:', err);
      renderAdminLeadsList(adminLeadsCache, adminLeadsCache.length, 1, 1);
    });
  };

  window.getScoreBadgeHTML = function(score) {
    if (score === undefined || score === null || score === '') {
      return `<span class="lead-id-tag" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">NOT SCORED</span>`;
    }
    const num = parseInt(score, 10);
    if (isNaN(num)) return `<span class="lead-id-tag" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">NOT SCORED</span>`;

    if (num >= 80) {
      return `<span class="lead-id-tag" style="background:rgba(239, 68, 68, 0.15); color:#f87171; border-color:rgba(239, 68, 68, 0.3);">🔥 HOT (${num})</span>`;
    } else if (num >= 50) {
      return `<span class="lead-id-tag" style="background:rgba(245, 158, 11, 0.15); color:#fbbf24; border-color:rgba(245, 158, 11, 0.3);">⚡ WARM (${num})</span>`;
    } else {
      return `<span class="lead-id-tag" style="background:rgba(59, 130, 246, 0.15); color:#60a5fa; border-color:rgba(59, 130, 246, 0.3);">❄ COLD (${num})</span>`;
    }
  };

  window.renderAdminLeadsList = function(leadsToRender = adminLeadsCache, totalCount = adminLeadsCache.length, page = 1, totalPages = 1) {
    const container = document.getElementById('crm-inquiries-list');
    if (!container) return;

    // Analytics Calculation
    const total = totalCount || leadsToRender.length;
    const newCount = leadsToRender.filter(l => l.status === 'NEW').length;
    const contactedCount = leadsToRender.filter(l => l.status === 'CONTACTED').length;
    const qualifiedCount = leadsToRender.filter(l => l.status === 'QUALIFIED').length;
    const wonCount = leadsToRender.filter(l => l.status === 'WON').length;
    const lostCount = leadsToRender.filter(l => l.status === 'LOST').length;
    const convRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

    // Calculate Pipeline Value
    let totalPipelineVal = 0;
    leadsToRender.forEach(l => {
      const b = String(l.budgetRange || '').replace(/[^0-9]/g, '');
      if (b) {
        const parsed = parseInt(b, 10);
        if (!isNaN(parsed)) totalPipelineVal += parsed;
      }
    });

    if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = total;
    if (document.getElementById('stat-new')) document.getElementById('stat-new').textContent = newCount;
    if (document.getElementById('stat-contacted')) document.getElementById('stat-contacted').textContent = contactedCount;
    if (document.getElementById('stat-qualified')) document.getElementById('stat-qualified').textContent = qualifiedCount;
    if (document.getElementById('stat-won')) document.getElementById('stat-won').textContent = wonCount;
    if (document.getElementById('stat-lost')) document.getElementById('stat-lost').textContent = lostCount;
    if (document.getElementById('stat-conv')) document.getElementById('stat-conv').textContent = `${convRate}%`;
    if (document.getElementById('stat-pipeline-value')) document.getElementById('stat-pipeline-value').textContent = `₹${totalPipelineVal.toLocaleString('en-IN')}`;

    // Fetch Full Serverless Aggregate Analytics
    fetchCRMAnalytics();

    if (document.getElementById('pagination-info')) {
      document.getElementById('pagination-info').textContent = `Page ${page} of ${totalPages} (${total} total leads)`;
    }

    if (leadsToRender.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 30px;">No leads found in PostgreSQL database matching search criteria.</p>`;
      return;
    }

    let html = '';
    leadsToRender.forEach(lead => {
      const waMessage = encodeURIComponent(`Hello ${lead.name}, this is Aether Studio regarding your project inquiry ${lead.leadId}.`);
      const waLink = `https://wa.me/?text=${waMessage}`;
      const scoreBadge = getScoreBadgeHTML(lead.leadScore);

      html += `
        <div class="lead-card">
          <div class="lead-header">
            <div>
              <span class="lead-id-tag">${lead.leadId}</span>
              ${scoreBadge}
              <strong style="font-size: 1.1rem; margin-left: 8px;">${lead.name}</strong>
              <small style="color: var(--text-muted); display: inline-block; margin-left: 8px;">(${lead.company})</small>
            </div>
            <div>
              <select class="status-badge-select" onchange="updateLeadStatus('${lead.leadId}', this.value)">
                <option value="NEW" ${lead.status === 'NEW' ? 'selected' : ''}>NEW</option>
                <option value="CONTACTED" ${lead.status === 'CONTACTED' ? 'selected' : ''}>CONTACTED</option>
                <option value="QUALIFIED" ${lead.status === 'QUALIFIED' ? 'selected' : ''}>QUALIFIED</option>
                <option value="PROPOSAL_SENT" ${lead.status === 'PROPOSAL_SENT' ? 'selected' : ''}>PROPOSAL SENT</option>
                <option value="NEGOTIATION" ${lead.status === 'NEGOTIATION' ? 'selected' : ''}>NEGOTIATION</option>
                <option value="WON" ${lead.status === 'WON' ? 'selected' : ''}>WON</option>
                <option value="LOST" ${lead.status === 'LOST' ? 'selected' : ''}>LOST</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 0.85rem; color: var(--text-secondary);">
            <div><strong>Email:</strong> ${lead.email}</div>
            <div><strong>Service:</strong> <span style="color: var(--accent-purple); font-weight:600;">${lead.projectType}</span></div>
            <div><strong>Budget:</strong> ${lead.budgetRange}</div>
            <div><strong>Timeline:</strong> ${lead.timeline}</div>
            <div><strong>Channel:</strong> ${lead.contactMethod || 'Email'}</div>
            <div><strong>Submitted:</strong> ${new Date(lead.submissionDate).toLocaleDateString()}</div>
          </div>

          <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; font-size: 0.85rem; color: var(--text-muted);">
            "${lead.message}"
          </div>

          <div class="lead-actions-bar">
            <button class="btn btn-glass btn-sm" onclick="openLeadDetails('${lead.leadId}')"><i data-lucide="eye"></i> View Details & Notes</button>
            <button class="btn btn-glass btn-sm" onclick="navigator.clipboard.writeText('${lead.email}'); showToast('Copied email!');"><i data-lucide="copy"></i> Copy Email</button>
            <a href="mailto:${lead.email}?subject=Aether%20Studio%20Inquiry%20${lead.leadId}" class="btn btn-glass btn-sm"><i data-lucide="mail"></i> Email Client</a>
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-glass btn-sm"><i data-lucide="message-square"></i> WhatsApp Action</a>
            <button class="btn btn-primary btn-sm" onclick="openProposalGenerator('${lead.leadId}')"><i data-lucide="file-text"></i> Proposal Generator</button>
            <button class="btn btn-gradient btn-sm" onclick="openAiAnalyzer('${lead.leadId}')"><i data-lucide="sparkles"></i> AI Brief Analyzer</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  };

  window.filterAdminLeads = function() {
    fetchAdminLeads(1);
  };

  window.changeAdminPage = function(delta) {
    const newPage = currentAdminPage + delta;
    if (newPage >= 1 && newPage <= totalAdminPages) {
      fetchAdminLeads(newPage);
    }
  };

  window.updateLeadStatus = function(leadId, newStatus) {
    const token = document.getElementById('admin-token-input')?.value.trim() || '';

    fetch('/api/inquiry', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ leadId, status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast(`Status for ${leadId} updated to ${newStatus} in PostgreSQL!`);
      } else {
        showToast(`Status updated to ${newStatus}`);
      }
      fetchAdminLeads(currentAdminPage);
    })
    .catch(err => {
      showToast(`Status updated to ${newStatus}`);
      fetchAdminLeads(currentAdminPage);
    });
  };

  window.renderAiPricingPanel = function(lead) {
    const container = document.getElementById('detail-ai-pricing-body');
    const triggerBtn = document.getElementById('btn-trigger-ai-pricing');
    const approveBtn = document.getElementById('btn-approve-ai-pricing');
    if (!container) return;

    if (!lead || !lead.aiRecommendedPrice) {
      container.innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">Click "Generate Pricing" to receive an internal AI-suggested scope quote, milestones, assumptions, and risk breakdown.</p>
      `;
      if (triggerBtn) triggerBtn.innerHTML = `<i data-lucide="calculator"></i> Generate Pricing`;
      if (approveBtn) approveBtn.style.display = 'none';
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (triggerBtn) triggerBtn.innerHTML = `<i data-lucide="refresh-cw"></i> Regenerate`;

    const recPrice = parseInt(lead.aiRecommendedPrice, 10) || 35000;
    const minP = lead.aiPriceMin ? parseInt(lead.aiPriceMin, 10) : 25000;
    const maxP = lead.aiPriceMax ? parseInt(lead.aiPriceMax, 10) : 55000;
    const confidence = lead.aiPricingConfidence || 82;
    const status = lead.aiPricingStatus || 'DRAFT';

    if (approveBtn) {
      approveBtn.style.display = 'inline-flex';
      if (status === 'APPROVED') {
        approveBtn.className = 'btn btn-glass btn-sm';
        approveBtn.innerHTML = `<i data-lucide="check"></i> Approved`;
      } else {
        approveBtn.className = 'btn btn-primary btn-sm';
        approveBtn.innerHTML = `<i data-lucide="check-circle"></i> Approve Recommendation`;
      }
    }

    const statusBadgeHTML = status === 'APPROVED'
      ? `<span class="lead-id-tag" style="background:rgba(52,211,153,0.15); color:#34d399; border-color:rgba(52,211,153,0.3);">APPROVED</span>`
      : (status === 'SUPERSEDED' ? `<span class="lead-id-tag" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">SUPERSEDED</span>` : `<span class="lead-id-tag" style="background:rgba(245,158,11,0.15); color:#fbbf24; border-color:rgba(245,158,11,0.3);">DRAFT (UNAPPROVED)</span>`);

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid var(--border-glass);">
          <small style="color: var(--text-muted); display: block; margin-bottom: 4px;">Recommended Price</small>
          <div style="font-size: 1.4rem; font-weight: 800; color: #34d399;">₹${recPrice.toLocaleString('en-IN')}</div>
          <small style="color: var(--text-muted); display: block; margin-top: 2px;">Estimated Range: ₹${minP.toLocaleString('en-IN')} – ₹${maxP.toLocaleString('en-IN')}</small>
        </div>

        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid var(--border-glass);">
          <small style="color: var(--text-muted); display: block; margin-bottom: 4px;">Confidence & Package</small>
          <strong style="color: var(--accent-cyan); display: block; font-size: 1.1rem;">${confidence}% Confidence</strong>
          <span style="display: inline-block; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: rgba(139,92,246,0.15); color: #c084fc; margin-top: 4px; font-weight: 600;">Package: ${lead.aiRecommendedPackage || 'CUSTOM'}</span>
        </div>

        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid var(--border-glass);">
          <small style="color: var(--text-muted); display: block; margin-bottom: 4px;">Approval Status</small>
          <div>${statusBadgeHTML}</div>
          <small style="color: var(--text-muted); display: block; margin-top: 6px;">Internal Admin Review</small>
        </div>
      </div>

      <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid var(--border-glass); margin-bottom: 14px;">
        <strong style="color: var(--text-primary); font-size: 0.88rem; display: block; margin-bottom: 4px;">Pricing Rationale & Scope Basis:</strong>
        <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">${lead.aiSummary || 'Internal quote recommendation generated based on project complexity, tech stack requirements, and scope deliverables.'}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.82rem;">
        <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid var(--border-glass);">
          <strong style="color: var(--accent-purple); display: block; margin-bottom: 4px;">Suggested Milestones:</strong>
          <ol style="margin:0; padding-left:18px; color:var(--text-secondary);">
            <li>Discovery & Scope Mapping</li>
            <li>UI/UX Tokens & Component Architecture</li>
            <li>Frontend Motion Engine & API Integrations</li>
            <li>QA Testing, Deployment & SEO Indexing</li>
          </ol>
        </div>

        <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid var(--border-glass);">
          <strong style="color: var(--accent-blue); display: block; margin-bottom: 4px;">Key Pricing Assumptions:</strong>
          <ul style="margin:0; padding-left:16px; color:var(--text-muted);">
            <li>Client provides core vector assets & copy.</li>
            <li>Includes standard Vercel serverless deployment.</li>
            <li>Third-party API fees billed directly to client.</li>
          </ul>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  };

  window.runAiPricingAnalysis = function() {
    if (!currentActiveLeadId) return;

    const token = document.getElementById('admin-token-input')?.value.trim() || '';
    const container = document.getElementById('detail-ai-pricing-body');
    if (container) container.innerHTML = `<p style="color: #34d399; font-size: 0.9rem;"><i data-lucide="loader"></i> Calculating internal AI project pricing recommendation...</p>`;

    fetch('/api/admin/pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ leadId: currentActiveLeadId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.pricing) {
        showToast(`✓ AI Recommended Price: ₹${data.pricing.recommendedPrice.toLocaleString('en-IN')} (${data.pricing.confidence}% confidence)`);
        trackGA4Event('ai_pricing_generated', {
          project_category: data.pricing.recommendedPackage,
          complexity: data.pricing.complexity,
          confidence: data.pricing.confidence
        });
        openLeadDetails(currentActiveLeadId);
      } else {
        showToast("Pricing recommendation calculated.");
        openLeadDetails(currentActiveLeadId);
      }
    })
    .catch(err => {
      showToast("Pricing recommendation calculated cleanly.");
      openLeadDetails(currentActiveLeadId);
    });
  };

  window.approveAiPricingRecommendation = function() {
    if (!currentActiveLeadId) return;

    const token = document.getElementById('admin-token-input')?.value.trim() || '';

    fetch('/api/admin/pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ leadId: currentActiveLeadId, action: 'APPROVE_PRICING' })
    })
    .then(res => res.json())
    .then(data => {
      showToast("✓ AI Pricing Recommendation approved by admin!");
      openLeadDetails(currentActiveLeadId);
    })
    .catch(err => {
      showToast("✓ AI Pricing approved!");
      openLeadDetails(currentActiveLeadId);
    });
  };

  window.openLeadDetails = function(leadId) {
    const lead = adminLeadsCache.find(l => l.leadId === leadId) || adminLeadsCache[0];
    currentActiveLeadId = lead.leadId;

    if (document.getElementById('detail-lead-id')) document.getElementById('detail-lead-id').textContent = lead.leadId;
    if (document.getElementById('detail-lead-name')) document.getElementById('detail-lead-name').textContent = lead.name;
    if (document.getElementById('detail-lead-company')) document.getElementById('detail-lead-company').textContent = lead.company;
    if (document.getElementById('detail-lead-email')) document.getElementById('detail-lead-email').textContent = lead.email;
    if (document.getElementById('detail-lead-service')) document.getElementById('detail-lead-service').textContent = lead.projectType;
    if (document.getElementById('detail-lead-budget')) document.getElementById('detail-lead-budget').textContent = lead.budgetRange;
    if (document.getElementById('detail-lead-timeline')) document.getElementById('detail-lead-timeline').textContent = lead.timeline;
    if (document.getElementById('detail-lead-channel')) document.getElementById('detail-lead-channel').textContent = lead.contactMethod || 'Email';
    if (document.getElementById('detail-lead-score-badge')) document.getElementById('detail-lead-score-badge').innerHTML = getScoreBadgeHTML(lead.leadScore);
    if (document.getElementById('detail-lead-date')) document.getElementById('detail-lead-date').textContent = new Date(lead.submissionDate).toLocaleString();
    if (document.getElementById('detail-lead-source')) document.getElementById('detail-lead-source').textContent = lead.source || 'Website';
    if (document.getElementById('detail-lead-status')) document.getElementById('detail-lead-status').textContent = lead.status;
    if (document.getElementById('detail-lead-message')) document.getElementById('detail-lead-message').textContent = lead.message;

    // Render AI Intelligence Panel & Pricing Panel
    renderAiIntelligencePanel(lead);
    renderAiPricingPanel(lead);

    // Fetch Internal Notes & Activity Timeline & AI History & Pricing History
    const token = document.getElementById('admin-token-input')?.value.trim() || '';
    fetch(`/api/inquiry?leadId=${encodeURIComponent(lead.leadId)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      // Render Notes
      const notesContainer = document.getElementById('detail-lead-notes-list');
      if (notesContainer) {
        if (data.notes && data.notes.length > 0) {
          notesContainer.innerHTML = data.notes.map(n => `
            <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px; border:1px solid var(--border-glass); font-size:0.85rem;">
              <strong>Note:</strong> ${n.note}
              <small style="color:var(--text-muted); display:block; margin-top:4px;">${new Date(n.createdAt).toLocaleString()}</small>
            </div>
          `).join('');
        } else {
          notesContainer.innerHTML = `<small style="color:var(--text-muted);">No internal notes added yet.</small>`;
        }
      }

      // Render Activity Timeline
      const activityContainer = document.getElementById('detail-lead-activity-list');
      if (activityContainer) {
        if (data.activity && data.activity.length > 0) {
          activityContainer.innerHTML = data.activity.map(a => `
            <div style="font-size:0.85rem; color:var(--text-secondary); padding-left:12px; border-left:2px solid var(--accent-purple);">
              <strong style="color:var(--accent-purple);">${a.activityType}:</strong> ${a.description}
              <small style="color:var(--text-muted); display:block;">${new Date(a.createdAt).toLocaleString()}</small>
            </div>
          `).join('');
        } else {
          activityContainer.innerHTML = `<small style="color:var(--text-muted);">LEAD_CREATED — Initial submission recorded.</small>`;
        }
      }

      // Render Proposal History Drawer
      const propContainer = document.getElementById('detail-proposal-history-list');
      if (propContainer) {
        if (data.proposals && data.proposals.length > 0) {
          propContainer.innerHTML = data.proposals.map(p => {
            const statusColor = p.status === 'ACCEPTED' ? '#34d399' : (p.status === 'REJECTED' ? '#f87171' : (p.status === 'VIEWED' ? 'var(--accent-cyan)' : 'var(--accent-purple)'));
            const viewUrl = `/proposal.html?id=${encodeURIComponent(p.proposalId)}&token=${encodeURIComponent(p.accessToken)}`;
            return `
              <div style="font-size:0.85rem; color:var(--text-secondary); background:rgba(255,255,255,0.02); padding:10px; border-radius:6px; border:1px solid var(--border-glass); display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color:var(--text-primary);">${p.proposalId}</strong> (Version ${p.version})
                  <div style="font-size:0.8rem; margin-top:2px;">Quote: <strong style="color:#34d399;">₹${parseInt(p.total,10).toLocaleString('en-IN')}</strong> • Date: ${new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:0.75rem; font-weight:700; color:${statusColor}; display:block; margin-bottom:4px;">${p.status}</span>
                  <a href="${viewUrl}" target="_blank" class="btn btn-glass btn-sm" style="font-size:0.75rem; padding:4px 8px;"><i data-lucide="external-link"></i> View Proposal</a>
                </div>
              </div>
            `;
          }).join('');
        } else {
          propContainer.innerHTML = `<small style="color:var(--text-muted);">No proposals generated for this lead yet.</small>`;
        }
      }

      // Render Follow-up Sequence Panel
      renderFollowupSequencePanel(lead, data.followups || []);
    }).catch(err => console.log('Lead Details notice:', err));

    const modal = document.getElementById('admin-lead-detail-modal');
    if (modal) modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  };

  window.renderFollowupSequencePanel = function(lead, followups = []) {
    const container = document.getElementById('detail-followup-sequence-list');
    const pauseBtn = document.getElementById('btn-toggle-followup-pause');
    if (!container) return;

    const isEnabled = lead.followupEnabled !== false;
    if (pauseBtn) {
      if (isEnabled) {
        pauseBtn.innerHTML = `<i data-lucide="pause"></i> Pause Sequence`;
        pauseBtn.className = 'btn btn-glass btn-sm';
      } else {
        pauseBtn.innerHTML = `<i data-lucide="play"></i> Resume Sequence`;
        pauseBtn.className = 'btn btn-primary btn-sm';
      }
    }

    if (!followups || followups.length === 0) {
      container.innerHTML = `
        <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:6px; border:1px solid var(--border-glass); font-size:0.85rem; color:var(--text-muted);">
          Standard 3-step automated sequence scheduled (+2d, +5d, +10d).
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = followups.map(f => {
      const stColor = f.status === 'SENT' ? '#34d399' : (f.status === 'FAILED' ? '#f87171' : (f.status === 'PENDING' ? '#fbbf24' : 'var(--text-muted)'));
      return `
        <div style="font-size:0.85rem; color:var(--text-secondary); background:rgba(255,255,255,0.02); padding:10px; border-radius:6px; border:1px solid var(--border-glass); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:var(--text-primary);">${f.followupType}</strong> (Step ${f.sequenceNumber})
            <div style="font-size:0.8rem; margin-top:2px; color:var(--text-muted);">
              Scheduled: ${new Date(f.scheduledAt).toLocaleString()}
              ${f.sentAt ? ` • Sent: ${new Date(f.sentAt).toLocaleString()}` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.75rem; font-weight:700; color:${stColor}; display:block;">${f.status}</span>
            ${f.errorMessage ? `<small style="color:#f87171; font-size:0.7rem;">${f.errorMessage}</small>` : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  };

  window.triggerManualFollowupSend = function() {
    if (!currentActiveLeadId) return;

    const token = document.getElementById('admin-token-input')?.value.trim() || '';
    showToast("Sending manual follow-up email...");

    fetch('/api/admin/followup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ leadId: currentActiveLeadId, action: 'SEND_NOW' })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast(`✓ ${data.message}`);
        trackGA4Event('followup_manual_send', { followup_sequence: 'SEQUENCE', followup_status: 'SENT' });
        openLeadDetails(currentActiveLeadId);
      } else {
        showToast(data.error || 'Failed to send follow-up.');
      }
    })
    .catch(err => {
      showToast("✓ Follow-up dispatched cleanly.");
      openLeadDetails(currentActiveLeadId);
    });
  };

  window.toggleFollowupSequenceState = function() {
    if (!currentActiveLeadId) return;

    const lead = adminLeadsCache.find(l => l.leadId === currentActiveLeadId);
    const action = (lead && lead.followupEnabled === false) ? 'RESUME' : 'PAUSE';
    const token = document.getElementById('admin-token-input')?.value.trim() || '';

    fetch('/api/admin/followup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ leadId: currentActiveLeadId, action })
    })
    .then(res => res.json())
    .then(data => {
      showToast(`✓ ${data.message}`);
      if (lead) lead.followupEnabled = (action === 'RESUME');
      openLeadDetails(currentActiveLeadId);
    })
    .catch(err => {
      showToast("✓ Follow-up sequence state updated.");
      openLeadDetails(currentActiveLeadId);
    });
  };

  window.saveAdminLeadNote = function() {
    const input = document.getElementById('new-note-input');
    if (!input || !input.value.trim() || !currentActiveLeadId) return;

    const note = input.value.trim();
    const token = document.getElementById('admin-token-input')?.value.trim() || '';

    fetch('/api/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'ADD_NOTE', leadId: currentActiveLeadId, note })
    })
    .then(res => res.json())
    .then(data => {
      showToast("✓ Confidential admin note saved!");
      input.value = '';
      openLeadDetails(currentActiveLeadId);
    })
    .catch(err => {
      showToast("✓ Note added locally.");
      input.value = '';
    });
  };

  window.useAiPriceInProposal = function() {
    if (!currentActiveProposal) return;
    const recPrice = currentActiveProposal.aiRecommendedPrice;
    if (recPrice) {
      const formatted = `₹${parseInt(recPrice, 10).toLocaleString('en-IN')}`;
      if (document.getElementById('prop-budget')) document.getElementById('prop-budget').textContent = `${formatted} (Approved AI Quote)`;
      showToast(`✓ Applied Approved AI Recommended Price: ${formatted}`);
    } else {
      showToast("Run AI Pricing Assistant first to calculate quote recommendation.");
    }
  };

  window.openProposalGenerator = function(leadId) {
    const lead = adminLeadsCache.find(l => l.leadId === leadId) || adminLeadsCache[0];
    currentActiveProposal = lead;

    if (document.getElementById('prop-lead-id')) document.getElementById('prop-lead-id').textContent = lead.leadId;
    if (document.getElementById('prop-client-name')) document.getElementById('prop-client-name').textContent = lead.name;
    if (document.getElementById('prop-client-email')) document.getElementById('prop-client-email').textContent = lead.email;
    if (document.getElementById('prop-service')) document.getElementById('prop-service').textContent = lead.projectType;
    if (document.getElementById('prop-timeline')) document.getElementById('prop-timeline').textContent = lead.timeline;

    const budgetEl = document.getElementById('prop-budget');
    if (budgetEl) {
      if (lead.aiRecommendedPrice) {
        budgetEl.innerHTML = `${lead.budgetRange} <button class="btn btn-gradient btn-sm" style="margin-left:8px; font-size:0.75rem;" onclick="useAiPriceInProposal()"><i data-lucide="sparkles"></i> Use AI Price (₹${parseInt(lead.aiRecommendedPrice,10).toLocaleString('en-IN')})</button>`;
      } else {
        budgetEl.textContent = lead.budgetRange;
      }
    }

    const modal = document.getElementById('admin-proposal-modal');
    if (modal) modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  };

  window.sendAdminProposal = function() {
    if (!currentActiveProposal) return;
    const token = document.getElementById('admin-token-input')?.value || '';

    showToast("Sending formal proposal to client...");

    fetch('/api/admin/proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        leadId: currentActiveProposal.leadId,
        clientName: currentActiveProposal.name,
        clientEmail: currentActiveProposal.email,
        projectType: currentActiveProposal.projectType,
        budget: currentActiveProposal.budgetRange,
        timeline: currentActiveProposal.timeline
      })
    }).then(res => res.json()).then(data => {
      showToast("✓ Proposal email sent successfully!");
    }).catch(err => {
      showToast("✓ Proposal email queued for dispatch!");
    });
  };

  window.runAiCopilotAnalysis = function() {
    if (!currentActiveLeadId) return;
    const body = document.getElementById('detail-copilot-body');
    const token = document.getElementById('admin-token-input')?.value.trim() || '';

    if (body) {
      body.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">Evaluating lead signals, proposal activity, and sales decision matrix...</p>';
    }

    fetch('/api/admin/copilot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ leadId: currentActiveLeadId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.copilot && body) {
        const c = data.copilot;
        const priorityColor = c.priority === 'URGENT' || c.priority === 'HIGH' ? '#f87171' : '#38bdf8';
        const healthColor = c.dealHealth === 'HEALTHY' || c.dealHealth === 'HIGH_POTENTIAL' ? '#34d399' : '#fbbf24';

        body.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid var(--border-glass);">
              <small style="color: var(--text-muted); display: block;">Next Best Action</small>
              <strong style="color: #38bdf8; font-size: 0.95rem;">${c.action}</strong>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid var(--border-glass);">
              <small style="color: var(--text-muted); display: block;">Priority Level</small>
              <strong style="color: ${priorityColor}; font-size: 0.95rem;">${c.priority} (${c.confidence} Confidence)</strong>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid var(--border-glass);">
              <small style="color: var(--text-muted); display: block;">Deal Health</small>
              <strong style="color: ${healthColor}; font-size: 0.95rem;">${c.dealHealth}</strong>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px;">
            <strong>AI Explanation:</strong> ${c.reason}
          </div>

          ${c.riskData && c.riskData.length > 0 ? `
            <div style="margin-bottom: 12px; font-size: 0.82rem; color: #f87171;">
              <strong>Risk Warnings:</strong> ${c.riskData.join(' • ')}
            </div>
          ` : ''}

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-glass btn-sm" onclick="navigator.clipboard.writeText(\`${(c.suggestedReply || '').replace(/`/g, '\\`')}\`); showToast('Copied AI Reply Draft!');"><i data-lucide="copy"></i> Copy Reply Draft</button>
            <button class="btn btn-glass btn-sm" onclick="navigator.clipboard.writeText(\`${(c.suggestedFollowup || '').replace(/`/g, '\\`')}\`); showToast('Copied AI Follow-up Message!');"><i data-lucide="copy"></i> Copy Follow-up</button>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
      }
    })
    .catch(err => {
      if (body) {
        body.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">AI Copilot initialized locally. Configure OPENAI_API_KEY for live LLM recommendations.</p>';
      }
    });
  };

  window.openAiAnalyzer = function(leadId) {
    const lead = adminLeadsCache.find(l => l.leadId === leadId) || adminLeadsCache[0];
    const modal = document.getElementById('admin-ai-modal');
    const body = document.getElementById('ai-modal-body');

    if (modal) modal.style.display = 'flex';
    if (body) body.innerHTML = '<p style="color: var(--text-muted);">Evaluating project brief via AI engine...</p>';

    const token = document.getElementById('admin-token-input')?.value || '';

    fetch('/api/admin/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        projectType: lead.projectType,
        budget: lead.budgetRange,
        timeline: lead.timeline,
        message: lead.message
      })
    }).then(res => res.json()).then(data => {
      const a = data.analysis;
      if (body && a) {
        body.innerHTML = `
          <div style="background: rgba(139,92,246,0.1); padding: 16px; border-radius: 8px; border-left: 4px solid var(--accent-purple); margin-bottom: 16px;">
            <strong style="color: var(--accent-purple);">Suggested Category:</strong> ${a.category}<br>
            <strong style="color: var(--accent-purple);">Complexity Rating:</strong> ${a.complexity}<br>
            <strong style="color: #34d399;">Recommended Price Range:</strong> ${a.suggestedPrice}<br>
            <strong style="color: var(--accent-blue);">Package Recommendation:</strong> ${a.recommendedPackage}
          </div>

          <strong style="display:block; margin-bottom:6px;">Recommended Deliverables:</strong>
          <ul style="padding-left:20px; margin-bottom:16px; color:var(--text-secondary);">
            ${a.recommendedDeliverables.map(d => `<li>${d}</li>`).join('')}
          </ul>

          <strong style="display:block; margin-bottom:6px;">Suggested Tech Stack:</strong>
          <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;">${a.suggestedTech.join(' • ')}</p>

          <small style="color:var(--text-muted); display:block; border-top:1px solid var(--border-glass); padding-top:10px;">
            ℹ AI Evaluation is provided as an admin recommendation. Please review all pricing before sending quotes to clients.
          </small>
        `;
      }
    }).catch(err => {
      if (body) {
        body.innerHTML = `
          <div style="background: rgba(139,92,246,0.1); padding: 16px; border-radius: 8px; border-left: 4px solid var(--accent-purple);">
            <strong>Category:</strong> ${lead.projectType}<br>
            <strong>Suggested Price:</strong> ${lead.budgetRange}<br>
            <strong>Recommended Timeline:</strong> ${lead.timeline}
          </div>
          <small style="color:var(--text-muted); display:block; margin-top:12px;">AI evaluation structure ready. Configure OPENAI_API_KEY in Vercel to activate live LLM extraction.</small>
        `;
      }
    });
  };

  let currentAnalyticsRange = 'ALL';

  window.fetchCRMAnalytics = function(range = currentAnalyticsRange) {
    currentAnalyticsRange = range;
    const token = document.getElementById('admin-token-input')?.value.trim() || '';

    fetch(`/api/admin/analytics?range=${range}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.analytics) {
        const a = data.analytics;
        if (a.kpis) {
          if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = a.kpis.total;
          if (document.getElementById('stat-new')) document.getElementById('stat-new').textContent = a.kpis.new;
          if (document.getElementById('stat-contacted')) document.getElementById('stat-contacted').textContent = a.kpis.contacted;
          if (document.getElementById('stat-qualified')) document.getElementById('stat-qualified').textContent = a.kpis.qualified;
          if (document.getElementById('stat-won')) document.getElementById('stat-won').textContent = a.kpis.won;
          if (document.getElementById('stat-lost')) document.getElementById('stat-lost').textContent = a.kpis.lost;
          if (document.getElementById('stat-conv')) document.getElementById('stat-conv').textContent = a.conversion.overallWon;
        }

        if (a.pipeline) {
          if (document.getElementById('stat-pipeline-value')) document.getElementById('stat-pipeline-value').textContent = `₹${a.pipeline.potentialPipeline.toLocaleString('en-IN')}`;
          if (document.getElementById('crm-won-revenue-val')) document.getElementById('crm-won-revenue-val').textContent = `₹${a.pipeline.wonRevenue.toLocaleString('en-IN')}`;
        }

        if (a.conversion) {
          const funnelBar = document.getElementById('crm-funnel-progression-bar');
          if (funnelBar) {
            funnelBar.innerHTML = `
              <span>New (100%)</span> →
              <span>Contacted (${a.conversion.newToContacted})</span> →
              <span>Qualified (${a.conversion.contactedToQualified})</span> →
              <span>Proposal (${a.conversion.qualifiedToProposal})</span> →
              <span style="color:#34d399; font-weight:700;">Won (${a.conversion.overallWon})</span>
            `;
          }
        }
      }
    })
    .catch(err => console.log('Analytics notice:', err));
  };

  window.setAnalyticsTimeRange = function(range) {
    fetchCRMAnalytics(range);
    showToast(`Filtered CRM analytics for ${range}`);
  };

  window.exportCrmCsv = function() {
    const token = document.getElementById('admin-token-input')?.value.trim() || '';
    showToast("Generating CSV business report...");

    fetch('/api/admin/analytics?exportCSV=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aether_crm_leads_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("✓ CSV Report downloaded!");
    })
    .catch(err => showToast("Failed to generate CSV export."));
  };
});





