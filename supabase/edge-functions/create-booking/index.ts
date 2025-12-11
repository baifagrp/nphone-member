// =============================================
// 建立預約 Edge Function（中間層）
// 用於處理 Supabase PostgREST 的參數驗證問題
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 解析請求體
    const body = await req.json();
    console.log('收到的參數:', JSON.stringify(body, null, 2));

    const {
      p_line_user_id,
      p_service_id,
      p_booking_date,
      p_booking_time,
      p_service_option_id,
      p_notes,
    } = body;

    // 參數驗證
    if (!p_line_user_id || !p_service_id || !p_booking_date || !p_booking_time) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '缺少必要參數',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 驗證 service_id 是有效的 UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(String(p_service_id))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '服務 ID 格式錯誤',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 最終驗證：確保 p_service_id 不是 "0"
    const serviceIdStr = String(p_service_id).trim();
    if (serviceIdStr === '0' || serviceIdStr === 0 || serviceIdStr === '' || !serviceIdStr) {
      console.error('❌ p_service_id 為 "0" 或無效值:', serviceIdStr);
      return new Response(
        JSON.stringify({
          success: false,
          error: '服務 ID 無效',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 再次驗證 service_id 是有效的 UUID
    if (!uuidPattern.test(serviceIdStr)) {
      console.error('❌ p_service_id 格式錯誤:', serviceIdStr);
      return new Response(
        JSON.stringify({
          success: false,
          error: '服務 ID 格式錯誤',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 清理 p_service_option_id：如果為 "0" 或無效值，設為 null
    let cleanedOptionId = null;
    if (p_service_option_id !== null && p_service_option_id !== undefined) {
      const optionIdStr = String(p_service_option_id).trim();
      if (optionIdStr !== '' &&
          optionIdStr !== '0' &&
          optionIdStr !== 'null' &&
          optionIdStr !== 'undefined' &&
          uuidPattern.test(optionIdStr)) {
        cleanedOptionId = optionIdStr;
        console.log('✅ 有效的服務選項 ID:', cleanedOptionId);
      } else {
        console.log('⚠️ 服務選項 ID 無效，將不傳遞:', optionIdStr);
      }
    }

    // 準備 RPC 參數
    // 根據是否有服務選項來決定使用哪個函數重載版本
    // 注意：資料庫中的函數定義要求：
    // - 5 參數版本：p_line_user_id, p_service_id, p_booking_date, p_booking_time, p_notes (DEFAULT NULL)
    // - 6 參數版本：p_line_user_id, p_service_id, p_booking_date, p_booking_time, p_service_option_id, p_notes (DEFAULT NULL)
    // 由於 p_notes 有 DEFAULT NULL，我們可以省略它（PostgREST 會使用預設值）
    let rpcParams: any;
    if (cleanedOptionId) {
      // 有服務選項：使用 6 個參數的版本
      rpcParams = {
        p_line_user_id: String(p_line_user_id),
        p_service_id: serviceIdStr,  // 使用驗證過的 serviceIdStr
        p_booking_date: String(p_booking_date),
        p_booking_time: String(p_booking_time),
        p_service_option_id: cleanedOptionId,
      };
      // 只有當 p_notes 有值時才加入
      if (p_notes && String(p_notes).trim() !== '') {
        rpcParams.p_notes = String(p_notes);
      }
      console.log('✅ 使用有服務選項的版本（' + Object.keys(rpcParams).length + ' 個參數）');
    } else {
      // 沒有服務選項：使用 5 個參數的版本（不含 p_service_option_id）
      rpcParams = {
        p_line_user_id: String(p_line_user_id),
        p_service_id: serviceIdStr,  // 使用驗證過的 serviceIdStr
        p_booking_date: String(p_booking_date),
        p_booking_time: String(p_booking_time),
      };
      // 只有當 p_notes 有值時才加入（函數定義中有 DEFAULT NULL）
      if (p_notes && String(p_notes).trim() !== '') {
        rpcParams.p_notes = String(p_notes);
      }
      console.log('✅ 使用無服務選項的版本（' + Object.keys(rpcParams).length + ' 個參數）');
    }

    // 最終檢查：確保沒有任何 "0" 值
    for (const [key, value] of Object.entries(rpcParams)) {
      if (value === '0' || value === 0 || String(value).trim() === '0') {
        console.error(`❌❌❌ 致命錯誤：rpcParams 中 "${key}" 的值是 "0":`, value);
        return new Response(
          JSON.stringify({
            success: false,
            error: `參數 ${key} 的值無效`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('🚀 調用 RPC 的參數:', JSON.stringify(rpcParams, null, 2));
    console.log('📊 參數統計:', {
      paramCount: Object.keys(rpcParams).length,
      paramKeys: Object.keys(rpcParams),
      hasServiceOptionId: 'p_service_option_id' in rpcParams,
      p_service_id_type: typeof rpcParams.p_service_id,
      p_service_id_value: rpcParams.p_service_id,
      p_notes_value: rpcParams.p_notes,
      p_notes_type: typeof rpcParams.p_notes
    });

    // 再次確認沒有任何 "0" 值
    for (const [key, value] of Object.entries(rpcParams)) {
      const valueStr = String(value);
      if (value === '0' || value === 0 || valueStr === '0' || valueStr.trim() === '0') {
        console.error(`❌❌❌ 在調用 RPC 前檢查：參數 "${key}" 的值是 "0"`, {
          key,
          value,
          valueStr,
          allParams: JSON.stringify(rpcParams, null, 2)
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: `參數 ${key} 的值無效: ${value}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 調用 RPC 函數
    // 根據參數數量匹配函數重載：
    // - 5 參數：匹配 create_booking(text,uuid,date,time,text)
    // - 6 參數：匹配 create_booking(text,uuid,date,time,text,text)
    console.log(`📞 準備調用 RPC，參數數量: ${Object.keys(rpcParams).length}`);
    
    // 方法 1：使用 Supabase JS 客戶端的 rpc 方法
    // 注意：我們傳遞的是一個對象，Supabase 會根據參數名稱匹配
    try {
      const { data, error } = await supabase.rpc('create_booking', rpcParams);
      
      if (error) {
        throw error;
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: data,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (rpcError: any) {
      // 如果使用 JS 客戶端失敗，嘗試直接 HTTP 調用
      console.log('⚠️ Supabase JS 客戶端調用失敗，嘗試直接 HTTP 調用');
      console.log('錯誤:', rpcError);
      
      // 方法 2：直接使用 HTTP 調用 RPC
      const rpcUrl = `${supabaseUrl}/rest/v1/rpc/create_booking`;
      const rpcResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(rpcParams),
      });
      
      if (!rpcResponse.ok) {
        const errorText = await rpcResponse.text();
        console.error('❌ 直接 HTTP 調用 RPC 失敗:', {
          status: rpcResponse.status,
          statusText: rpcResponse.statusText,
          error: errorText
        });
        
        return new Response(
          JSON.stringify({
            success: false,
            error: rpcError?.message || '建立預約失敗',
            details: {
              jsError: rpcError,
              httpError: errorText,
              rpcParams: rpcParams,
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      const rpcData = await rpcResponse.json();
      console.log('✅ 直接 HTTP 調用 RPC 成功');
      
      return new Response(
        JSON.stringify({
          success: true,
          data: rpcData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Edge Function 錯誤:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '伺服器錯誤',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

