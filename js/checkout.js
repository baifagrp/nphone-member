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
      
      const { data, error } = await client
        .from('transactions')
        .select('*, members(*), bookings(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      CONFIG.log('取得交易記錄成功', data);
      return data;
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
      
      // 如果更新了付款方式代碼，需要同時更新付款方式名稱和 ID
      if (updates.payment_method_code) {
        const { data: paymentMethod, error: pmError } = await client
          .from('payment_methods')
          .select('*')
          .eq('code', updates.payment_method_code)
          .eq('is_active', true)
          .single();
        
        if (pmError) {
          CONFIG.error('取得付款方式失敗', pmError);
          throw new Error('付款方式不存在或已停用');
        }
        
        updates.payment_method_id = paymentMethod.id;
        updates.payment_method_name = paymentMethod.name;
      }
      
      const { data, error } = await client
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select('*, members(*), bookings(*)')
        .single();
      
      if (error) throw error;
      
      CONFIG.log('更新交易記錄成功', data);
      return data;
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
      
      // 先取得交易記錄，以便後續更新預約狀態
      const { data: transaction, error: fetchError } = await client
        .from('transactions')
        .select('*, bookings(*)')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 刪除交易記錄
      const { error } = await client
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 如果該交易關聯了預約且是付款類型，更新預約的付款狀態
      if (transaction.booking_id && transaction.transaction_type === 'payment') {
        // 檢查是否還有其他完成的付款交易
        const { data: otherPayments } = await client
          .from('transactions')
          .select('amount')
          .eq('booking_id', transaction.booking_id)
          .eq('transaction_type', 'payment')
          .eq('status', 'completed');
        
        const totalPaid = (otherPayments || []).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const bookingPrice = transaction.bookings?.service_price || 0;
        
        let paymentStatus = 'unpaid';
        let paidAmount = 0;
        
        if (totalPaid > 0) {
          if (totalPaid >= bookingPrice) {
            paymentStatus = 'paid';
            paidAmount = bookingPrice;
          } else {
            paymentStatus = 'partial';
            paidAmount = totalPaid;
          }
        }
        
        // 更新預約的付款狀態
        await client
          .from('bookings')
          .update({
            payment_status: paymentStatus,
            paid_amount: paidAmount,
            transaction_id: null,  // 清除關聯的交易 ID
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.booking_id);
      }
      
      CONFIG.log('刪除交易記錄成功', id);
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
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { transactions: data || [], total: count || 0 };
    } catch (error) {
      CONFIG.error('取得交易記錄失敗', error);
      throw error;
    }
  },
};


