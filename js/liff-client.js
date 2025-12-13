/**
 * LINE LIFF Client
 * 處理 LINE LIFF (LINE Front-end Framework) 的初始化和功能
 */

const LiffClient = {
    // LIFF 是否已初始化
    initialized: false,
    
    // LIFF 是否在 LINE 環境中運行
    isInClient: false,
    
    // 用戶資訊
    profile: null,
    
    /**
     * 初始化 LIFF
     * @returns {Promise<boolean>} 是否成功初始化
     */
    async init() {
        try {
            // 檢查 LIFF SDK 是否已載入
            if (typeof liff === 'undefined') {
                CONFIG.log('LIFF SDK 未載入，使用一般網頁模式');
                return false;
            }
            
            // 檢查 LIFF ID 是否已設定
            if (!CONFIG.LIFF_ID) {
                CONFIG.log('LIFF ID 未設定，使用一般網頁模式');
                return false;
            }
            
            CONFIG.log('開始初始化 LIFF...');
            
            // 初始化 LIFF
            await liff.init({ 
                liffId: CONFIG.LIFF_ID 
            });
            
            this.initialized = true;
            this.isInClient = liff.isInClient();
            
            CONFIG.log('LIFF 初始化成功', {
                isInClient: this.isInClient,
                isLoggedIn: liff.isLoggedIn(),
                os: liff.getOS(),
                language: liff.getLanguage(),
                version: liff.getVersion()
            });
            
            return true;
            
        } catch (error) {
            CONFIG.error('LIFF 初始化失敗', error);
            return false;
        }
    },
    
    /**
     * 檢查是否已登入
     * @returns {boolean}
     */
    isLoggedIn() {
        if (!this.initialized) return false;
        return liff.isLoggedIn();
    },
    
    /**
     * LIFF 登入
     * @param {string} redirectUri - 登入後重導向的 URL
     */
    login(redirectUri = null) {
        if (!this.initialized) {
            CONFIG.error('LIFF 未初始化');
            return;
        }
        
        const options = {};
        if (redirectUri) {
            options.redirectUri = redirectUri;
        }
        
        liff.login(options);
    },
    
    /**
     * LIFF 登出
     */
    logout() {
        if (!this.initialized) return;
        
        liff.logout();
        this.profile = null;
        
        CONFIG.log('LIFF 登出成功');
    },
    
    /**
     * 取得用戶資訊
     * @returns {Promise<Object>} 用戶資訊
     */
    async getProfile() {
        if (!this.initialized || !this.isLoggedIn()) {
            throw new Error('LIFF 未登入');
        }
        
        if (this.profile) {
            return this.profile;
        }
        
        try {
            this.profile = await liff.getProfile();
            
            CONFIG.log('取得 LIFF 用戶資訊', {
                userId: this.profile.userId,
                displayName: this.profile.displayName
            });
            
            return this.profile;
            
        } catch (error) {
            CONFIG.error('取得 LIFF 用戶資訊失敗', error);
            throw error;
        }
    },
    
    /**
     * 取得 Access Token
     * @returns {string}
     */
    getAccessToken() {
        if (!this.initialized || !this.isLoggedIn()) {
            return null;
        }
        
        return liff.getAccessToken();
    },
    
    /**
     * 取得 ID Token
     * @returns {string}
     */
    getIDToken() {
        if (!this.initialized || !this.isLoggedIn()) {
            return null;
        }
        
        return liff.getIDToken();
    },
    
    /**
     * 關閉 LIFF 視窗
     */
    closeWindow() {
        if (!this.initialized) return;
        
        liff.closeWindow();
    },
    
    /**
     * 開啟外部連結
     * @param {string} url - 連結 URL
     * @param {boolean} external - 是否使用外部瀏覽器
     */
    openWindow(url, external = false) {
        if (!this.initialized) {
            window.open(url, external ? '_blank' : '_self');
            return;
        }
        
        liff.openWindow({
            url: url,
            external: external
        });
    },
    
    /**
     * 發送訊息給自己（僅限 1-on-1 聊天）
     * @param {Array} messages - LINE 訊息物件陣列
     * @returns {Promise<void>}
     */
    async sendMessages(messages) {
        if (!this.initialized) {
            throw new Error('LIFF 未初始化');
        }
        
        try {
            await liff.sendMessages(messages);
            CONFIG.log('訊息發送成功');
        } catch (error) {
            CONFIG.error('訊息發送失敗', error);
            throw error;
        }
    },
    
    /**
     * 分享目標選擇器
     * @param {Array} messages - LINE 訊息物件陣列
     * @returns {Promise<void>}
     */
    async shareTargetPicker(messages) {
        if (!this.initialized) {
            throw new Error('LIFF 未初始化');
        }
        
        try {
            const result = await liff.shareTargetPicker(messages);
            
            if (result) {
                CONFIG.log('分享成功');
            } else {
                CONFIG.log('使用者取消分享');
            }
            
            return result;
            
        } catch (error) {
            CONFIG.error('分享失敗', error);
            throw error;
        }
    },
    
    /**
     * 掃描 QR Code
     * @returns {Promise<string>} QR Code 內容
     */
    async scanCode() {
        if (!this.initialized) {
            throw new Error('LIFF 未初始化');
        }
        
        try {
            const result = await liff.scanCode();
            CONFIG.log('QR Code 掃描結果', result);
            return result.value;
            
        } catch (error) {
            CONFIG.error('QR Code 掃描失敗', error);
            throw error;
        }
    },
    
    /**
     * 取得運行環境資訊
     * @returns {Object}
     */
    getContext() {
        if (!this.initialized) return null;
        
        return {
            type: liff.getContext()?.type || 'none',
            viewType: liff.getContext()?.viewType || 'none',
            userId: liff.getContext()?.userId || null,
            utouId: liff.getContext()?.utouId || null,
            roomId: liff.getContext()?.roomId || null,
            groupId: liff.getContext()?.groupId || null
        };
    },
    
    /**
     * 取得作業系統
     * @returns {string} 'ios', 'android', 'web'
     */
    getOS() {
        if (!this.initialized) return 'web';
        return liff.getOS();
    },
    
    /**
     * 取得語言
     * @returns {string}
     */
    getLanguage() {
        if (!this.initialized) return 'zh-TW';
        return liff.getLanguage();
    },
    
    /**
     * 取得 LIFF 版本
     * @returns {string}
     */
    getVersion() {
        if (!this.initialized) return null;
        return liff.getVersion();
    },
    
    /**
     * 檢查是否支援某功能
     * @param {string} feature - 功能名稱
     * @returns {boolean}
     */
    isApiAvailable(feature) {
        if (!this.initialized) return false;
        return liff.isApiAvailable(feature);
    },
    
    /**
     * 取得永久連結
     * @returns {Promise<string>}
     */
    async getPermanentLink() {
        if (!this.initialized) {
            throw new Error('LIFF 未初始化');
        }
        
        try {
            const link = await liff.permanentLink.createUrl();
            CONFIG.log('永久連結', link);
            return link;
            
        } catch (error) {
            CONFIG.error('取得永久連結失敗', error);
            throw error;
        }
    }
};

// 導出到全域
if (typeof window !== 'undefined') {
    window.LiffClient = LiffClient;
}

CONFIG.log('✅ LIFF Client 已載入');

