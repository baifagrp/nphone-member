// =============================================
// 認證相關功能
// =============================================

const Auth = {
  // =============================================
  // LINE Login 相關
  // =============================================
  
  // 開始 LINE Login 流程
  startLineLogin() {
    try {
      CONFIG.log('開始 LINE Login 流程');
      
      // 儲存當前頁面，登入後返回
      sessionStorage.setItem('line_login_return_url', window.location.href);
      
      // 導向 LINE OAuth 頁面
      const loginUrl = CONFIG.getLineLoginUrl();
      CONFIG.log('導向 LINE Login', loginUrl);
      
      window.location.href = loginUrl;
    } catch (error) {
      CONFIG.error('LINE Login 失敗', error);
      if (typeof UI !== 'undefined') {
        UI.error('登入失敗，請稍後再試');
      } else {
        alert('登入失敗，請稍後再試');
      }
    }
  },
  
  // 處理 LINE Login 回調
  async handleLineCallback() {
    try {
      // 取得 URL 參數
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (error) {
        throw new Error(`LINE Login 錯誤: ${error}`);
      }
      
      if (!code) {
        throw new Error('未收到授權碼');
      }
      
      CONFIG.log('收到 LINE 授權碼', code);
      
      // 呼叫 Supabase Edge Function 處理 OAuth
      // 注意：需要加上 apikey header 才能通過 Supabase 認證
      const response = await fetch(
        `${CONFIG.LINE_CALLBACK_FUNCTION_URL}?code=${code}&redirect_uri=${encodeURIComponent(CONFIG.getCallbackUrl())}`,
        {
          method: 'GET',
          headers: {
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        CONFIG.error('Edge Function 回應', { status: response.status, error: errorText });
        throw new Error(`Edge Function 呼叫失敗 (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '登入處理失敗');
      }
      
      CONFIG.log('LINE Login 成功', result.member);
      
      // 儲存會員資訊到 Session
      this.saveMemberSession(result.member, result.line_user_id, result.access_token);
      
      // 導向頁面判斷
      let redirectUrl;
      
      // 1. 優先檢查 Email 是否已驗證
      const needsEmailVerification = !result.member.email_verified || 
                                     result.member.email?.includes('@nphone.temp') ||
                                     result.member.registration_status === 'pending';
      
      if (needsEmailVerification) {
        // 需要 Email 驗證 -> 保存 LINE 資訊到 sessionStorage
        sessionStorage.setItem('temp_line_user_id', result.line_user_id);
        sessionStorage.setItem('temp_line_display_name', result.member.name || '');
        sessionStorage.setItem('temp_line_picture_url', result.member.avatar_url || '');
        
        // 導向驗證頁面
        redirectUrl = '/member/email-verification.html';
        CONFIG.log('需要 Email 驗證，導向驗證頁面');
      } else {
        // Email 已驗證 -> 檢查是否有完整資料
        const hasCompleteProfile = result.member.phone && result.member.name;
        
        if (!hasCompleteProfile) {
          // 需要補充資料 -> 導向資料填寫頁面
          redirectUrl = '/member/setup.html';
          CONFIG.log('需要補充個人資料');
        } else {
          // 資料完整 -> 導向原本要去的頁面或會員中心
          const returnUrl = sessionStorage.getItem('line_login_return_url') || '/member/profile.html';
          sessionStorage.removeItem('line_login_return_url');
          redirectUrl = returnUrl;
          CONFIG.log('資料完整，導向目標頁面');
        }
      }
      
      CONFIG.log('導向頁面', redirectUrl);
      window.location.href = redirectUrl;
      
    } catch (error) {
      CONFIG.error('處理 LINE 回調失敗', error);
      alert(`登入失敗: ${error.message}`);
      
      // 導回首頁
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 2000);
    }
  },
  
  // 儲存會員 Session
  saveMemberSession(member, lineUserId, accessToken) {
    const session = {
      member,
      lineUserId,
      accessToken,
      expiresAt: Date.now() + CONFIG.SESSION_EXPIRY,
    };
    
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
    CONFIG.log('會員 Session 已儲存');
  },
  
  // 取得會員 Session
  getMemberSession() {
    try {
      const sessionStr = localStorage.getItem(CONFIG.SESSION_KEY);
      if (!sessionStr) return null;
      
      const session = JSON.parse(sessionStr);
      
      // 檢查是否過期
      if (Date.now() > session.expiresAt) {
        this.clearMemberSession();
        return null;
      }
      
      return session;
    } catch (error) {
      CONFIG.error('讀取會員 Session 失敗', error);
      return null;
    }
  },
  
  // 清除會員 Session
  clearMemberSession() {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    CONFIG.log('會員 Session 已清除');
  },
  
  // 會員登出
  memberLogout() {
    this.clearMemberSession();
    window.location.href = '/index.html';
  },
  
  // 檢查會員是否已登入
  isMemberLoggedIn() {
    return this.getMemberSession() !== null;
  },
  
  // 要求會員登入（未登入時導向首頁）
  requireMemberLogin() {
    if (!this.isMemberLoggedIn()) {
      if (typeof UI !== 'undefined') {
        UI.warning('請先登入');
      } else {
        alert('請先登入');
      }
      window.location.href = '/index.html';
      return false;
    }
    return true;
  },
  
  // =============================================
  // 管理員認證相關
  // =============================================
  
  // 管理員登入
  async adminLogin(email, password) {
    try {
      CONFIG.log('管理員登入中...', email);
      
      const result = await AdminAPI.login(email, password);
      
      // 儲存管理員 Session
      this.saveAdminSession(result.user);
      
      CONFIG.log('管理員登入成功');
      return result.user;
      
    } catch (error) {
      CONFIG.error('管理員登入失敗', error);
      throw error;
    }
  },
  
  // 管理員登出
  async adminLogout() {
    try {
      await AdminAPI.logout();
      this.clearAdminSession();
      window.location.href = '/admin/login.html';
    } catch (error) {
      CONFIG.error('管理員登出失敗', error);
      // 即使失敗也清除本地 Session
      this.clearAdminSession();
      window.location.href = '/admin/login.html';
    }
  },
  
  // 儲存管理員 Session
  saveAdminSession(user) {
    const session = {
      user,
      expiresAt: Date.now() + CONFIG.SESSION_EXPIRY,
    };
    
    localStorage.setItem(CONFIG.ADMIN_SESSION_KEY, JSON.stringify(session));
    CONFIG.log('管理員 Session 已儲存');
  },
  
  // 取得管理員 Session
  getAdminSession() {
    try {
      const sessionStr = localStorage.getItem(CONFIG.ADMIN_SESSION_KEY);
      if (!sessionStr) return null;
      
      const session = JSON.parse(sessionStr);
      
      // 檢查是否過期
      if (Date.now() > session.expiresAt) {
        this.clearAdminSession();
        return null;
      }
      
      return session;
    } catch (error) {
      CONFIG.error('讀取管理員 Session 失敗', error);
      return null;
    }
  },
  
  // 清除管理員 Session
  clearAdminSession() {
    localStorage.removeItem(CONFIG.ADMIN_SESSION_KEY);
    CONFIG.log('管理員 Session 已清除');
  },
  
  // 檢查管理員是否已登入
  isAdminLoggedIn() {
    return this.getAdminSession() !== null;
  },
  
  // 要求管理員登入（未登入時導向登入頁）
  requireAdminLogin() {
    if (!this.isAdminLoggedIn()) {
      if (typeof UI !== 'undefined') {
        UI.warning('請先登入管理後台');
      } else {
        alert('請先登入管理後台');
      }
      window.location.href = '/admin/login.html';
      return false;
    }
    return true;
  },
  
  // 驗證管理員身份（從 Supabase 確認）
  async verifyAdminAuth() {
    try {
      const admin = await AdminAPI.getCurrentAdmin();
      if (!admin) {
        this.clearAdminSession();
        return false;
      }
      
      // 更新 Session
      this.saveAdminSession(admin);
      return true;
      
    } catch (error) {
      CONFIG.error('驗證管理員身份失敗', error);
      this.clearAdminSession();
      return false;
    }
  },
};

// =============================================
// 輔助函數：格式化日期
// =============================================
function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// =============================================
// 輔助函數：格式化時間
// =============================================
function formatDateTime(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// =============================================
// 輔助函數：驗證電話號碼
// =============================================
function validatePhone(phone) {
  if (!phone) return true; // 空值允許
  return CONFIG.VALIDATION.phonePattern.test(phone);
}

// =============================================
// 輔助函數：驗證 Email
// =============================================
function validateEmail(email) {
  if (!email) return true; // 空值允許
  return CONFIG.VALIDATION.emailPattern.test(email);
}

// =============================================
// 輔助函數：顯示載入中
// =============================================
function showLoading(message = '載入中...') {
  // 優先使用新的 UI 工具
  if (typeof UI !== 'undefined' && UI.showLoading) {
    UI.showLoading(message);
    return;
  }
  
  // 後備方案：舊的載入方式
  hideLoading();
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-overlay';
  loadingDiv.style.cssText = `
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
  text.style.cssText = 'font-size: 16px; color: var(--color-text-secondary, #86868B); font-weight: 500;';
  
  loadingDiv.appendChild(spinner);
  loadingDiv.appendChild(text);
  document.body.appendChild(loadingDiv);
}

// =============================================
// 輔助函數：隱藏載入中
// =============================================
function hideLoading() {
  // 優先使用新的 UI 工具
  if (typeof UI !== 'undefined' && UI.hideLoading) {
    UI.hideLoading();
    return;
  }
  
  // 後備方案：移除舊的載入元素
  const loading = document.getElementById('loading-overlay');
  if (loading) {
    loading.style.opacity = '0';
    loading.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      loading.remove();
    }, 300);
  }
}

// =============================================
// 輔助函數：顯示提示訊息
// =============================================
function showMessage(message, type = 'info') {
  // 優先使用新的 UI 工具
  if (typeof UI !== 'undefined' && UI.showToast) {
    UI.showToast(message, type);
    return;
  }
  
  // 後備方案：舊的通知方式
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-toast message-${type}`;
  messageDiv.textContent = message;
  
  document.body.appendChild(messageDiv);
  
  // 顯示動畫
  setTimeout(() => {
    messageDiv.classList.add('show');
  }, 100);
  
  // 3秒後自動消失
  setTimeout(() => {
    messageDiv.classList.remove('show');
    setTimeout(() => {
      messageDiv.remove();
    }, 300);
  }, 3000);
}

