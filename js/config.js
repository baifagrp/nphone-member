// =============================================
// 系統配置檔案
// =============================================
// 
// 📝 使用說明：
// 1. 將此檔案中的所有設定值替換為您的實際值
// 2. 所有值都可以在 SETUP.md 中找到取得方式
// 3. 請勿將此檔案上傳到公開的 Git repository（已加入 .gitignore）
// 
// =============================================

const CONFIG = {
  // =============================================
  // Supabase 設定
  // =============================================
  // 從 Supabase Dashboard > Settings > API 取得
  SUPABASE_URL: 'https://czjdqxfhuhtwzxhrczir.supabase.co',  // 替換為您的 Project URL
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6amRxeGZodWh0d3p4aHJjemlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Mjc5MzMsImV4cCI6MjA4MTAwMzkzM30.I0XxWF4ryAkttVAKx4GFkG67olDTb0K6qAp9n7lkiTo',  // 替換為您的 anon public key

  // =============================================
  // LINE Login 設定
  // =============================================
  // 從 LINE Developers Console 取得
  LINE_CHANNEL_ID: '2008674758',  // 替換為您的 LINE Login Channel ID
  LINE_CHANNEL_SECRET: 'bd568a07c31a9a09fb5d3bcad142aaa6',  // 替換為您的 Channel Secret（後端使用）
  
  // LINE Login 授權範圍
  LINE_SCOPE: 'profile openid email',  // 不需修改
  
  // LINE Login 狀態（用於安全驗證）
  LINE_STATE: 'random_state_string_' + Math.random().toString(36).substring(7),  // 自動生成
  
  // =============================================
  // Supabase Edge Function URL
  // =============================================
  // 部署 Edge Function 後，從 Supabase 取得此 URL
  LINE_CALLBACK_FUNCTION_URL: 'https://czjdqxfhuhtwzxhrczir.supabase.co/functions/v1/line-login-callback',
  CREATE_BOOKING_FUNCTION_URL: 'https://czjdqxfhuhtwzxhrczir.supabase.co/functions/v1/create-booking',
  
  // =============================================
  // 應用程式 URL 設定
  // =============================================
  // 根據您的部署環境設定
  APP_BASE_URL: window.location.origin,  // 自動偵測，或手動設定如 'https://your-domain.com'
  
  // 回調頁面路徑
  LINE_CALLBACK_PATH: '/auth/callback.html',
  
  // =============================================
  // LINE Messaging API（第二階段使用）
  // =============================================
  // 從 LINE Developers Console > Messaging API 取得
  LINE_MESSAGING_ACCESS_TOKEN: 'your_messaging_api_token',  // 選擇性，未來通知功能使用
  
  // =============================================
  // 系統設定
  // =============================================
  // Session 儲存 key
  SESSION_KEY: 'member_system_session',
  
  // 管理員 Session key
  ADMIN_SESSION_KEY: 'member_system_admin_session',
  
  // Session 過期時間（毫秒）
  SESSION_EXPIRY: 7 * 24 * 60 * 60 * 1000,  // 7 天
  
  // =============================================
  // 功能開關
  // =============================================
  FEATURES: {
    // 是否啟用 LINE Login
    enableLineLogin: true,
    
    // 是否允許會員編輯個人資料
    allowMemberEdit: true,
    
    // 是否顯示生日欄位
    showBirthday: true,
    
    // 是否顯示性別欄位
    showGender: true,
    
    // 是否啟用 debug 模式（在 console 顯示詳細資訊）
    debug: true,
  },
  
  // =============================================
  // UI 設定
  // =============================================
  UI: {
    // 店家名稱
    shopName: 'NPHONE-KHJG',
    
    // 店家 Logo 路徑
    logoPath: 'images/logo.svg',
    
    // 主題顏色（Apple 風格）
    primaryColor: '#007AFF',
    secondaryColor: '#5856D6',
    successColor: '#34C759',
    warningColor: '#FF9500',
    errorColor: '#FF3B30',
    
    // 每頁顯示會員數量（後台）
    membersPerPage: 20,
  },
  
  // =============================================
  // 驗證規則
  // =============================================
  VALIDATION: {
    // 電話號碼格式（台灣）
    phonePattern: /^09\d{8}$/,
    phoneMessage: '請輸入有效的手機號碼（例如：0912345678）',
    
    // Email 格式
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    emailMessage: '請輸入有效的 Email 地址',
    
    // 姓名長度
    nameMinLength: 2,
    nameMaxLength: 50,
  },
};

// =============================================
// 輔助函數：取得完整的回調 URL
// =============================================
CONFIG.getCallbackUrl = function() {
  return this.APP_BASE_URL + this.LINE_CALLBACK_PATH;
};

// =============================================
// 輔助函數：取得 LINE Login URL
// =============================================
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

// =============================================
// 輔助函數：Debug 日誌
// =============================================
CONFIG.log = function(message, data = null) {
  if (this.FEATURES.debug) {
    console.log(`[會員系統] ${message}`, data || '');
  }
};

// =============================================
// 輔助函數：錯誤日誌
// =============================================
CONFIG.error = function(message, error = null) {
  console.error(`[會員系統錯誤] ${message}`, error || '');
};

// =============================================
// 驗證配置是否完整
// =============================================
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

// =============================================
// 頁面載入時驗證配置
// =============================================
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    CONFIG.log('系統配置已載入');
    CONFIG.validate();
  });
}

// 匯出配置（用於其他 JS 檔案）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

