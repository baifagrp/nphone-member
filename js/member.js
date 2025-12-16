// =============================================
// 會員端功能
// =============================================

const Member = {
  // 當前會員資料
  currentMember: null,
  
  // =============================================
  // 初始化會員頁面
  // =============================================
  async init() {
    CONFIG.log('初始化會員頁面');
    
    // 檢查登入狀態
    if (!Auth.requireMemberLogin()) {
      return;
    }
    
    // 從 Session 取得會員資料
    const session = Auth.getMemberSession();
    this.currentMember = session.member;
    
    // 重新從資料庫載入最新資料
    try {
      let latestMember = null;
      
      // 如果有 LINE user id，優先使用它查詢
      if (session.lineUserId) {
        latestMember = await MemberAPI.getByLineId(session.lineUserId);
      }
      
      // 如果沒找到且有 member id，使用 member id 查詢
      if (!latestMember && session.member?.id) {
        CONFIG.log('使用 member id 查詢會員資料');
        latestMember = await MemberAPI.getById(session.member.id);
      }
      
      if (latestMember) {
        this.currentMember = latestMember;
        // 更新 Session
        Auth.saveMemberSession(latestMember, session.lineUserId || null, session.accessToken);
      } else {
        // 如果資料庫中找不到會員，使用 Session 中的資料
        CONFIG.log('資料庫中找不到會員，使用 Session 資料');
      }
    } catch (error) {
      CONFIG.error('載入會員資料失敗', error);
      // 載入失敗時，繼續使用 Session 中的資料，不影響登入狀態
      if (!this.currentMember && session.member) {
        this.currentMember = session.member;
      }
    }
    
    CONFIG.log('當前會員', this.currentMember);
    return this.currentMember;
  },
  
  // =============================================
  // 顯示會員資料
  // =============================================
  displayProfile() {
    if (!this.currentMember) return;
    
    const member = this.currentMember;
    
    // 設定各個欄位
    this.setElementText('member-name', member.name);
    this.setElementText('member-phone', member.phone || '未設定');
    this.setElementText('member-email', member.email || '未設定');
    this.setElementText('member-birthday', formatDate(member.birthday) || '未設定');
    this.setElementText('member-gender', this.formatGender(member.gender));
    this.setElementText('member-joined', formatDate(member.created_at));
    
    // 設定頭像
    const avatar = document.getElementById('member-avatar');
    if (avatar && member.avatar_url) {
      avatar.src = member.avatar_url;
    }
    
    // 顯示 LINE 綁定狀態
    const lineStatus = document.getElementById('line-status');
    if (lineStatus) {
      if (member.line_user_id) {
        lineStatus.innerHTML = '<span class="status-badge status-success">已綁定</span>';
      } else {
        lineStatus.innerHTML = '<span class="status-badge status-warning">未綁定</span>';
      }
    }
  },
  
  // =============================================
  // 載入編輯表單
  // =============================================
  loadEditForm() {
    if (!this.currentMember) return;
    
    const member = this.currentMember;
    
    // 填充表單
    this.setInputValue('edit-name', member.name);
    this.setInputValue('edit-phone', member.phone);
    this.setInputValue('edit-email', member.email);
    this.setInputValue('edit-birthday', member.birthday);
    this.setInputValue('edit-gender', member.gender);
    
    // 設定頭像預覽
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview && member.avatar_url) {
      avatarPreview.src = member.avatar_url;
    }
  },
  
  // =============================================
  // 儲存會員資料
  // =============================================
  async saveProfile(formData) {
    try {
      showLoading('儲存中...');
      
      // 驗證資料
      if (!formData.name || formData.name.trim().length < CONFIG.VALIDATION.nameMinLength) {
        throw new Error(`姓名至少需要 ${CONFIG.VALIDATION.nameMinLength} 個字元`);
      }
      
      if (formData.phone && !validatePhone(formData.phone)) {
        throw new Error(CONFIG.VALIDATION.phoneMessage);
      }
      
      if (formData.email && !validateEmail(formData.email)) {
        throw new Error(CONFIG.VALIDATION.emailMessage);
      }
      
      // 取得 session 和會員 ID
      const session = Auth.getMemberSession();
      if (!session || !session.member) {
        throw new Error('無法取得會員資料');
      }
      
      let updated = null;
      
      // 如果有 LINE user id，使用 updateByLineId（會自動驗證 line_user_id）
      if (session.lineUserId) {
        updated = await MemberAPI.updateByLineId(session.lineUserId, {
          name: formData.name.trim(),
          phone: formData.phone || null,
          email: formData.email || null,
          birthday: formData.birthday || null,
          gender: formData.gender || null,
        });
      } else if (session.member.id) {
        // 如果沒有 LINE user id，使用 member id 更新（純 Email 會員）
        // 使用 RPC 函數，避免 RLS 政策問題
        CONFIG.log('使用 member id 更新會員資料（純 Email 會員）');
        updated = await MemberAPI.updateById(session.member.id, {
          name: formData.name.trim(),
          phone: formData.phone || null,
          email: formData.email || null,
          birthday: formData.birthday || null,
          gender: formData.gender || null,
        });
      } else {
        throw new Error('無法取得會員 ID');
      }
      
      // 更新本地資料
      this.currentMember = updated;
      
      // 更新 Session
      Auth.saveMemberSession(updated, session.lineUserId || null, session.accessToken);
      
      hideLoading();
      showMessage('資料儲存成功！', 'success');
      
      CONFIG.log('會員資料已更新', updated);
      return updated;
      
    } catch (error) {
      hideLoading();
      CONFIG.error('儲存會員資料失敗', error);
      
      // 解析錯誤訊息
      let errorMessage = '儲存失敗，請稍後再試';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
      
      showMessage(errorMessage, 'error');
      throw error;
    }
  },
  
  // =============================================
  // 輔助函數
  // =============================================
  
  setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text || '-';
    }
  },
  
  setInputValue(id, value) {
    const input = document.getElementById(id);
    if (input) {
      input.value = value || '';
    }
  },
  
  formatGender(gender) {
    const genderMap = {
      'male': '男性',
      'female': '女性',
      'other': '其他',
      'prefer_not_to_say': '不願透露',
    };
    return genderMap[gender] || '未設定';
  },
};

// =============================================
// 會員端頁面事件處理
// =============================================

// 首頁：LINE 登入按鈕
if (document.getElementById('btn-line-login')) {
  document.getElementById('btn-line-login').addEventListener('click', () => {
    Auth.startLineLogin();
  });
}

// 會員中心：登出按鈕
if (document.getElementById('btn-logout')) {
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('確定要登出嗎？')) {
      Auth.memberLogout();
    }
  });
}

// 編輯頁面：表單提交
if (document.getElementById('form-edit-profile')) {
  document.getElementById('form-edit-profile').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('edit-name').value,
      phone: document.getElementById('edit-phone').value,
      email: document.getElementById('edit-email').value,
      birthday: document.getElementById('edit-birthday').value,
      gender: document.getElementById('edit-gender').value,
    };
    
    try {
      await Member.saveProfile(formData);
      
      // 儲存成功後導回個人中心
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 1000);
    } catch (error) {
      // 錯誤已在 saveProfile 中處理
    }
  });
}

// 編輯頁面：取消按鈕
if (document.getElementById('btn-cancel-edit')) {
  document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

