// =============================================
// 系統配置檔案範例
// =============================================
// 
// 📝 使用說明：
// 1. 複製此檔案並重新命名為 config.js
// 2. 將所有設定值替換為您的實際值
// 3. 所有值都可以在 SETUP.md 中找到取得方式
// 4. 請勿將 config.js 上傳到公開的 Git repository
// 
// =============================================

const CONFIG = {
  // =============================================
  // Supabase 設定
  // =============================================
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

  // =============================================
  // LINE Login 設定
  // =============================================
  LINE_CHANNEL_ID: '1234567890',
  LINE_CHANNEL_SECRET: 'your_channel_secret',
  LINE_SCOPE: 'profile openid email',
  LINE_STATE: 'random_state_string_' + Math.random().toString(36).substring(7),

  // =============================================
  // Supabase Edge Function URL
  // =============================================
  LINE_CALLBACK_FUNCTION_URL: 'https://your-project.supabase.co/functions/v1/line-login-callback',

  // =============================================
  // 應用程式 URL 設定
  // =============================================
  APP_BASE_URL: window.location.origin,
  LINE_CALLBACK_PATH: '/auth-callback.html',

  // =============================================
  // LINE Messaging API（第二階段使用）
  // =============================================
  LINE_MESSAGING_ACCESS_TOKEN: 'your_messaging_api_token',

  // =============================================
  // 系統設定
  // =============================================
  SESSION_KEY: 'member_system_session',
  ADMIN_SESSION_KEY: 'member_system_admin_session',
  SESSION_EXPIRY: 7 * 24 * 60 * 60 * 1000,

  // =============================================
  // 功能開關
  // =============================================
  FEATURES: {
    enableLineLogin: true,
    allowMemberEdit: true,
    showBirthday: true,
    showGender: true,
    debug: true,
  },

  // =============================================
  // UI 設定
  // =============================================
  UI: {
    shopName: '手機貼膜專門店',
    logoPath: 'images/logo.svg',
    primaryColor: '#007AFF',
    secondaryColor: '#5856D6',
    successColor: '#34C759',
    warningColor: '#FF9500',
    errorColor: '#FF3B30',
    membersPerPage: 20,
  },

  // =============================================
  // 驗證規則
  // =============================================
  VALIDATION: {
    phonePattern: /^09\d{8}$/,
    phoneMessage: '請輸入有效的手機號碼（例如：0912345678）',
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    emailMessage: '請輸入有效的 Email 地址',
    nameMinLength: 2,
    nameMaxLength: 50,
  },
};

// 輔助函數
CONFIG.getCallbackUrl = function() {
  return this.APP_BASE_URL + this.LINE_CALLBACK_PATH;
};

CONFIG.getLineLoginUrl = function() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: this.LINE_CHANNEL_ID,
    redirect_uri: this.getCallbackUrl(),
    state: this.LINE_STATE,
    scope: this.LINE_SCOPE,
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
};

CONFIG.log = function(message, data = null) {
  if (this.FEATURES.debug) {
    console.log(`[會員系統] ${message}`, data || '');
  }
};

CONFIG.error = function(message, error = null) {
  console.error(`[會員系統錯誤] ${message}`, error || '');
};

CONFIG.validate = function() {
  const errors = [];
  
  if (this.SUPABASE_URL === 'https://your-project.supabase.co') {
    errors.push('請設定 SUPABASE_URL');
  }
  
  if (this.SUPABASE_ANON_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
    errors.push('請設定 SUPABASE_ANON_KEY');
  }
  
  if (this.LINE_CHANNEL_ID === '1234567890') {
    errors.push('請設定 LINE_CHANNEL_ID');
  }
  
  if (errors.length > 0) {
    console.warn('⚠️  配置尚未完成，請檢查以下項目：');
    errors.forEach(err => console.warn(`   - ${err}`));
    console.warn('📖 詳細設定說明請參考 SETUP.md');
    return false;
  }
  
  console.log('✅ 配置驗證通過');
  return true;
};

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    CONFIG.log('系統配置已載入');
    CONFIG.validate();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

