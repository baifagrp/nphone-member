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
};

