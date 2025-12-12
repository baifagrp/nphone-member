// =============================================
// 管理後台功能
// =============================================

const Admin = {
  // 當前管理員資料
  currentAdmin: null,
  
  // 會員列表
  members: [],
  totalMembers: 0,
  currentPage: 1,
  
  // =============================================
  // 初始化管理後台
  // =============================================
  async init() {
    CONFIG.log('初始化管理後台');
    
    // 檢查登入狀態
    if (!Auth.requireAdminLogin()) {
      return;
    }
    
    // 驗證管理員身份
    const isValid = await Auth.verifyAdminAuth();
    if (!isValid) {
      if (typeof UI !== 'undefined') {
        UI.error('身份驗證失敗，請重新登入');
      } else {
        alert('身份驗證失敗，請重新登入');
      }
      Auth.adminLogout();
      return;
    }
    
    // 取得管理員資料
    const session = Auth.getAdminSession();
    this.currentAdmin = session.user;
    
    CONFIG.log('當前管理員', this.currentAdmin);
    return this.currentAdmin;
  },
  
  // =============================================
  // 管理員登入處理
  // =============================================
  async handleLogin(email, password) {
    try {
      showLoading('登入中...');
      
      await Auth.adminLogin(email, password);
      
      hideLoading();
      showMessage('登入成功！', 'success');
      
      // 導向後台首頁
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
      
    } catch (error) {
      hideLoading();
      showMessage(error.message || '登入失敗', 'error');
      throw error;
    }
  },
  
  // =============================================
  // 載入會員列表
  // =============================================
  async loadMembers(page = 1) {
    try {
      showLoading('載入會員列表...');
      
      const limit = CONFIG.UI.membersPerPage;
      const offset = (page - 1) * limit;
      
      const result = await MemberAPI.getAll(limit, offset);
      
      this.members = result.members;
      this.totalMembers = result.total;
      this.currentPage = page;
      
      hideLoading();
      
      CONFIG.log(`載入 ${this.members.length} 位會員`);
      return result;
      
    } catch (error) {
      hideLoading();
      CONFIG.error('載入會員列表失敗', error);
      showMessage('載入失敗，請重新整理頁面', 'error');
      throw error;
    }
  },
  
  // =============================================
  // 顯示會員列表
  // =============================================
  displayMemberList() {
    const tbody = document.getElementById('members-tbody');
    if (!tbody) return;
    
    if (this.members.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
            尚無會員資料
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = this.members.map((member, index) => `
      <tr onclick="location.href='member-detail.html?id=${member.id}'" style="cursor: pointer;">
        <td>${(this.currentPage - 1) * CONFIG.UI.membersPerPage + index + 1}</td>
        <td>
          <div class="member-info">
            ${member.avatar_url ? `<img src="${member.avatar_url}" alt="${member.name}" class="member-avatar-small">` : ''}
            <span>${member.name}</span>
          </div>
        </td>
        <td>${member.phone || '-'}</td>
        <td>${member.email || '-'}</td>
        <td>
          ${member.line_user_id 
            ? '<span class="status-badge status-success">已綁定</span>' 
            : '<span class="status-badge status-gray">未綁定</span>'}
        </td>
        <td>${formatDate(member.created_at)}</td>
      </tr>
    `).join('');
    
    // 更新分頁資訊
    this.updatePagination();
  },
  
  // =============================================
  // 更新分頁資訊
  // =============================================
  updatePagination() {
    const paginationInfo = document.getElementById('pagination-info');
    const totalPages = Math.ceil(this.totalMembers / CONFIG.UI.membersPerPage);
    
    if (paginationInfo) {
      paginationInfo.textContent = `第 ${this.currentPage} 頁 / 共 ${totalPages} 頁（總計 ${this.totalMembers} 位會員）`;
    }
    
    // 更新分頁按鈕狀態
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    
    if (btnPrev) {
      btnPrev.disabled = this.currentPage === 1;
    }
    
    if (btnNext) {
      btnNext.disabled = this.currentPage >= totalPages;
    }
  },
  
  // =============================================
  // 搜尋會員
  // =============================================
  async searchMembers(keyword) {
    try {
      if (!keyword || keyword.trim() === '') {
        // 空搜尋，重新載入全部
        await this.loadMembers(1);
        this.displayMemberList();
        return;
      }
      
      showLoading('搜尋中...');
      
      const results = await MemberAPI.search(keyword.trim());
      
      this.members = results;
      this.totalMembers = results.length;
      this.currentPage = 1;
      
      hideLoading();
      this.displayMemberList();
      
      CONFIG.log(`搜尋到 ${results.length} 位會員`);
      
    } catch (error) {
      hideLoading();
      CONFIG.error('搜尋失敗', error);
      showMessage('搜尋失敗', 'error');
    }
  },
  
  // =============================================
  // 載入單一會員詳細資料
  // =============================================
  async loadMemberDetail(memberId) {
    try {
      showLoading('載入會員資料...');
      
      const member = await MemberAPI.getById(memberId);
      
      hideLoading();
      return member;
      
    } catch (error) {
      hideLoading();
      CONFIG.error('載入會員資料失敗', error);
      showMessage('載入失敗', 'error');
      throw error;
    }
  },
  
  // =============================================
  // 顯示會員詳細資料
  // =============================================
  displayMemberDetail(member) {
    if (!member) return;
    
    // 基本資訊
    this.setElementText('detail-name', member.name);
    this.setElementText('detail-phone', member.phone || '未設定');
    this.setElementText('detail-email', member.email || '未設定');
    this.setElementText('detail-birthday', formatDate(member.birthday) || '未設定');
    this.setElementText('detail-gender', this.formatGender(member.gender));
    this.setElementText('detail-created', formatDateTime(member.created_at));
    this.setElementText('detail-updated', formatDateTime(member.updated_at));
    
    // 頭像
    const avatar = document.getElementById('detail-avatar');
    if (avatar) {
      if (member.avatar_url) {
        avatar.src = member.avatar_url;
      } else {
        avatar.style.display = 'none';
      }
    }
    
    // LINE 綁定狀態
    const lineStatus = document.getElementById('detail-line-status');
    if (lineStatus) {
      if (member.line_user_id) {
        lineStatus.innerHTML = `
          <span class="status-badge status-success">已綁定</span>
          <small style="color: #999; margin-left: 10px;">LINE ID: ${member.line_user_id}</small>
        `;
      } else {
        lineStatus.innerHTML = '<span class="status-badge status-gray">未綁定</span>';
      }
    }
  },
  
  // =============================================
  // 載入編輯表單
  // =============================================
  loadMemberEditForm(member) {
    if (!member) return;
    
    this.setInputValue('edit-name', member.name);
    this.setInputValue('edit-phone', member.phone);
    this.setInputValue('edit-email', member.email);
    this.setInputValue('edit-birthday', member.birthday);
    this.setInputValue('edit-gender', member.gender);
    this.setInputValue('edit-line-user-id', member.line_user_id);
  },
  
  // =============================================
  // 新增會員
  // =============================================
  async createMember(formData) {
    try {
      showLoading('新增中...');
      
      // 驗證必填欄位
      if (!formData.name || formData.name.trim().length < CONFIG.VALIDATION.nameMinLength) {
        throw new Error(`姓名至少需要 ${CONFIG.VALIDATION.nameMinLength} 個字元`);
      }
      
      // 驗證電話
      if (formData.phone && !validatePhone(formData.phone)) {
        throw new Error(CONFIG.VALIDATION.phoneMessage);
      }
      
      // 驗證 Email
      if (formData.email && !validateEmail(formData.email)) {
        throw new Error(CONFIG.VALIDATION.emailMessage);
      }
      
      const newMember = await MemberAPI.create({
        name: formData.name.trim(),
        phone: formData.phone || null,
        email: formData.email || null,
        birthday: formData.birthday || null,
        gender: formData.gender || null,
        line_user_id: formData.line_user_id || null,
      });
      
      hideLoading();
      showMessage('會員新增成功！', 'success');
      
      CONFIG.log('新會員已建立', newMember);
      return newMember;
      
    } catch (error) {
      hideLoading();
      CONFIG.error('新增會員失敗', error);
      showMessage(error.message || '新增失敗', 'error');
      throw error;
    }
  },
  
  // =============================================
  // 更新會員資料
  // =============================================
  async updateMember(memberId, formData) {
    try {
      showLoading('更新中...');
      
      // 驗證
      if (!formData.name || formData.name.trim().length < CONFIG.VALIDATION.nameMinLength) {
        throw new Error(`姓名至少需要 ${CONFIG.VALIDATION.nameMinLength} 個字元`);
      }
      
      if (formData.phone && !validatePhone(formData.phone)) {
        throw new Error(CONFIG.VALIDATION.phoneMessage);
      }
      
      if (formData.email && !validateEmail(formData.email)) {
        throw new Error(CONFIG.VALIDATION.emailMessage);
      }
      
      const updated = await MemberAPI.update(memberId, {
        name: formData.name.trim(),
        phone: formData.phone || null,
        email: formData.email || null,
        birthday: formData.birthday || null,
        gender: formData.gender || null,
        line_user_id: formData.line_user_id || null,
      });
      
      hideLoading();
      showMessage('會員資料更新成功！', 'success');
      
      CONFIG.log('會員資料已更新', updated);
      return updated;
      
    } catch (error) {
      hideLoading();
      CONFIG.error('更新會員失敗', error);
      showMessage(error.message || '更新失敗', 'error');
      throw error;
    }
  },
  
  // =============================================
  // 刪除會員
  // =============================================
  async deleteMember(memberId, memberName) {
    if (!confirm(`確定要刪除會員「${memberName}」嗎？\n此操作無法復原！`)) {
      return false;
    }
    
    try {
      showLoading('刪除中...');
      
      await MemberAPI.delete(memberId);
      
      hideLoading();
      showMessage('會員已刪除', 'success');
      
      CONFIG.log('會員已刪除', memberId);
      return true;
      
    } catch (error) {
      hideLoading();
      CONFIG.error('刪除會員失敗', error);
      showMessage('刪除失敗', 'error');
      return false;
    }
  },
  
  // =============================================
  // 載入儀表板統計
  // =============================================
  async loadDashboardStats() {
    try {
      const result = await MemberAPI.getAll(1000, 0); // 載入全部統計
      
      const totalMembers = result.total;
      const lineBindingCount = result.members.filter(m => m.line_user_id).length;
      const recentMembers = result.members.slice(0, 5);
      
      // 顯示統計
      this.setElementText('stat-total-members', totalMembers);
      this.setElementText('stat-line-binding', lineBindingCount);
      this.setElementText('stat-binding-rate', 
        totalMembers > 0 ? `${Math.round(lineBindingCount / totalMembers * 100)}%` : '0%'
      );
      
      // 顯示最近加入的會員
      this.displayRecentMembers(recentMembers);
      
    } catch (error) {
      CONFIG.error('載入統計資料失敗', error);
    }
  },
  
  // =============================================
  // 顯示最近加入的會員
  // =============================================
  displayRecentMembers(members) {
    const container = document.getElementById('recent-members');
    if (!container) return;
    
    if (members.length === 0) {
      container.innerHTML = '<p style="color: #999;">尚無會員</p>';
      return;
    }
    
    container.innerHTML = members.map(member => `
      <div class="recent-member-item" onclick="location.href='member-detail.html?id=${member.id}'">
        ${member.avatar_url ? `<img src="${member.avatar_url}" alt="${member.name}" class="member-avatar-small">` : ''}
        <div>
          <div>${member.name}</div>
          <small style="color: #999;">${formatDate(member.created_at)}</small>
        </div>
      </div>
    `).join('');
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
// 管理後台事件處理
// =============================================

// 登入表單
if (document.getElementById('form-admin-login')) {
  document.getElementById('form-admin-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    try {
      await Admin.handleLogin(email, password);
    } catch (error) {
      // 錯誤已處理
    }
  });
}

// 登出按鈕
if (document.getElementById('btn-admin-logout')) {
  document.getElementById('btn-admin-logout').addEventListener('click', () => {
    if (confirm('確定要登出嗎？')) {
      Auth.adminLogout();
    }
  });
}

// 搜尋會員
if (document.getElementById('search-members')) {
  let searchTimeout;
  document.getElementById('search-members').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      Admin.searchMembers(e.target.value);
    }, 500); // 延遲 500ms 避免頻繁搜尋
  });
}

// 分頁按鈕
if (document.getElementById('btn-prev-page')) {
  document.getElementById('btn-prev-page').addEventListener('click', async () => {
    if (Admin.currentPage > 1) {
      await Admin.loadMembers(Admin.currentPage - 1);
      Admin.displayMemberList();
    }
  });
}

if (document.getElementById('btn-next-page')) {
  document.getElementById('btn-next-page').addEventListener('click', async () => {
    const totalPages = Math.ceil(Admin.totalMembers / CONFIG.UI.membersPerPage);
    if (Admin.currentPage < totalPages) {
      await Admin.loadMembers(Admin.currentPage + 1);
      Admin.displayMemberList();
    }
  });
}

