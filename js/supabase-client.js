// =============================================
// Supabase 客戶端初始化
// =============================================

// 載入 Supabase JS SDK（從 CDN）
// 在 HTML 中需要先引入：
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabaseClient = null;

// =============================================
// 初始化 Supabase 客戶端
// =============================================
function initSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  try {
    const { createClient } = supabase;
    
    supabaseClient = createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY
    );
    
    CONFIG.log('Supabase 客戶端初始化成功');
    return supabaseClient;
    
  } catch (error) {
    CONFIG.error('Supabase 初始化失敗', error);
    throw error;
  }
}

// =============================================
// 取得 Supabase 客戶端實例
// =============================================
function getSupabase() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

// =============================================
// 會員相關 API
// =============================================
const MemberAPI = {
  // 透過 LINE User ID 取得會員
  async getByLineId(lineUserId) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('members')
        .select('*')
        .eq('line_user_id', lineUserId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      
      return data;
    } catch (error) {
      CONFIG.error('取得會員資料失敗', error);
      throw error;
    }
  },
  
  // 取得所有會員（管理員使用）
  async getAll(limit = 100, offset = 0) {
    try {
      const client = getSupabase();
      const { data, error, count } = await client
        .from('members')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return { members: data, total: count };
    } catch (error) {
      CONFIG.error('取得會員列表失敗', error);
      throw error;
    }
  },
  
  // 搜尋會員（管理員使用）
  async search(keyword) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('members')
        .select('*')
        .or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%,email.ilike.%${keyword}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      CONFIG.error('搜尋會員失敗', error);
      throw error;
    }
  },
  
  // 取得單一會員（透過 ID）
  async getById(id) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('members')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      CONFIG.error('取得會員資料失敗', error);
      throw error;
    }
  },
  
  // 新增會員
  async create(memberData) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('members')
        .insert([memberData])
        .select()
        .single();
      
      if (error) throw error;
      
      CONFIG.log('會員新增成功', data);
      return data;
    } catch (error) {
      CONFIG.error('新增會員失敗', error);
      throw error;
    }
  },
  
  // 更新會員資料（使用 RPC 函數，透過 LINE User ID）
  async updateByLineId(lineUserId, updates) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .rpc('update_member_profile', {
          p_line_user_id: lineUserId,
          p_name: updates.name,
          p_phone: updates.phone || null,
          p_email: updates.email || null,
          p_birthday: updates.birthday || null,
          p_gender: updates.gender || null,
        });
      
      if (error) throw error;
      
      CONFIG.log('會員資料更新成功', data);
      return data;
    } catch (error) {
      CONFIG.error('更新會員資料失敗', error);
      throw error;
    }
  },
  
  // 更新會員資料（使用 RPC 函數，透過 Member ID）- 用於純 Email 會員
  async updateById(memberId, updates) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .rpc('update_member_profile_by_id', {
          p_member_id: memberId,
          p_name: updates.name,
          p_phone: updates.phone || null,
          p_email: updates.email || null,
          p_birthday: updates.birthday || null,
          p_gender: updates.gender || null,
        });
      
      if (error) throw error;
      
      CONFIG.log('會員資料更新成功（透過 Member ID）', data);
      return data;
    } catch (error) {
      CONFIG.error('更新會員資料失敗', error);
      throw error;
    }
  },
  
  // 更新會員資料（直接更新，管理員使用）
  async update(id, updates) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      CONFIG.log('會員資料更新成功', data);
      return data;
    } catch (error) {
      CONFIG.error('更新會員資料失敗', error);
      throw error;
    }
  },
  
  // 刪除會員
  async delete(id) {
    try {
      const client = getSupabase();
      const { error } = await client
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      CONFIG.log('會員刪除成功', id);
      return true;
    } catch (error) {
      CONFIG.error('刪除會員失敗', error);
      throw error;
    }
  },
};

// =============================================
// 管理員相關 API
// =============================================
const AdminAPI = {
  // 管理員登入
  async login(email, password) {
    try {
      const client = getSupabase();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // 檢查是否為管理員
      const isAdmin = await this.checkIsAdmin(data.user.id);
      if (!isAdmin) {
        await client.auth.signOut();
        throw new Error('此帳號不具管理員權限');
      }
      
      CONFIG.log('管理員登入成功', data.user);
      return data;
    } catch (error) {
      CONFIG.error('管理員登入失敗', error);
      throw error;
    }
  },
  
  // 管理員登出
  async logout() {
    try {
      const client = getSupabase();
      const { error } = await client.auth.signOut();
      
      if (error) throw error;
      
      CONFIG.log('管理員登出成功');
      return true;
    } catch (error) {
      CONFIG.error('管理員登出失敗', error);
      throw error;
    }
  },
  
  // 檢查是否為管理員
  async checkIsAdmin(userId) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('admins')
        .select('id, role')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return !!data;
    } catch (error) {
      CONFIG.error('檢查管理員權限失敗', error);
      return false;
    }
  },
  
  // 取得當前管理員資訊
  async getCurrentAdmin() {
    try {
      const client = getSupabase();
      const { data: { user }, error } = await client.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;
      
      // 取得管理員詳細資訊
      const { data: adminData, error: adminError } = await client
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (adminError) throw adminError;
      
      return { ...user, admin: adminData };
    } catch (error) {
      CONFIG.error('取得管理員資訊失敗', error);
      return null;
    }
  },
};

// =============================================
// 初始化
// =============================================
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initSupabase();
  });
}

