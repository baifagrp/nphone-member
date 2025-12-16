/**
 * Email 驗證 API
 * 處理 Email 驗證碼生成、發送和驗證
 */

const EmailVerificationAPI = {
    /**
     * 生成並發送驗證碼
     * @param {string} email - Email 地址
     * @param {string} lineUserId - LINE User ID
     * @returns {Promise<Object>} 發送結果
     */
    async sendVerificationCode(email, lineUserId) {
        try {
            const client = getSupabase();
            
            // 1. 生成驗證碼
            const { data: code, error: codeError } = await client.rpc('generate_verification_code', {
                p_email: email,
                p_line_user_id: lineUserId
            });
            
            if (codeError) throw codeError;
            
            // ⚠️ 安全性：不應在 console 顯示驗證碼
            CONFIG.log('驗證碼已生成並發送', { email });
            
            // 2. 使用 EmailJS 發送驗證碼
            // 注意：需要在 HTML 中引入 EmailJS SDK
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS SDK 未載入');
            }
            
            // EmailJS 配置（請替換為您的實際配置）
            const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // 請在 config.js 中設置
            const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // 請在 config.js 中設置
            const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // 請在 config.js 中設置
            
            // 發送郵件
            const emailParams = {
                to_email: email,
                verification_code: code,
                to_name: 'NPHONE 會員',
                expiry_minutes: '10',
                now_year: new Date().getFullYear().toString()  // 當前年份
            };
            
            await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID,
                emailParams,
                CONFIG.EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY
            );
            
            CONFIG.log('驗證碼郵件已發送', { email });
            
            return {
                success: true,
                message: '驗證碼已發送至您的 Email',
                email: email
            };
            
        } catch (error) {
            CONFIG.error('發送驗證碼失敗', error);
            
            // 處理特定錯誤
            if (error.message && error.message.includes('太頻繁')) {
                throw new Error('驗證碼發送太頻繁，請稍後再試');
            }
            
            throw error;
        }
    },
    
    /**
     * 驗證驗證碼
     * @param {string} email - Email 地址
     * @param {string} code - 驗證碼
     * @returns {Promise<Object>} 驗證結果
     */
    async verifyCode(email, code) {
        try {
            const client = getSupabase();
            
            const { data, error } = await client.rpc('verify_email_code', {
                p_email: email,
                p_code: code
            });
            
            if (error) throw error;
            
            CONFIG.log('Email 驗證成功', data);
            
            return data;
            
        } catch (error) {
            CONFIG.error('Email 驗證失敗', error);
            
            if (error.message && error.message.includes('無效或已過期')) {
                throw new Error('驗證碼無效或已過期，請重新獲取');
            }
            
            throw error;
        }
    },
    
    /**
     * 完成註冊（綁定 LINE 或創建新會員）
     * @param {string} email - Email 地址
     * @param {string} lineUserId - LINE User ID（可選，網頁註冊時為 null）
     * @param {string} lineDisplayName - LINE 顯示名稱（可選）
     * @param {string} linePictureUrl - LINE 頭像 URL（可選）
     * @returns {Promise<Object>} 註冊結果
     */
    async completeRegistration(email, lineUserId = null, lineDisplayName = null, linePictureUrl = null) {
        try {
            const client = getSupabase();
            
            // 準備參數（lineUserId 可能是 null）
            const params = {
                p_email: email,
                p_line_user_id: lineUserId
            };
            
            // 只有在有 LINE 資料時才傳遞
            if (lineDisplayName) {
                params.p_line_display_name = lineDisplayName;
            }
            if (linePictureUrl) {
                params.p_line_picture_url = linePictureUrl;
            }
            
            const { data, error } = await client.rpc('complete_registration', params);
            
            if (error) throw error;
            
            CONFIG.log('註冊完成', data);
            
            return data;
            
        } catch (error) {
            CONFIG.error('完成註冊失敗', error);
            throw error;
        }
    },
    
    /**
     * 檢查 Email 是否已存在
     * @param {string} email - Email 地址
     * @returns {Promise<boolean>} 是否存在
     */
    async checkEmailExists(email) {
        try {
            const client = getSupabase();
            
            const { data, error } = await client.rpc('check_email_exists', {
                p_email: email
            });
            
            if (error) throw error;
            
            CONFIG.log('Email 存在檢查', { email, exists: data });
            
            return data; // 直接返回 boolean
            
        } catch (error) {
            CONFIG.error('檢查 Email 失敗', error);
            throw error;
        }
    },
    
    /**
     * Email 登入
     * @param {string} email - Email 地址
     * @returns {Promise<Object>} 登入結果
     */
    async emailLogin(email) {
        try {
            const client = getSupabase();
            
            const { data, error } = await client.rpc('email_login', {
                p_email: email
            });
            
            if (error) throw error;
            
            CONFIG.log('Email 登入成功', data);
            
            return data;
            
        } catch (error) {
            CONFIG.error('Email 登入失敗', error);
            throw error;
        }
    },
    
    /**
     * 關聯 LINE 帳號到現有 Email 會員
     * @param {string} email - Email 地址
     * @param {string} lineUserId - LINE User ID
     * @param {string} lineDisplayName - LINE 顯示名稱
     * @param {string} linePictureUrl - LINE 頭像 URL
     * @returns {Promise<Object>} 關聯結果
     */
    async linkLineAccount(email, lineUserId, lineDisplayName = null, linePictureUrl = null) {
        try {
            const client = getSupabase();
            
            const { data, error } = await client.rpc('link_line_account', {
                p_email: email,
                p_line_user_id: lineUserId,
                p_line_display_name: lineDisplayName,
                p_line_picture_url: linePictureUrl
            });
            
            if (error) throw error;
            
            CONFIG.log('LINE 帳號關聯成功', data);
            
            return data;
            
        } catch (error) {
            CONFIG.error('LINE 帳號關聯失敗', error);
            throw error;
        }
    },
    
    /**
     * 驗證 Email 格式
     * @param {string} email - Email 地址
     * @returns {boolean} 是否有效
     */
    isValidEmail(email) {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    },
    
    /**
     * 格式化倒數計時
     * @param {number} seconds - 秒數
     * @returns {string} 格式化的時間
     */
    formatCountdown(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

// 導出到全域
if (typeof window !== 'undefined') {
    window.EmailVerificationAPI = EmailVerificationAPI;
}

CONFIG.log('✅ Email 驗證 API 已載入');

