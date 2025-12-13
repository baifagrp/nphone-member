// =============================================
// 通知 API
// =============================================

const NotificationAPI = {
    /**
     * 取得會員的通知設定
     * @param {string} memberId - 會員 ID
     * @returns {Promise<Object>} 通知設定
     */
    async getSettings(memberId) {
        try {
            const { data, error } = await getSupabase()
                .from('notification_settings')
                .select('*')
                .eq('member_id', memberId)
                .single();
            
            if (error) throw error;
            
            // 如果不存在，創建預設設定
            if (!data) {
                return await this.createDefaultSettings(memberId);
            }
            
            CONFIG.log('取得通知設定成功', data);
            return data;
        } catch (error) {
            CONFIG.error('取得通知設定失敗', error);
            throw error;
        }
    },
    
    /**
     * 建立預設通知設定
     * @param {string} memberId - 會員 ID
     * @returns {Promise<Object>} 通知設定
     */
    async createDefaultSettings(memberId) {
        try {
            const { data, error } = await getSupabase()
                .from('notification_settings')
                .insert({
                    member_id: memberId,
                    booking_reminder_enabled: true,
                    birthday_greeting_enabled: true,
                    wallet_notification_enabled: true,
                    points_notification_enabled: true,
                    promotion_enabled: true,
                    booking_reminder_hours: 24
                })
                .select()
                .single();
            
            if (error) throw error;
            
            CONFIG.log('建立預設通知設定成功', data);
            return data;
        } catch (error) {
            CONFIG.error('建立預設通知設定失敗', error);
            throw error;
        }
    },
    
    /**
     * 更新通知設定
     * @param {string} memberId - 會員 ID
     * @param {Object} settings - 要更新的設定
     * @returns {Promise<Object>} 更新後的通知設定
     */
    async updateSettings(memberId, settings) {
        try {
            const { data, error } = await getSupabase()
                .from('notification_settings')
                .update(settings)
                .eq('member_id', memberId)
                .select()
                .single();
            
            if (error) throw error;
            
            CONFIG.log('更新通知設定成功', data);
            return data;
        } catch (error) {
            CONFIG.error('更新通知設定失敗', error);
            throw error;
        }
    },
    
    /**
     * 取得通知記錄
     * @param {string} memberId - 會員 ID
     * @param {Object} options - 查詢選項 { type, limit, offset }
     * @returns {Promise<Array>} 通知記錄列表
     */
    async getLogs(memberId, options = {}) {
        try {
            let query = getSupabase()
                .from('notification_logs')
                .select('*')
                .eq('member_id', memberId)
                .order('created_at', { ascending: false });
            
            // 篩選類型
            if (options.type) {
                query = query.eq('notification_type', options.type);
            }
            
            // 分頁
            if (options.limit) {
                query = query.limit(options.limit);
            }
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            CONFIG.log('取得通知記錄成功', { count: data?.length || 0 });
            return data || [];
        } catch (error) {
            CONFIG.error('取得通知記錄失敗', error);
            throw error;
        }
    },
    
    /**
     * 發送 LINE 訊息
     * @param {Object} params - 發送參數
     * @returns {Promise<Object>} 發送結果
     */
    async sendLineMessage(params) {
        try {
            const {
                lineUserId,
                message,
                notificationType = 'system',
                relatedBookingId = null,
                relatedTransactionId = null
            } = params;
            
            if (!lineUserId || !message) {
                throw new Error('缺少必要參數：lineUserId 或 message');
            }
            
            CONFIG.log('準備發送 LINE 訊息', { lineUserId, type: notificationType });
            
            const response = await fetch(CONFIG.EDGE_FUNCTIONS.SEND_LINE_MESSAGE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    lineUserId,
                    message,
                    notificationType,
                    relatedBookingId,
                    relatedTransactionId
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '發送 LINE 訊息失敗');
            }
            
            const result = await response.json();
            CONFIG.log('發送 LINE 訊息成功', result);
            return result;
        } catch (error) {
            CONFIG.error('發送 LINE 訊息失敗', error);
            throw error;
        }
    },
    
    /**
     * 發送預約成功通知（建立預約時）
     * @param {string} lineUserId - LINE 使用者 ID
     * @param {Object} booking - 預約資訊
     * @returns {Promise<Object>} 發送結果
     */
    async sendBookingCreated(lineUserId, booking) {
        const message = `✅ 預約已成功建立！\n\n` +
            `親愛的 ${booking.member_name || '顧客'} 您好，\n\n` +
            `您的預約已成功提交，目前狀態為【待確認】\n\n` +
            `📱 服務項目：${booking.service_name}\n` +
            `${booking.service_option_name ? `    選項：${booking.service_option_name}\n` : ''}` +
            `📅 預約日期：${booking.booking_date}\n` +
            `⏰ 預約時間：${booking.booking_time}\n` +
            `${booking.notes ? `📝 備註：${booking.notes}\n` : ''}` +
            `\n` +
            `⏳ 我們將盡快為您確認預約，請稍候。\n` +
            `如有任何問題，歡迎隨時聯繫我們！\n\n` +
            `NPHONE 感謝您的預約 ❤️`;
        
        return await this.sendLineMessage({
            lineUserId,
            message,
            notificationType: 'booking_created',
            relatedBookingId: booking.id
        });
    },
    
    /**
     * 發送預約確認通知（管理員確認後）
     * @param {string} lineUserId - LINE 使用者 ID
     * @param {Object} booking - 預約資訊
     * @returns {Promise<Object>} 發送結果
     */
    async sendBookingConfirmed(lineUserId, booking) {
        const message = `✅ 預約已確認！\n\n` +
            `親愛的 ${booking.member_name || '顧客'} 您好，\n\n` +
            `您的預約已經確認囉！\n\n` +
            `📱 服務項目：${booking.service_name}\n` +
            `📅 預約日期：${booking.booking_date}\n` +
            `⏰ 預約時間：${booking.booking_time}\n` +
            `\n` +
            `請準時到店，期待您的光臨！😊\n\n` +
            `NPHONE`;
        
        return await this.sendLineMessage({
            lineUserId,
            message,
            notificationType: 'booking_confirmed',
            relatedBookingId: booking.id
        });
    },
    
    /**
     * 發送預約提醒（預約前一天/當天）
     * @param {string} lineUserId - LINE 使用者 ID
     * @param {Object} booking - 預約資訊
     * @returns {Promise<Object>} 發送結果
     */
    async sendBookingReminder(lineUserId, booking) {
        const message = `⏰ 預約提醒\n\n` +
            `親愛的 ${booking.member_name} 您好，\n\n` +
            `提醒您即將到來的預約：\n` +
            `📅 日期：${booking.booking_date}\n` +
            `⏰ 時間：${booking.booking_time}\n` +
            `📱 服務：${booking.service_name}\n\n` +
            `期待您的光臨！如需取消或調整，請聯繫我們。`;
        
        return await this.sendLineMessage({
            lineUserId,
            message,
            notificationType: 'booking_reminder',
            relatedBookingId: booking.id
        });
    },
    
    /**
     * 發送生日祝福
     * @param {string} lineUserId - LINE 使用者 ID
     * @param {string} memberName - 會員姓名
     * @returns {Promise<Object>} 發送結果
     */
    async sendBirthdayGreeting(lineUserId, memberName) {
        const message = `🎂 生日快樂！\n\n` +
            `親愛的 ${memberName}，\n\n` +
            `NPHONE 全體員工祝您生日快樂！🎉\n` +
            `祝您天天開心，事事順心！\n\n` +
            `感謝您一直以來的支持與愛護 ❤️`;
        
        return await this.sendLineMessage({
            lineUserId,
            message,
            notificationType: 'birthday_greeting'
        });
    },
    
    /**
     * 發送儲值金變動通知
     * @param {string} lineUserId - LINE 使用者 ID
     * @param {Object} transaction - 交易資訊
     * @returns {Promise<Object>} 發送結果
     */
    async sendWalletNotification(lineUserId, transaction) {
        const isTopup = transaction.transaction_type === 'topup';
        const emoji = isTopup ? '💰' : '💳';
        const action = isTopup ? '儲值' : '消費';
        
        const message = `${emoji} 儲值金${action}通知\n\n` +
            `您的儲值金已${action} NT$ ${transaction.amount}\n` +
            `目前餘額：NT$ ${transaction.new_balance}\n\n` +
            `交易時間：${new Date(transaction.created_at).toLocaleString('zh-TW')}`;
        
        return await this.sendLineMessage({
            lineUserId,
            message,
            notificationType: 'wallet_change',
            relatedTransactionId: transaction.id
        });
    },
    
    /**
     * 發送積分變動通知
     * @param {string} lineUserId - LINE 使用者 ID
     * @param {Object} transaction - 積分交易資訊
     * @returns {Promise<Object>} 發送結果
     */
    async sendPointsNotification(lineUserId, transaction) {
        const isEarn = transaction.transaction_type === 'earn';
        const emoji = isEarn ? '⭐' : '🎁';
        const action = isEarn ? '獲得' : '使用';
        
        const message = `${emoji} 積分${action}通知\n\n` +
            `您已${action} ${Math.abs(transaction.points)} 點積分\n` +
            `目前積分：${transaction.new_balance} 點\n\n` +
            `交易時間：${new Date(transaction.created_at).toLocaleString('zh-TW')}`;
        
        return await this.sendLineMessage({
            lineUserId,
            message,
            notificationType: 'points_change',
            relatedTransactionId: transaction.id
        });
    },
    
    /**
     * 發送優惠活動通知
     * @param {string} lineUserId - LINE 使用者 ID
     * @param {Object} promotion - 活動資訊
     * @returns {Promise<Object>} 發送結果
     */
    async sendPromotionNotification(lineUserId, promotion) {
        const message = `🎉 ${promotion.title}\n\n` +
            `${promotion.description}\n\n` +
            `活動期間：${promotion.start_date} ~ ${promotion.end_date}\n\n` +
            `立即預約享優惠！`;
        
        return await this.sendLineMessage({
            lineUserId,
            message,
            notificationType: 'promotion'
        });
    }
};

// 導出到全域
if (typeof window !== 'undefined') {
    window.NotificationAPI = NotificationAPI;
}

CONFIG.log('✅ 通知 API 已載入');

