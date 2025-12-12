// =============================================
// UI 工具函數 - Toast 通知、骨架屏、載入狀態等
// =============================================

const UI = {
  // =============================================
  // Toast 通知系統（改進版）
  // =============================================
  
  /**
   * 顯示 Toast 通知
   * @param {string} message - 通知訊息
   * @param {string} type - 類型：success, error, warning, info
   * @param {object} options - 選項 {title, duration, icon}
   */
  showToast(message, type = 'info', options = {}) {
    // 確保容器存在
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    // 創建 Toast 元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // 圖標 SVG
    const icons = {
      success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5" stroke="#34C759" fill="none"/>
      </svg>`,
      error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01" stroke="#FF3B30"/>
      </svg>`,
      warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#FF9500"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
      info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`
    };
    
    // Toast 內容
    toast.innerHTML = `
      <div class="toast-icon" style="color: ${this.getToastColor(type)};">
        ${options.icon || icons[type] || icons.info}
      </div>
      <div class="toast-content">
        ${options.title ? `<div class="toast-title">${options.title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4l-8 8M4 4l8 8"/>
        </svg>
      </button>
    `;
    
    // 添加到容器
    container.appendChild(toast);
    
    // 觸發動畫
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // 自動移除
    const duration = options.duration || 4000;
    setTimeout(() => {
      toast.classList.add('slide-out');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
    
    return toast;
  },
  
  // 獲取 Toast 顏色
  getToastColor(type) {
    const colors = {
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
      info: '#007AFF'
    };
    return colors[type] || colors.info;
  },
  
  // 快速方法
  success(message, options) {
    return this.showToast(message, 'success', options);
  },
  
  error(message, options) {
    return this.showToast(message, 'error', options);
  },
  
  warning(message, options) {
    return this.showToast(message, 'warning', options);
  },
  
  info(message, options) {
    return this.showToast(message, 'info', options);
  },
  
  // =============================================
  // 骨架屏
  // =============================================
  
  /**
   * 創建骨架屏元素
   * @param {string} type - 類型：text, title, avatar, card, list
   * @param {number} count - 數量（用於 list）
   */
  createSkeleton(type = 'text', count = 1) {
    const skeletons = [];
    
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = `skeleton skeleton-${type}`;
      skeletons.push(skeleton);
    }
    
    return count === 1 ? skeletons[0] : skeletons;
  },
  
  /**
   * 顯示骨架屏載入
   * @param {HTMLElement} container - 容器元素
   * @param {string} layout - 布局類型
   */
  showSkeleton(container, layout = 'card') {
    container.innerHTML = '';
    
    if (layout === 'card') {
      const cardSkeleton = document.createElement('div');
      cardSkeleton.className = 'skeleton-card';
      cardSkeleton.innerHTML = `
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      `;
      container.appendChild(cardSkeleton);
    } else if (layout === 'list') {
      for (let i = 0; i < 5; i++) {
        const item = document.createElement('div');
        item.className = 'skeleton-list-item';
        item.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px;';
        item.innerHTML = `
          <div class="skeleton skeleton-avatar"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 60%; margin-top: 8px;"></div>
          </div>
        `;
        container.appendChild(item);
      }
    } else if (layout === 'table') {
      const table = document.createElement('div');
      table.className = 'skeleton-table';
      for (let i = 0; i < 5; i++) {
        const row = document.createElement('div');
        row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 12px;';
        row.innerHTML = `
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
        `;
        table.appendChild(row);
      }
      container.appendChild(table);
    }
  },
  
  // =============================================
  // 載入狀態
  // =============================================
  
  /**
   * 顯示全屏載入
   */
  showLoading(message = '載入中...') {
    // 移除現有的載入層
    this.hideLoading();
    
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      gap: 16px;
    `;
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.cssText = 'width: 48px; height: 48px; border-width: 4px;';
    
    const text = document.createElement('div');
    text.textContent = message;
    text.style.cssText = 'font-size: 16px; color: var(--color-text-secondary); font-weight: 500;';
    
    overlay.appendChild(spinner);
    overlay.appendChild(text);
    document.body.appendChild(overlay);
  },
  
  /**
   * 隱藏全屏載入
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  },
  
  // =============================================
  // 表單驗證反饋
  // =============================================
  
  /**
   * 顯示表單欄位錯誤
   * @param {HTMLElement} field - 表單欄位
   * @param {string} message - 錯誤訊息
   */
  showFieldError(field, message) {
    // 移除現有錯誤
    this.hideFieldError(field);
    
    // 添加錯誤樣式
    field.classList.add('error');
    field.style.borderColor = 'var(--color-error)';
    
    // 添加錯誤訊息
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    field.parentElement.appendChild(errorDiv);
  },
  
  /**
   * 隱藏表單欄位錯誤
   * @param {HTMLElement} field - 表單欄位
   */
  hideFieldError(field) {
    field.classList.remove('error');
    field.style.borderColor = '';
    
    const errorDiv = field.parentElement.querySelector('.form-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  },
  
  /**
   * 顯示表單欄位成功狀態
   * @param {HTMLElement} field - 表單欄位
   */
  showFieldSuccess(field) {
    field.classList.remove('error');
    field.style.borderColor = 'var(--color-success)';
    
    // 添加成功圖標（可選）
    if (!field.parentElement.querySelector('.field-success-icon')) {
      const icon = document.createElement('div');
      icon.className = 'field-success-icon';
      icon.style.cssText = `
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-success);
        pointer-events: none;
      `;
      icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>`;
      field.parentElement.style.position = 'relative';
      field.parentElement.appendChild(icon);
    }
  },
  
  // =============================================
  // 動畫工具
  // =============================================
  
  /**
   * 淡入動畫
   * @param {HTMLElement} element - 元素
   * @param {number} duration - 持續時間（ms）
   */
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    setTimeout(() => {
      element.style.opacity = '1';
    }, 10);
  },
  
  /**
   * 淡出動畫
   * @param {HTMLElement} element - 元素
   * @param {number} duration - 持續時間（ms）
   */
  fadeOut(element, duration = 300) {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    setTimeout(() => {
      element.remove();
    }, duration);
  },
  
  /**
   * 滑入動畫
   * @param {HTMLElement} element - 元素
   * @param {string} direction - 方向：up, down, left, right
   */
  slideIn(element, direction = 'up', duration = 300) {
    const transforms = {
      up: 'translateY(20px)',
      down: 'translateY(-20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)'
    };
    
    element.style.opacity = '0';
    element.style.transform = transforms[direction];
    element.style.transition = `all ${duration}ms ease`;
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
    }, 10);
  }
};

// 全域快捷方法（向後兼容）
function showToast(message, type = 'info', options) {
  return UI.showToast(message, type, options);
}

function showMessage(message, type = 'info') {
  // 向後兼容舊的 showMessage 函數
  return UI.showToast(message, type);
}

