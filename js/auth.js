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
      alert('登入失敗，請稍後再試');
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
      
      // 導回原本的頁面或會員中心
      const returnUrl = sessionStorage.getItem('line_login_return_url') || '/member/profile.html';
      sessionStorage.removeItem('line_login_return_url');
      
      window.location.href = returnUrl;
      
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
      alert('請先登入');
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
      alert('請先登入管理後台');
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
  // 移除舊的 loading
  hideLoading();
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-overlay';
  loadingDiv.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(loadingDiv);
}

// =============================================
// 輔助函數：隱藏載入中
// =============================================
function hideLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) {
    loading.remove();
  }
}

// =============================================
// 輔助函數：顯示提示訊息
// =============================================
function showMessage(message, type = 'info') {
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

