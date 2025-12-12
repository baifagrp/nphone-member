// =============================================
// 結帳系統功能
// =============================================

const CheckoutAPI = {
  // =============================================
  // 付款方式相關
  // =============================================
  
  // 取得所有啟用的付款方式
  async getActivePaymentMethods() {
    try {
      const client = getSupabase();
      
      const { data, error } = await client
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      CONFIG.log('取得付款方式成功', data);
      return data || [];
    } catch (error) {
      CONFIG.error('取得付款方式失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 交易記錄相關
  // =============================================
  
  // 取得會員的交易記錄
  async getMyTransactions(lineUserId, limit = 50, offset = 0, type = null, status = null) {
    try {
      const client = getSupabase();
      
      const params = {
        p_line_user_id: lineUserId,
        p_limit: limit,
        p_offset: offset,
      };
      
      if (type) params.p_type = type;
      if (status) params.p_status = status;
      
      const { data, error } = await client.rpc('get_member_transactions', params);
      
      if (error) throw error;
      
      CONFIG.log('取得交易記錄成功', data);
      return data || [];
    } catch (error) {
      CONFIG.error('取得交易記錄失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 建立交易（管理員使用）
  // =============================================
  async createTransaction({
    lineUserId,
    bookingId = null,
    transactionType = 'payment',
    amount,
    totalAmount = null,
    discountAmount = 0,
    paymentMethodCode,
    description = null,
    receiptNumber = null,
    referenceNumber = null,
    notes = null,
    adminNotes = null,
  }) {
    try {
      const client = getSupabase();
      
      // 參數驗證
      if (!lineUserId) {
        throw new Error('缺少會員資訊');
      }
      if (!amount || amount <= 0) {
        throw new Error('交易金額必須大於 0');
      }
      if (!paymentMethodCode) {
        throw new Error('請選擇付款方式');
      }
      
      // 準備參數
      const params = {
        p_line_user_id: String(lineUserId),
        p_transaction_type: String(transactionType),
        p_amount: Number(amount),
        p_payment_method_code: String(paymentMethodCode),
      };
      
      if (bookingId) {
        params.p_booking_id = String(bookingId);
      }
      if (totalAmount !== null) {
        params.p_total_amount = Number(totalAmount);
      }
      if (discountAmount > 0) {
        params.p_discount_amount = Number(discountAmount);
      }
      if (description) {
        params.p_description = String(description);
      }
      if (receiptNumber) {
        params.p_receipt_number = String(receiptNumber);
      }
      if (referenceNumber) {
        params.p_reference_number = String(referenceNumber);
      }
      if (notes) {
        params.p_notes = String(notes);
      }
      if (adminNotes) {
        params.p_admin_notes = String(adminNotes);
      }
      
      CONFIG.log('建立交易參數', params);
      
      const { data, error } = await client.rpc('create_transaction', params);
      
      if (error) {
        CONFIG.error('建立交易失敗', error);
        throw error;
      }
      
      CONFIG.log('建立交易成功', data);
      return data;
    } catch (error) {
      CONFIG.error('建立交易失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 退款（管理員使用）
  // =============================================
  async createRefund({
    lineUserId,
    originalTransactionId,
    amount,
    paymentMethodCode = null,
    description = null,
    notes = null,
    adminNotes = null,
  }) {
    try {
      const client = getSupabase();
      
      // 參數驗證
      if (!lineUserId) {
        throw new Error('缺少會員資訊');
      }
      if (!originalTransactionId) {
        throw new Error('缺少原始交易 ID');
      }
      if (!amount || amount <= 0) {
        throw new Error('退款金額必須大於 0');
      }
      
      // 準備參數
      const params = {
        p_line_user_id: String(lineUserId),
        p_original_transaction_id: String(originalTransactionId),
        p_amount: Number(amount),
      };
      
      if (paymentMethodCode) {
        params.p_payment_method_code = String(paymentMethodCode);
      }
      if (description) {
        params.p_description = String(description);
      }
      if (notes) {
        params.p_notes = String(notes);
      }
      if (adminNotes) {
        params.p_admin_notes = String(adminNotes);
      }
      
      CONFIG.log('建立退款參數', params);
      
      const { data, error } = await client.rpc('create_refund', params);
      
      if (error) {
        CONFIG.error('建立退款失敗', error);
        throw error;
      }
      
      CONFIG.log('建立退款成功', data);
      return data;
    } catch (error) {
      CONFIG.error('建立退款失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 取得單一交易記錄
  // =============================================
  async getTransactionById(id) {
    try {
      const client = getSupabase();
      
      // 分別查詢交易、會員和預約資料，避免關聯關係衝突
      const { data: transaction, error: transError } = await client
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (transError) throw transError;
      
      // 查詢會員資料
      if (transaction.member_id) {
        const { data: member } = await client
          .from('members')
          .select('line_user_id, name, phone')
          .eq('id', transaction.member_id)
          .single();
        
        transaction.members = member || null;
      }
      
      // 查詢預約資料
      if (transaction.booking_id) {
        const { data: booking } = await client
          .from('bookings')
          .select('id, service_name, booking_date, booking_time, service_price, payment_status, paid_amount')
          .eq('id', transaction.booking_id)
          .single();
        
        transaction.bookings = booking || null;
      }
      
      CONFIG.log('取得交易記錄成功', transaction);
      return transaction;
    } catch (error) {
      CONFIG.error('取得交易記錄失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 更新交易記錄（管理員使用）
  // =============================================
  async updateTransaction(id, updates) {
    try {
      const client = getSupabase();
      
      CONFIG.log('呼叫 update_transaction RPC', { transaction_id: id, updates });
      
      // 準備 RPC 參數
      const rpcParams = {
        p_transaction_id: id,
      };
      
      // 映射更新參數到 RPC 參數
      if (updates.amount !== undefined) rpcParams.p_amount = updates.amount;
      if (updates.total_amount !== undefined) rpcParams.p_total_amount = updates.total_amount;
      if (updates.discount_amount !== undefined) rpcParams.p_discount_amount = updates.discount_amount;
      if (updates.payment_method_code !== undefined) rpcParams.p_payment_method_code = updates.payment_method_code;
      if (updates.description !== undefined) rpcParams.p_description = updates.description;
      if (updates.notes !== undefined) rpcParams.p_notes = updates.notes;
      if (updates.admin_notes !== undefined) rpcParams.p_admin_notes = updates.admin_notes;
      
      // 使用 RPC 函數更新交易，會自動處理儲值金和積分變更
      const { data: transaction, error } = await client.rpc('update_transaction', rpcParams);
      
      if (error) {
        CONFIG.error('update_transaction RPC 錯誤', error);
        throw error;
      }
      
      // 查詢會員資料
      if (transaction.member_id) {
        const { data: member } = await client
          .from('members')
          .select('line_user_id, name, phone')
          .eq('id', transaction.member_id)
          .single();
        
        transaction.members = member || null;
      }
      
      // 查詢預約資料
      if (transaction.booking_id) {
        const { data: booking } = await client
          .from('bookings')
          .select('id, service_name, booking_date, booking_time, service_price, payment_status, paid_amount')
          .eq('id', transaction.booking_id)
          .single();
        
        transaction.bookings = booking || null;
      }
      
      CONFIG.log('更新交易記錄成功（已自動處理儲值金和積分變更）', transaction);
      return transaction;
    } catch (error) {
      CONFIG.error('更新交易記錄失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 刪除交易記錄（管理員使用）
  // =============================================
  async deleteTransaction(id) {
    try {
      const client = getSupabase();
      
      CONFIG.log('呼叫 delete_transaction RPC', { transaction_id: id });
      
      // 使用 RPC 函數刪除交易，會自動處理儲值金退回和積分收回
      const { data, error } = await client.rpc('delete_transaction', {
        p_transaction_id: id
      });
      
      if (error) {
        CONFIG.error('delete_transaction RPC 錯誤', error);
        throw error;
      }
      
      CONFIG.log('刪除交易記錄成功（已自動處理儲值金退回和積分收回）', { transaction_id: id, result: data });
      return true;
    } catch (error) {
      CONFIG.error('刪除交易記錄失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 取得所有交易記錄（管理員使用）
  // =============================================
  async getAllTransactions(limit = 100, offset = 0, filters = {}) {
    try {
      const client = getSupabase();
      
      let query = client
        .from('transactions')
        .select('*, members(line_user_id, name, phone), bookings(id, service_name, booking_date, booking_time)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.transactionType) {
        query = query.eq('transaction_type', filters.transactionType);
      }
      if (filters.memberId) {
        query = query.eq('member_id', filters.memberId);
      }
      
      const { data: transactions, error, count } = await query;
      
      if (error) throw error;
      
      // 分別查詢會員和預約資料
      const transactionsWithRelations = await Promise.all((transactions || []).map(async (transaction) => {
        // 查詢會員資料
        if (transaction.member_id) {
          const { data: member } = await client
            .from('members')
            .select('line_user_id, name, phone')
            .eq('id', transaction.member_id)
            .single();
          
          transaction.members = member || null;
        }
        
        // 查詢預約資料
        if (transaction.booking_id) {
          const { data: booking } = await client
            .from('bookings')
            .select('id, service_name, booking_date, booking_time')
            .eq('id', transaction.booking_id)
            .single();
          
          transaction.bookings = booking || null;
        }
        
        return transaction;
      }));
      
      return { transactions: transactionsWithRelations, total: count || 0 };
    } catch (error) {
      CONFIG.error('取得交易記錄失敗', error);
      throw error;
    }
  },
};


