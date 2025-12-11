// =============================================
// 預約系統功能
// =============================================

const BookingAPI = {
  // =============================================
  // 服務項目相關
  // =============================================
  
  // 取得所有啟用的服務（包含選項）
  async getActiveServices() {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('services')
        .select('*, service_options(*)')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      CONFIG.error('取得服務列表失敗', error);
      throw error;
    }
  },
  
  // 取得所有服務（管理員使用，包含選項）
  async getAllServices() {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('services')
        .select('*, service_options(*)')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      CONFIG.error('取得服務列表失敗', error);
      throw error;
    }
  },
  
  // 取得單一服務（包含選項）
  async getServiceById(id) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('services')
        .select('*, service_options(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      CONFIG.error('取得服務資料失敗', error);
      throw error;
    }
  },
  
  // 取得服務選項
  async getServiceOptions(serviceId) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('service_options')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      CONFIG.error('取得服務選項失敗', error);
      throw error;
    }
  },
  
  // 新增服務（管理員）
  async createService(serviceData) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('services')
        .insert([serviceData])
        .select()
        .single();
      
      if (error) throw error;
      
      CONFIG.log('服務新增成功', data);
      return data;
    } catch (error) {
      CONFIG.error('新增服務失敗', error);
      throw error;
    }
  },
  
  // 更新服務（管理員）
  async updateService(id, updates) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      CONFIG.log('服務更新成功', data);
      return data;
    } catch (error) {
      CONFIG.error('更新服務失敗', error);
      throw error;
    }
  },
  
  // 刪除服務（管理員）
  async deleteService(id) {
    try {
      const client = getSupabase();
      const { error } = await client
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      CONFIG.log('服務刪除成功', id);
      return true;
    } catch (error) {
      CONFIG.error('刪除服務失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 服務選項相關（管理員）
  // =============================================
  
  // 新增服務選項
  async createServiceOption(serviceId, optionData) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('service_options')
        .insert([{ ...optionData, service_id: serviceId }])
        .select()
        .single();
      
      if (error) throw error;
      
      CONFIG.log('服務選項新增成功', data);
      return data;
    } catch (error) {
      CONFIG.error('新增服務選項失敗', error);
      throw error;
    }
  },
  
  // 更新服務選項
  async updateServiceOption(id, updates) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('service_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      CONFIG.log('服務選項更新成功', data);
      return data;
    } catch (error) {
      CONFIG.error('更新服務選項失敗', error);
      throw error;
    }
  },
  
  // 刪除服務選項
  async deleteServiceOption(id) {
    try {
      const client = getSupabase();
      const { error } = await client
        .from('service_options')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      CONFIG.log('服務選項刪除成功', id);
      return true;
    } catch (error) {
      CONFIG.error('刪除服務選項失敗', error);
      throw error;
    }
  },
  
  // =============================================
  // 預約相關
  // =============================================
  
  // 會員建立預約
  async createBooking(lineUserId, serviceId, bookingDate, bookingTime, serviceOptionId = null, notes = null) {
    try {
      const client = getSupabase();
      
      // UUID 格式驗證函數
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // 記錄原始參數（用於除錯）
      CONFIG.log('createBooking 接收到的原始參數', {
        lineUserId: lineUserId,
        serviceId: serviceId,
        serviceIdType: typeof serviceId,
        bookingDate: bookingDate,
        bookingTime: bookingTime,
        serviceOptionId: serviceOptionId,
        serviceOptionIdType: typeof serviceOptionId,
        notes: notes
      });
      
      // 驗證參數
      if (!lineUserId) {
        throw new Error('缺少會員資訊');
      }
      if (!serviceId || serviceId === '0' || serviceId === 0) {
        throw new Error('請選擇服務項目');
      }
      if (!bookingDate) {
        throw new Error('請選擇預約日期');
      }
      if (!bookingTime) {
        throw new Error('請選擇預約時間');
      }
      
      // 驗證 serviceId 是有效的 UUID（先檢查是否為 "0"）
      const serviceIdStr = String(serviceId).trim();
      if (!serviceIdStr || serviceIdStr === '0' || serviceIdStr === 'null' || serviceIdStr === 'undefined' || serviceIdStr === '') {
        CONFIG.error('❌❌❌ 服務 ID 為無效值', { 
          serviceId, 
          serviceIdStr,
          serviceIdType: typeof serviceId 
        });
        throw new Error('服務項目資料錯誤，請重新選擇');
      }
      if (!uuidPattern.test(serviceIdStr)) {
        CONFIG.error('❌❌❌ 無效的服務 ID 格式', { 
          serviceId, 
          serviceIdStr,
          isValid: uuidPattern.test(serviceIdStr)
        });
        throw new Error('服務項目資料錯誤，請重新選擇');
      }
      
      CONFIG.log('✅ serviceId 驗證通過', {
        serviceId: serviceId,
        serviceIdStr: serviceIdStr,
        isValid: uuidPattern.test(serviceIdStr)
      });
      
      // 準備參數（只包含有值的參數，避免傳遞 undefined）
      // 再次確認 serviceIdStr 不是 "0"
      const validatedServiceId = serviceIdStr;
      if (validatedServiceId === '0' || validatedServiceId === 0) {
        CONFIG.error('❌❌❌ 致命錯誤：validatedServiceId 仍然是 "0"', {
          serviceId,
          serviceIdStr,
          validatedServiceId
        });
        throw new Error('服務項目資料錯誤，請重新選擇服務項目');
      }
      
      const params = {
        p_line_user_id: String(lineUserId),
        p_service_id: validatedServiceId,  // 使用驗證過的 serviceId
        p_booking_date: String(bookingDate),
        p_booking_time: String(bookingTime),
      };
      
      CONFIG.log('✅ 基本參數已準備', {
        p_service_id: params.p_service_id,
        p_service_id_type: typeof params.p_service_id,
        isUuid: uuidPattern.test(params.p_service_id)
      });
      
      // 檢查並處理服務選項 ID
      // 只有當 serviceOptionId 是有效的 UUID 字串時才加入
      // 嚴格檢查：先排除所有無效值，再驗證 UUID 格式
      
      // 第一步：檢查 serviceOptionId 是否存在且不是無效值
      const hasValidOptionId = serviceOptionId != null && 
                                serviceOptionId !== undefined &&
                                serviceOptionId !== '0' &&
                                serviceOptionId !== 0 &&
                                serviceOptionId !== '' &&
                                serviceOptionId !== 'null' &&
                                serviceOptionId !== 'undefined' &&
                                serviceOptionId !== 'false';
      
      if (hasValidOptionId) {
        const optionIdStr = String(serviceOptionId).trim();
        
        // 第二步：再次檢查轉換後的值
        if (optionIdStr && 
            optionIdStr !== 'null' && 
            optionIdStr !== '0' && 
            optionIdStr !== '' &&
            optionIdStr !== 'undefined' &&
            optionIdStr !== 'false') {
          
          // 第三步：驗證 UUID 格式（必須是標準 UUID 格式）
          if (uuidPattern.test(optionIdStr)) {
            params.p_service_option_id = optionIdStr;
            CONFIG.log('服務選項 ID 驗證通過，已加入參數', optionIdStr);
          } else {
            CONFIG.error('無效的服務選項 ID 格式，將不傳遞此參數', {
              original: serviceOptionId,
              converted: optionIdStr,
              isValid: uuidPattern.test(optionIdStr)
            });
            // 不加入無效的 ID，讓 RPC 使用預設值 NULL
          }
        } else {
          CONFIG.log('服務選項 ID 轉換後仍為無效值，將不傳遞此參數', {
            original: serviceOptionId,
            converted: optionIdStr
          });
        }
      } else {
        CONFIG.log('服務選項 ID 為空或無效值，將不傳遞此參數（使用預設值 NULL）', {
          serviceOptionId: serviceOptionId,
          type: typeof serviceOptionId
        });
      }
      // 如果 serviceOptionId 是 null/undefined/無效值，不加入參數（RPC 會使用預設值 NULL）
      
      // 只有在有值時才加入備註
      if (notes && notes !== 'null' && notes !== 'undefined') {
        params.p_notes = String(notes);
      }
      
      // 最後檢查：確保沒有任何參數是 "0" 或無效值（在傳遞前檢查）
      for (const [key, value] of Object.entries(params)) {
        // 檢查無效值（包括各種可能的 "0" 表示形式）
        const valueStr = String(value).trim();
        if (value === '0' || value === 0 || valueStr === '0' || 
            value === 'null' || value === 'undefined' || value === '' || 
            valueStr === 'null' || valueStr === 'undefined' || valueStr === '') {
          CONFIG.error(`❌ 發現無效參數值 "${key}": ${value} (類型: ${typeof value})`, {
            key: key,
            value: value,
            valueString: valueStr,
            type: typeof value,
            allParams: JSON.stringify(params, null, 2)
          });
          throw new Error(`參數 ${key} 的值無效: ${value}`);
        }
        
        // 檢查 UUID 欄位（必須是有效的 UUID 格式）
        // p_service_id 必須是有效的 UUID
        if (key === 'p_service_id') {
          if (!value || value === null || value === undefined) {
            CONFIG.error(`❌ UUID 參數為空 "${key}"`, {
              key: key,
              value: value,
              allParams: JSON.stringify(params, null, 2)
            });
            throw new Error(`參數 ${key} 不能為空`);
          }
          if (!uuidPattern.test(valueStr)) {
            CONFIG.error(`❌ UUID 參數格式錯誤 "${key}": ${value}`, {
              key: key,
              value: value,
              valueString: valueStr,
              type: typeof value,
              isValid: uuidPattern.test(valueStr),
              allParams: JSON.stringify(params, null, 2)
            });
            throw new Error(`參數 ${key} 的 UUID 格式錯誤: ${value}`);
          }
        }
        // p_service_option_id 應該是 TEXT 類型，但我們也驗證它的格式
        if (key === 'p_service_option_id') {
          // 如果存在，應該是有效的 UUID 格式（因為函數會將其轉換為 UUID）
          if (value && !uuidPattern.test(valueStr)) {
            CONFIG.error(`❌ 服務選項 ID 格式錯誤 "${key}": ${value}`, {
              key: key,
              value: value,
              valueString: valueStr,
              type: typeof value,
              isValid: uuidPattern.test(valueStr),
              allParams: JSON.stringify(params, null, 2)
            });
            throw new Error(`參數 ${key} 的 UUID 格式錯誤: ${value}`);
          }
        }
      }
      
      // 記錄最終傳遞的參數（用於除錯）- 在檢查通過後記錄
      CONFIG.log('✅ 調用 create_booking RPC（所有參數檢查通過）', {
        params: JSON.parse(JSON.stringify(params)), // 深拷貝，避免引用問題
        paramKeys: Object.keys(params),
        paramCount: Object.keys(params).length
      });
      
      // 再次確保 params 中沒有任何 "0" 值（最後一道防線）
      // 同時確保 null/undefined 參數不被傳遞
      const finalParams = {};
      
      // 強制驗證所有參數
      for (const [key, value] of Object.entries(params)) {
        // 跳過 null 和 undefined（讓函數使用預設值）
        if (value === null || value === undefined) {
          CONFIG.log(`跳過參數 ${key}（因為是 null/undefined，將使用函數預設值）`);
          continue;
        }
        
        const valueStr = String(value).trim();
        
        // 檢查所有 UUID 參數，確保不是 "0"
        if (key === 'p_service_id' || key === 'p_service_option_id') {
          if (value === '0' || value === 0 || valueStr === '0') {
            CONFIG.error(`❌❌❌ 發現 UUID 參數 "${key}" 的值是 "0": ${value}`, {
              key: key,
              value: value,
              valueType: typeof value,
              allParams: JSON.stringify(params, null, 2)
            });
            
            // 對於 service_option_id，如果是 "0" 則完全不傳遞
            if (key === 'p_service_option_id') {
              CONFIG.log('⚠️ 跳過 p_service_option_id（因為是 "0"，將使用函數預設值 NULL）');
              continue;
            } else {
              // p_service_id 不能是 "0"
              throw new Error(`服務 ID 參數無效: ${value}`);
            }
          }
        }
        
        // 對於 p_service_option_id，如果是空字串也不傳遞
        if (key === 'p_service_option_id') {
          if (valueStr === '' || valueStr === 'null' || valueStr === 'undefined') {
            CONFIG.log(`跳過參數 ${key}（因為是空值: "${valueStr}"，將使用函數預設值 NULL）`);
            continue;
          }
        }
        
        finalParams[key] = value;
      }
      
      // 最終驗證：確保沒有 "0" 值殘留
      for (const [key, value] of Object.entries(finalParams)) {
        if (value === '0' || value === 0 || String(value).trim() === '0') {
          CONFIG.error(`❌❌❌ 最終驗證失敗：參數 "${key}" 仍然是 "0"`, {
            key: key,
            value: value,
            finalParams: JSON.stringify(finalParams, null, 2)
          });
          if (key === 'p_service_option_id') {
            delete finalParams[key];
            CONFIG.log('已從 finalParams 中移除 p_service_option_id');
          } else {
            throw new Error(`參數 ${key} 的值無效: ${value}`);
          }
        }
      }
      
      CONFIG.log('📤 最終傳遞給 RPC 的參數', JSON.stringify(finalParams, null, 2));
      CONFIG.log('📤 參數檢查清單', {
        hasServiceOptionId: 'p_service_option_id' in finalParams,
        serviceOptionIdValue: finalParams.p_service_option_id,
        serviceOptionIdType: typeof finalParams.p_service_option_id,
        allKeys: Object.keys(finalParams),
        paramCount: Object.keys(finalParams).length
      });
      
      // 確保沒有傳遞任何 "0" 值給 Supabase
      // 最後檢查：序列化和反序列化以確保沒有任何隱藏的問題
      const sanitizedParams = JSON.parse(JSON.stringify(finalParams));
      
      // 檢查每個參數
      for (const [key, value] of Object.entries(sanitizedParams)) {
        if (value === '0' || value === 0 || String(value).trim() === '0') {
          CONFIG.error(`❌ 最終檢查：發現 "${key}" 的值是 "0"`, {
            key,
            value,
            allParams: sanitizedParams
          });
          
          // 如果是可選參數，刪除它
          if (key === 'p_service_option_id' || key === 'p_notes') {
            delete sanitizedParams[key];
            CONFIG.log(`已從參數中移除 ${key}`);
          } else {
            throw new Error(`參數 ${key} 的值無效: ${value}`);
          }
        }
      }
      
      CONFIG.log('🔍 最終發送的參數（已清理）', {
        params: sanitizedParams,
        keys: Object.keys(sanitizedParams),
        count: Object.keys(sanitizedParams).length
      });
      
      // 最後一次檢查：確保 sanitizedParams 中沒有任何問題
      const finalCheckParams = {};
      
      // 特別檢查 p_service_id（這是必填的 UUID 參數，絕對不能是 "0"）
      if (!sanitizedParams.p_service_id || 
          sanitizedParams.p_service_id === '0' || 
          sanitizedParams.p_service_id === 0 || 
          String(sanitizedParams.p_service_id).trim() === '0') {
        CONFIG.error('❌❌❌ 致命錯誤：p_service_id 為 "0" 或無效值', {
          p_service_id: sanitizedParams.p_service_id,
          allParams: JSON.stringify(sanitizedParams, null, 2),
          originalServiceId: serviceId,
          serviceIdStr: serviceIdStr
        });
        throw new Error('服務項目資料錯誤，請重新選擇服務項目');
      }
      
      // 驗證 p_service_id 是有效的 UUID 格式
      const serviceIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!serviceIdPattern.test(String(sanitizedParams.p_service_id).trim())) {
        CONFIG.error('❌❌❌ 致命錯誤：p_service_id 格式無效', {
          p_service_id: sanitizedParams.p_service_id,
          allParams: JSON.stringify(sanitizedParams, null, 2)
        });
        throw new Error('服務項目 ID 格式錯誤，請重新選擇服務項目');
      }
      
      for (const [key, value] of Object.entries(sanitizedParams)) {
        // 絕對不能傳遞 "0" 給任何參數
        if (value === '0' || value === 0 || String(value).trim() === '0') {
          CONFIG.error(`❌❌❌ 致命錯誤：sanitizedParams 中仍有 "0" 值在 "${key}"`, {
            key,
            value,
            allSanitizedParams: JSON.stringify(sanitizedParams, null, 2)
          });
          
          // 如果是可選參數，跳過它
          if (key === 'p_service_option_id' || key === 'p_notes') {
            CONFIG.log(`跳過參數 ${key}（值為 "0"）`);
            continue;
          } else if (key === 'p_service_id') {
            // p_service_id 絕對不能是 "0"
            throw new Error(`參數 ${key} 的值為 "0"，這是不允許的`);
          } else {
            throw new Error(`參數 ${key} 的值為 "0"，這是不允許的`);
          }
        }
        
        // 對於 UUID 參數，確保格式正確
        if (key === 'p_service_id') {
          if (!serviceIdPattern.test(String(value).trim())) {
            CONFIG.error(`❌❌❌ 致命錯誤：${key} 格式無效`, {
              key,
              value,
              allParams: JSON.stringify(sanitizedParams, null, 2)
            });
            throw new Error(`參數 ${key} 的 UUID 格式無效`);
          }
        }
        
        finalCheckParams[key] = value;
      }
      
      CONFIG.log('🚀 準備發送給 Supabase 的最終參數', {
        params: JSON.stringify(finalCheckParams, null, 2),
        keys: Object.keys(finalCheckParams),
        count: Object.keys(finalCheckParams).length,
        hasServiceOptionId: 'p_service_option_id' in finalCheckParams,
        serviceOptionIdValue: finalCheckParams.p_service_option_id
      });
      
      // 使用 Edge Function 作為中間層，避免 PostgREST 參數驗證問題
      const response = await fetch(CONFIG.CREATE_BOOKING_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(finalCheckParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        CONFIG.error('❌ Edge Function 錯誤詳情', {
          status: response.status,
          error: errorData,
          paramsSent: JSON.stringify(finalCheckParams, null, 2)
        });
        
        const errorMessage = errorData.error || `建立預約失敗 (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        CONFIG.error('❌ Edge Function 返回失敗', {
          result: result,
          paramsSent: JSON.stringify(finalCheckParams, null, 2)
        });
        throw new Error(result.error || '建立預約失敗');
      }
      
      CONFIG.log('預約建立成功', result.data);
      return result.data;
    } catch (error) {
      CONFIG.error('建立預約失敗', error);
      throw error;
    }
  },
  
  // 會員取得自己的預約列表
  async getMyBookings(lineUserId, limit = 50) {
    try {
      const client = getSupabase();
      
      CONFIG.log('查詢預約記錄', { lineUserId, limit });
      
      // 使用 RPC 函數查詢預約記錄（更安全，繞過 RLS 問題）
      const { data, error } = await client.rpc('get_member_bookings', {
        p_line_user_id: lineUserId,
        p_limit: limit
      });
      
      if (error) {
        CONFIG.error('查詢預約記錄失敗', {
          error,
          lineUserId,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        });
        throw error;
      }
      
      CONFIG.log('查詢到預約記錄', { 
        count: data ? data.length : 0,
        bookings: data 
      });
      
      return data || [];
    } catch (error) {
      CONFIG.error('取得預約列表失敗', error);
      throw error;
    }
  },
  
  // 取得所有預約（管理員）
  async getAllBookings(limit = 100, offset = 0, status = null) {
    try {
      const client = getSupabase();
      let query = client
        .from('bookings')
        .select('*, members(*), services(*)', { count: 'exact' })
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { bookings: data, total: count };
    } catch (error) {
      CONFIG.error('取得預約列表失敗', error);
      throw error;
    }
  },
  
  // 取得單一預約
  async getBookingById(id) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('bookings')
        .select('*, members(*), services(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      CONFIG.error('取得預約資料失敗', error);
      throw error;
    }
  },
  
  // 會員取消預約
  async cancelBookingByMember(lineUserId, bookingId) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .rpc('cancel_booking_by_member', {
          p_line_user_id: lineUserId,
          p_booking_id: bookingId,
        });
      
      if (error) throw error;
      
      CONFIG.log('預約取消成功', data);
      return data;
    } catch (error) {
      CONFIG.error('取消預約失敗', error);
      throw error;
    }
  },
  
  // 管理員刪除預約
  async deleteBooking(id) {
    try {
      const client = getSupabase();
      
      const { error } = await client
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      CONFIG.log('預約刪除成功', id);
      return true;
    } catch (error) {
      CONFIG.error('刪除預約失敗', error);
      throw error;
    }
  },
  
  // 管理員更新預約狀態
  async updateBookingStatus(id, status, adminNotes = null) {
    try {
      const client = getSupabase();
      
      const updates = {
        status,
        updated_at: new Date().toISOString(),
      };
      
      // 根據狀態設定對應的時間戳記
      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      if (adminNotes) {
        updates.admin_notes = adminNotes;
      }
      
      const { data, error } = await client
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select('*, members(*), services(*)')
        .single();
      
      if (error) throw error;
      
      CONFIG.log('預約狀態更新成功', data);
      return data;
    } catch (error) {
      CONFIG.error('更新預約狀態失敗', error);
      throw error;
    }
  },
  
  // 檢查時間段是否可用
  async checkTimeSlotAvailable(bookingDate, bookingTime, serviceDuration) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .rpc('check_time_slot_available', {
          p_booking_date: bookingDate,
          p_booking_time: bookingTime,
          p_service_duration: serviceDuration,
        });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      CONFIG.error('檢查時間段失敗', error);
      throw error;
    }
  },
  
  // 取得營業時間
  async getBusinessHours() {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('business_hours')
        .select('*')
        .order('day_of_week', { ascending: true });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      CONFIG.error('取得營業時間失敗', error);
      throw error;
    }
  },
  
  // 取得可用的時間段
  async getAvailableTimeSlots(bookingDate, serviceDuration) {
    try {
      const client = getSupabase();
      
      // 取得當天的營業時間
      const dayOfWeek = new Date(bookingDate).getDay();
      const { data: businessHours } = await client
        .from('business_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .single();
      
      if (!businessHours || !businessHours.is_open) {
        return []; // 當天不營業
      }
      
      // 取得所有啟用的時間段
      const { data: timeSlots } = await client
        .from('time_slots')
        .select('*')
        .eq('is_active', true)
        .gte('time_slot', businessHours.open_time)
        .lte('time_slot', businessHours.close_time)
        .order('time_slot', { ascending: true });
      
      if (!timeSlots) {
        return [];
      }
      
      // 檢查每個時間段是否可用
      const availableSlots = [];
      
      for (const slot of timeSlots) {
        // 計算結束時間
        const endTime = new Date(`2000-01-01T${slot.time_slot}`);
        endTime.setMinutes(endTime.getMinutes() + serviceDuration);
        const endTimeStr = endTime.toTimeString().slice(0, 5);
        
        // 檢查是否超過營業結束時間
        if (endTimeStr > businessHours.close_time) {
          continue;
        }
        
        // 檢查是否有衝突的預約
        const { data: conflicts } = await client
          .from('bookings')
          .select('id')
          .eq('booking_date', bookingDate)
          .eq('booking_time', slot.time_slot)
          .in('status', ['pending', 'confirmed'])
          .limit(slot.max_bookings);
        
        if (!conflicts || conflicts.length < slot.max_bookings) {
          availableSlots.push(slot.time_slot);
        }
      }
      
      return availableSlots;
      
    } catch (error) {
      CONFIG.error('取得可用時間段失敗', error);
      throw error;
    }
  },
};

