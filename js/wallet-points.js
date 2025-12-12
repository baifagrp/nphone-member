// =============================================
// 儲值金和積分系統 API
// =============================================

const WalletPointsAPI = {
  // =============================================
  // 取得會員儲值金資訊
  // =============================================
  async getMemberWallet(lineUserId) {
    try {
      const client = getSupabase();
      const { data, error } = await client.rpc('get_member_wallet', {
        p_line_user_id: lineUserId
      });
      
      if (error) throw error;
      
      // 如果沒有錢包，返回 null（前端可以顯示為 0）
      return data && data.length > 0 ? data[0] : null;
      
    } catch (error) {
      CONFIG.error('取得儲值金資訊失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 取得會員積分資訊
  // =============================================
  async getMemberPoints(lineUserId) {
    try {
      const client = getSupabase();
      const { data, error } = await client.rpc('get_member_points', {
        p_line_user_id: lineUserId
      });
      
      if (error) throw error;
      
      // 如果沒有積分帳戶，返回 null（前端可以顯示為 0）
      return data && data.length > 0 ? data[0] : null;
      
    } catch (error) {
      CONFIG.error('取得積分資訊失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 取得會員儲值金交易記錄
  // =============================================
  async getMemberWalletTransactions(lineUserId, limit = 50, offset = 0) {
    try {
      const client = getSupabase();
      const { data, error } = await client.rpc('get_member_wallet_transactions', {
        p_line_user_id: lineUserId,
        p_limit: limit,
        p_offset: offset
      });
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      CONFIG.error('取得儲值金交易記錄失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 取得會員積分交易記錄
  // =============================================
  async getMemberPointTransactions(lineUserId, limit = 50, offset = 0) {
    try {
      const client = getSupabase();
      const { data, error } = await client.rpc('get_member_point_transactions', {
        p_line_user_id: lineUserId,
        p_limit: limit,
        p_offset: offset
      });
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      CONFIG.error('取得積分交易記錄失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 管理員：儲值（為會員加值）
  // =============================================
  async rechargeWallet(memberId, amount, description = null) {
    try {
      const client = getSupabase();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        throw new Error('請先登入管理後台');
      }
      
      // 取得管理員 ID
      const { data: admin } = await client
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (!admin) {
        throw new Error('無管理員權限');
      }
      
      const { data, error } = await client.rpc('recharge_wallet', {
        p_member_id: memberId,
        p_amount: amount,
        p_description: description,
        p_admin_id: admin.id
      });
      
      if (error) throw error;
      
      return data;
      
    } catch (error) {
      CONFIG.error('儲值失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 管理員：使用儲值金付款
  // =============================================
  async payWithWallet(memberId, amount, description = null, referenceId = null, referenceType = 'transaction') {
    try {
      const client = getSupabase();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        throw new Error('請先登入管理後台');
      }
      
      // 取得管理員 ID
      const { data: admin } = await client
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (!admin) {
        throw new Error('無管理員權限');
      }
      
      const { data, error } = await client.rpc('pay_with_wallet', {
        p_member_id: memberId,
        p_amount: amount,
        p_description: description,
        p_reference_id: referenceId,
        p_reference_type: referenceType,
        p_admin_id: admin.id
      });
      
      if (error) throw error;
      
      return data;
      
    } catch (error) {
      CONFIG.error('使用儲值金付款失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 管理員：獲得積分
  // =============================================
  async earnPoints(memberId, points, description = null, referenceId = null, referenceType = 'transaction') {
    try {
      const client = getSupabase();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        throw new Error('請先登入管理後台');
      }
      
      // 取得管理員 ID
      const { data: admin } = await client
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (!admin) {
        throw new Error('無管理員權限');
      }
      
      const { data, error } = await client.rpc('earn_points', {
        p_member_id: memberId,
        p_points: points,
        p_description: description,
        p_reference_id: referenceId,
        p_reference_type: referenceType,
        p_admin_id: admin.id
      });
      
      if (error) throw error;
      
      return data;
      
    } catch (error) {
      CONFIG.error('獲得積分失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 管理員：使用積分
  // =============================================
  async spendPoints(memberId, points, description = null, referenceId = null, referenceType = 'transaction') {
    try {
      const client = getSupabase();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        throw new Error('請先登入管理後台');
      }
      
      // 取得管理員 ID
      const { data: admin } = await client
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (!admin) {
        throw new Error('無管理員權限');
      }
      
      const { data, error } = await client.rpc('spend_points', {
        p_member_id: memberId,
        p_points: points,
        p_description: description,
        p_reference_id: referenceId,
        p_reference_type: referenceType,
        p_admin_id: admin.id
      });
      
      if (error) throw error;
      
      return data;
      
    } catch (error) {
      CONFIG.error('使用積分失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 管理員：取得所有會員的錢包資訊
  // =============================================
  async getAllWallets() {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('wallets')
        .select(`
          *,
          members (
            id,
            line_user_id,
            name,
            phone
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      CONFIG.error('取得所有錢包資訊失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 管理員：取得所有會員的積分資訊
  // =============================================
  async getAllPoints() {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('points')
        .select(`
          *,
          members (
            id,
            line_user_id,
            name,
            phone
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      CONFIG.error('取得所有積分資訊失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 取得積分規則
  // =============================================
  async getPointRules() {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('point_rules')
        .select('*')
        .eq('is_active', true)
        .order('rule_type');
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      CONFIG.error('取得積分規則失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 計算應該獲得的積分（根據消費金額）
  // =============================================
  async calculateEarnedPoints(amount) {
    try {
      const rules = await this.getPointRules();
      const spendRule = rules.find(r => r.rule_type === 'spend_rate');
      
      if (!spendRule || spendRule.value <= 0) {
        return 0;
      }
      
      // 每消費 spendRule.value 元獲得 1 點
      return Math.floor(amount / spendRule.value);
      
    } catch (error) {
      CONFIG.error('計算積分失敗', error);
      return 0;
    }
  },
  
  // =============================================
  // 格式化金額顯示
  // =============================================
  formatAmount(amount) {
    if (amount === null || amount === undefined) return 'NT$ 0';
    return `NT$ ${Number(amount).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
  
  // =============================================
  // 格式化點數顯示
  // =============================================
  formatPoints(points) {
    if (points === null || points === undefined) return '0 點';
    return `${Number(points).toLocaleString('zh-TW')} 點`;
  },
  
  // =============================================
  // 格式化交易類型
  // =============================================
  formatWalletTransactionType(type) {
    const types = {
      'recharge': '儲值',
      'payment': '付款',
      'refund': '退款',
      'adjustment': '調整'
    };
    return types[type] || type;
  },
  
  // =============================================
  // 格式化積分交易類型
  // =============================================
  formatPointTransactionType(type) {
    const types = {
      'earn': '獲得',
      'spend': '使用',
      'expire': '過期',
      'adjustment': '調整',
      'bonus': '獎勵'
    };
    return types[type] || type;
  }
};

