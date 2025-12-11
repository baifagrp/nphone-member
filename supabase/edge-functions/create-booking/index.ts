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

    // 清理 p_service_option_id：如果為 "0" 或無效值，設為 null
    let cleanedOptionId = null;
    if (p_service_option_id) {
      const optionIdStr = String(p_service_option_id).trim();
      if (optionIdStr !== '' &&
          optionIdStr !== '0' &&
          optionIdStr !== 'null' &&
          optionIdStr !== 'undefined' &&
          uuidPattern.test(optionIdStr)) {
        cleanedOptionId = optionIdStr;
      }
    }

    // 準備 RPC 參數
    // 根據是否有服務選項來決定參數
    let rpcParams: any;
    if (cleanedOptionId) {
      // 有服務選項：使用 5 個參數的版本
      rpcParams = {
        p_line_user_id: String(p_line_user_id),
        p_service_id: String(p_service_id),
        p_booking_date: String(p_booking_date),
        p_booking_time: String(p_booking_time),
        p_service_option_id: cleanedOptionId,
        ...(p_notes ? { p_notes: String(p_notes) } : {}),
      };
    } else {
      // 沒有服務選項：使用 4 個參數的版本（不含 p_service_option_id）
      rpcParams = {
        p_line_user_id: String(p_line_user_id),
        p_service_id: String(p_service_id),
        p_booking_date: String(p_booking_date),
        p_booking_time: String(p_booking_time),
        ...(p_notes ? { p_notes: String(p_notes) } : {}),
      };
    }

    console.log('調用 RPC 的參數:', JSON.stringify(rpcParams, null, 2));

    // 調用 RPC 函數
    const { data, error } = await supabase.rpc('create_booking', rpcParams);

    if (error) {
      console.error('RPC 錯誤:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || '建立預約失敗',
          details: error,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

