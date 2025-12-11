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
      const { data, error } = await client
        .rpc('create_booking', {
          p_line_user_id: lineUserId,
          p_service_id: serviceId,
          p_booking_date: bookingDate,
          p_booking_time: bookingTime,
          p_service_option_id: serviceOptionId,
          p_notes: notes,
        });
      
      if (error) throw error;
      
      CONFIG.log('預約建立成功', data);
      return data;
    } catch (error) {
      CONFIG.error('建立預約失敗', error);
      throw error;
    }
  },
  
  // 會員取得自己的預約列表
  async getMyBookings(lineUserId, limit = 50) {
    try {
      const client = getSupabase();
      
      // 先取得會員 ID
      const { data: member } = await client
        .from('members')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();
      
      if (!member) {
        throw new Error('找不到會員資料');
      }
      
      // 取得預約列表
      const { data, error } = await client
        .from('bookings')
        .select('*, services(*)')
        .eq('member_id', member.id)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data;
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

