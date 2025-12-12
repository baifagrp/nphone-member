/**
 * =============================================
 * NPHONE 動畫工具函數
 * =============================================
 */

const AnimationUtils = {
  /**
   * 數字滾動動畫
   * @param {HTMLElement} element - 目標元素
   * @param {number} end - 結束數字
   * @param {number} duration - 持續時間（毫秒）
   * @param {string} prefix - 前綴（如 'NT$ '）
   * @param {string} suffix - 後綴（如 ' 點'）
   */
  countUp(element, end, duration = 1000, prefix = '', suffix = '') {
    if (!element) return;
    
    const start = 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用 easeOutExpo 緩動函數
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(start + (end - start) * easeProgress);
      
      element.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = `${prefix}${end.toLocaleString()}${suffix}`;
      }
    };
    
    requestAnimationFrame(animate);
  },

  /**
   * 為元素添加淡入動畫
   * @param {HTMLElement|string} elementOrSelector - 元素或選擇器
   * @param {number} delay - 延遲時間（毫秒）
   */
  fadeIn(elementOrSelector, delay = 0) {
    const element = typeof elementOrSelector === 'string' 
      ? document.querySelector(elementOrSelector) 
      : elementOrSelector;
    
    if (!element) return;
    
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.classList.add('animate-fade-in');
      element.style.opacity = '1';
    }, delay);
  },

  /**
   * 為卡片添加依序出現動畫
   * @param {string} containerSelector - 容器選擇器
   * @param {number} baseDelay - 基礎延遲（毫秒）
   */
  staggerCards(containerSelector, baseDelay = 50) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const cards = container.querySelectorAll('.ds-card, .ds-info-card, .selection-card');
    cards.forEach((card, index) => {
      card.classList.add('card-stagger');
      card.style.animationDelay = `${index * baseDelay}ms`;
    });
  },

  /**
   * 為列表項目添加依序出現動畫
   * @param {string} containerSelector - 容器選擇器
   * @param {number} baseDelay - 基礎延遲（毫秒）
   */
  staggerListItems(containerSelector, baseDelay = 50) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const items = container.querySelectorAll('.ds-list-item');
    items.forEach((item, index) => {
      item.classList.add('list-item-slide');
      item.style.animationDelay = `${index * baseDelay}ms`;
    });
  },

  /**
   * 為按鈕添加漣漪效果
   * @param {HTMLElement} button - 按鈕元素
   */
  addRippleEffect(button) {
    if (!button) return;
    
    button.classList.add('btn-ripple');
    
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  },

  /**
   * 為所有按鈕添加漣漪效果
   * @param {string} selector - 按鈕選擇器
   */
  addRippleToButtons(selector = '.ds-btn, .btn') {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => this.addRippleEffect(button));
  },

  /**
   * 滾動到指定元素（帶動畫）
   * @param {string|HTMLElement} elementOrSelector - 元素或選擇器
   * @param {number} offset - 偏移量（像素）
   */
  scrollTo(elementOrSelector, offset = 0) {
    const element = typeof elementOrSelector === 'string'
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;
    
    if (!element) return;
    
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
      top: top,
      behavior: 'smooth'
    });
  },

  /**
   * 檢查元素是否在視窗內
   * @param {HTMLElement} element - 元素
   * @param {number} threshold - 閾值（0-1）
   * @returns {boolean}
   */
  isInViewport(element, threshold = 0.1) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    return (
      rect.top <= windowHeight * (1 - threshold) &&
      rect.bottom >= windowHeight * threshold
    );
  },

  /**
   * 監聽滾動，為進入視窗的元素添加動畫
   * @param {string} selector - 元素選擇器
   * @param {string} animationClass - 動畫類別
   * @param {number} threshold - 閾值（0-1）
   */
  animateOnScroll(selector, animationClass = 'animate-fade-in', threshold = 0.1) {
    const elements = document.querySelectorAll(selector);
    
    const checkElements = () => {
      elements.forEach(element => {
        if (this.isInViewport(element, threshold) && !element.classList.contains('animated')) {
          element.classList.add(animationClass, 'animated');
        }
      });
    };
    
    checkElements();
    window.addEventListener('scroll', checkElements, { passive: true });
    
    return () => window.removeEventListener('scroll', checkElements);
  },

  /**
   * 為數字元素添加滾動計數效果
   * @param {string} selector - 元素選擇器
   */
  countUpOnScroll(selector) {
    const elements = document.querySelectorAll(selector);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          const end = parseInt(entry.target.textContent.replace(/[^0-9]/g, ''));
          const prefix = entry.target.textContent.match(/^[^0-9]*/)[0];
          const suffix = entry.target.textContent.match(/[^0-9]*$/)[0];
          
          this.countUp(entry.target, end, 1500, prefix, suffix);
          entry.target.dataset.counted = 'true';
        }
      });
    }, { threshold: 0.5 });
    
    elements.forEach(element => observer.observe(element));
  },

  /**
   * 頁面過渡效果
   * @param {Function} callback - 過渡完成後的回調
   */
  pageTransition(callback) {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
      if (callback) callback();
      document.body.style.opacity = '1';
    }, 300);
  },

  /**
   * 為卡片添加 hover 提升效果
   * @param {string} selector - 卡片選擇器
   */
  addCardLiftEffect(selector = '.ds-card, .ds-info-card') {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => card.classList.add('card-lift'));
  },

  /**
   * 初始化所有動畫
   */
  init() {
    // 添加頁面過渡
    document.body.classList.add('page-transition');
    
    // 添加卡片依序動畫
    setTimeout(() => {
      this.staggerCards('.ds-grid, .stats-grid');
      this.staggerListItems('.ds-list, .booking-list, .member-list');
    }, 100);
    
    // 添加卡片 hover 效果
    this.addCardLiftEffect();
    
    // 添加按鈕漣漪效果
    this.addRippleToButtons();
    
    // 數字滾動效果
    this.countUpOnScroll('[data-count-up]');
    
    CONFIG.log('動畫系統已初始化');
  }
};

// 頁面載入時自動初始化（如果 CONFIG 已定義）
if (typeof CONFIG !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AnimationUtils.init());
  } else {
    AnimationUtils.init();
  }
}

