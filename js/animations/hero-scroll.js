/* ============================================================
   LIVING BLUEPRINT — Animation: Cinematic Hero Scroll
   4-Stage Progressive Architectural Transformation
   Powered by GSAP & ScrollTrigger with interactive stage jumps
   ============================================================ */

'use strict';

import { prefersReducedMotion } from '../core/utils.js';

export function initHeroScroll() {
  const heroSection = document.querySelector('.hero-cinematic');
  const stickyContainer = document.querySelector('.hero-cinematic__sticky');
  if (!heroSection || !stickyContainer) return;

  // Layer references
  const bgBlueprint = document.querySelector('.hero-cinematic__bg-blueprint');
  const bgReality = document.querySelector('.hero-cinematic__bg-reality');
  const layerSketch = document.getElementById('layer-sketch');
  const layerBlueprint = document.getElementById('layer-blueprint');
  const layer3D = document.getElementById('layer-3d');
  const layerReality = document.getElementById('layer-reality');
  const stage4Reveal = document.querySelector('.hero-stage4-reveal');

  // HUD elements
  const hudIndex = document.querySelector('.hero-hud__index');
  const hudLabel = document.querySelector('.hero-hud__label');
  const hudDesc = document.querySelector('.hero-hud__desc');
  const progressFill = document.querySelector('.hero-bottom-bar__progress-fill');
  const stepBtns = document.querySelectorAll('.hero-hud__step-btn');

  // Stage metadata definitions
  const stages = [
    {
      index: '01 / 04',
      name: 'PHÁC THẢO BAN ĐẦU',
      desc: 'Nét vẽ không gian tự do, xác lập hệ trục chính và cân chỉnh điểm tụ phối cảnh.'
    },
    {
      index: '02 / 04',
      name: 'BẢN VẼ KỸ THUẬT',
      desc: 'Quy chuẩn kết cấu chịu lực, hệ lưới cột, cao độ và kích thước chi tiết.'
    },
    {
      index: '03 / 04',
      name: 'PHỐI CẢNH 3D',
      desc: 'Mô hình khối kỹ thuật số, nghiên cứu bóng đổ mặt trời và cảm thụ ánh sáng.'
    },
    {
      index: '04 / 04',
      name: 'HOÀN THIỆN THỰC TẾ',
      desc: 'Chất liệu vật liệu tự nhiên, chiếu sáng ấm áp và hòa nhập cảnh quan sinh thái.'
    }
  ];

  // Helper to update HUD UI
  const updateHUD = (stageIdx, progress) => {
    const data = stages[stageIdx];
    if (!data) return;

    if (hudIndex) hudIndex.textContent = data.index;
    if (hudLabel) hudLabel.textContent = data.name;
    if (hudDesc) hudDesc.textContent = data.desc;

    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(5, progress * 100))}%`;
    }

    // Update active button indicator
    stepBtns.forEach((btn, idx) => {
      if (idx === stageIdx) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-current', 'step');
      } else {
        btn.classList.remove('is-active');
        btn.removeAttribute('aria-current');
      }
    });

    // Toggle blueprint theme on sticky container for high contrast
    if (stageIdx === 1) {
      stickyContainer.classList.add('theme-blueprint');
    } else {
      stickyContainer.classList.remove('theme-blueprint');
    }

    // Toggle stage 4 grand title reveal
    if (stage4Reveal) {
      if (progress >= 0.76) {
        stage4Reveal.classList.add('is-visible');
      } else {
        stage4Reveal.classList.remove('is-visible');
      }
    }
  };

  // Direct visual layer state switcher (for clicks & reduced motion fallback)
  const applyStageVisuals = (stageIdx) => {
    if (layerSketch) layerSketch.style.opacity = stageIdx === 0 ? '1' : '0';
    if (layerBlueprint) layerBlueprint.style.opacity = stageIdx === 1 ? '1' : '0';
    if (bgBlueprint) bgBlueprint.style.opacity = stageIdx === 1 ? '1' : '0';
    if (layer3D) layer3D.style.opacity = stageIdx === 2 ? '1' : '0';
    if (layerReality) layerReality.style.opacity = stageIdx === 3 ? '1' : '0';
    if (bgReality) bgReality.style.opacity = stageIdx === 3 ? '1' : '0';

    const p = (stageIdx + 0.5) / 4;
    updateHUD(stageIdx, p);
  };

  // Setup click jump on stage buttons
  stepBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetStage = parseInt(btn.getAttribute('data-stage') || '0', 10);
      
      // If reduced motion is on, switch layers directly
      if (prefersReducedMotion()) {
        applyStageVisuals(targetStage);
        return;
      }

      // Smoothly scroll to the corresponding section of the pin duration
      const totalScroll = heroSection.offsetHeight - window.innerHeight;
      const stageScrollPercentages = [0.05, 0.36, 0.64, 0.94];
      const targetScrollY = heroSection.offsetTop + (totalScroll * stageScrollPercentages[targetStage]);

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    });
  });

  // Setup smooth scroll for Stage 4 CTA and bottom prompt
  const stage4Cta = document.querySelector('.hero-stage4-reveal__cta');
  if (stage4Cta) {
    stage4Cta.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSec = document.getElementById('featured-works');
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const promptScroll = document.querySelector('.hero-bottom-bar__prompt');
  if (promptScroll) {
    promptScroll.style.cursor = 'pointer';
    promptScroll.addEventListener('click', () => {
      // Advance to next stage or scroll
      const totalScroll = heroSection.offsetHeight - window.innerHeight;
      window.scrollBy({ top: totalScroll * 0.33, behavior: 'smooth' });
    });
  }

  // Check for Reduced Motion: display final state cleanly with manual tab switching
  if (prefersReducedMotion()) {
    applyStageVisuals(3);
    return;
  }

  // Check if GSAP and ScrollTrigger are loaded
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
    console.warn('[Living Blueprint] GSAP or ScrollTrigger not detected. Running native scroll observer.');
    runNativeScrollFallback();
    return;
  }

  // ── GSAP & ScrollTrigger Initialization ─────────────────
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  // Set initial layer states
  gsap.set(layerSketch, { opacity: 1 });
  gsap.set(layerBlueprint, { opacity: 0 });
  gsap.set(layer3D, { opacity: 0 });
  gsap.set(layerReality, { opacity: 0 });
  gsap.set(bgBlueprint, { opacity: 0 });
  gsap.set(bgReality, { opacity: 0 });

  // Master ScrollTrigger timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroSection,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      pin: stickyContainer,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        let activeIdx = 0;
        if (p < 0.25) activeIdx = 0;
        else if (p < 0.52) activeIdx = 1;
        else if (p < 0.78) activeIdx = 2;
        else activeIdx = 3;

        updateHUD(activeIdx, p);
      }
    }
  });

  // Timeline choreography (0.00 -> 1.00)

  // 1. Stage 1 (0.00 -> 0.25): Initial Sketch in full detail
  tl.to({}, { duration: 0.2 });

  // 2. Transition: Stage 1 (Sketch) -> Stage 2 (Blueprint) (0.20 -> 0.45)
  tl.to(bgBlueprint, { opacity: 1, duration: 0.2, ease: 'power2.inOut' }, 0.2)
    .to(layerSketch, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, 0.22)
    .to(layerBlueprint, { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.24);

  // 3. Stage 2 Hold
  tl.to({}, { duration: 0.1 }, 0.45);

  // 4. Transition: Stage 2 (Blueprint) -> Stage 3 (3D Volumetric) (0.50 -> 0.72)
  tl.to(bgBlueprint, { opacity: 0, duration: 0.22, ease: 'power2.inOut' }, 0.50)
    .to(layerBlueprint, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, 0.52)
    .to(layer3D, { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.54);

  // 5. Stage 3 Hold
  tl.to({}, { duration: 0.08 }, 0.72);

  // 6. Transition: Stage 3 (3D) -> Stage 4 (Reality) (0.76 -> 1.00)
  tl.to(bgReality, { opacity: 1, duration: 0.24, ease: 'power2.inOut' }, 0.76)
    .to(layer3D, { opacity: 0, duration: 0.22, ease: 'power2.inOut' }, 0.78)
    .to(layerReality, { opacity: 1, duration: 0.24, ease: 'power2.out' }, 0.80);

  // Initialize first view
  updateHUD(0, 0.05);

  // ── Native Fallback if GSAP is unavailable ──────────────
  function runNativeScrollFallback() {
    window.addEventListener('scroll', () => {
      const rect = heroSection.getBoundingClientRect();
      const total = heroSection.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / total));

      let activeIdx = 0;
      if (progress < 0.25) activeIdx = 0;
      else if (progress < 0.50) activeIdx = 1;
      else if (progress < 0.75) activeIdx = 2;
      else activeIdx = 3;

      applyStageVisuals(activeIdx);
    }, { passive: true });
  }
}
