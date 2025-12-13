// =============================================
// Email 通知 API（使用 EmailJS）
// =============================================

const EmailNotificationAPI = {
    /**
     * 初始化 EmailJS
     */
    init() {
        if (typeof emailjs === 'undefined') {
            CONFIG.error('EmailJS 尚未載入');
            return false;
        }
        
        try {
            emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
            CONFIG.log('✅ EmailJS 初始化成功');
            return true;
        } catch (error) {
            CONFIG.error('❌ EmailJS 初始化失敗', error);
            return false;
        }
    },
    
    /**
     * 發送預約通知 Email 給店家
     * @param {Object} bookingData - 預約資訊
     * @returns {Promise<Object>} 發送結果
     */
    async sendBookingNotificationToShop(bookingData) {
        try {
            // 確保 EmailJS 已初始化
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS 尚未載入');
            }
            
            CONFIG.log('📧 準備發送預約通知 Email', bookingData);
            
            // 準備郵件參數
            const templateParams = {
                // 收件人（必須在 EmailJS 模板中設置為 {{to_email}}）
                to_email: CONFIG.SHOP_NOTIFICATION_EMAIL,
                shop_name: CONFIG.UI.shopName || 'NPHONE',
                
                // 會員資訊
                member_name: bookingData.member_name || '未提供',
                member_phone: bookingData.member_phone || '未提供',
                member_email: bookingData.member_email || '未提供',
                
                // 預約資訊
                service_name: bookingData.service_name || '未知服務',
                service_option: bookingData.service_option_name || '無',
                booking_date: this.formatDate(bookingData.booking_date),
                booking_time: bookingData.booking_time?.substring(0, 5) || '未知',
                notes: bookingData.notes || '無',
                
                // 系統資訊
                booking_id: bookingData.booking_id || bookingData.id || '未知',
                created_at: new Date().toLocaleString('zh-TW'),
                
                // 管理後台連結
                admin_url: `${CONFIG.APP_BASE_URL}/admin/bookings.html`
            };
            
            CONFIG.log('📤 發送 Email 參數', {
                service: CONFIG.EMAILJS_SERVICE_ID,
                template: CONFIG.EMAILJS_BOOKING_TEMPLATE_ID,
                params: templateParams
            });
            
            // 發送郵件
            const response = await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_BOOKING_TEMPLATE_ID,
                templateParams,
                CONFIG.EMAILJS_PUBLIC_KEY  // ⚠️ 需要傳入 Public Key
            );
            
            CONFIG.log('✅ 預約通知 Email 發送成功', response);
            return {
                success: true,
                response: response
            };
            
        } catch (error) {
            CONFIG.error('❌ 發送預約通知 Email 失敗', error);
            throw error;
        }
    },
    
    /**
     * 格式化日期
     * @param {string} dateString - 日期字串
     * @returns {string} 格式化後的日期
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
            });
        } catch (error) {
            return dateString;
        }
    }
};

// 導出到全域
if (typeof window !== 'undefined') {
    window.EmailNotificationAPI = EmailNotificationAPI;
}

CONFIG.log('✅ Email 通知 API 已載入');

