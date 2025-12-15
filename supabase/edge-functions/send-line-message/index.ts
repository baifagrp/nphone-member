// =============================================
// LINE 訊息推播 Edge Function
// =============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendMessageRequest {
  lineUserId: string;
  message: string;
  notificationType?: string;
  relatedBookingId?: string;
  relatedTransactionId?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔔 LINE 訊息推播 Edge Function 啟動');
    
    // 取得請求資料
    const { lineUserId, message, notificationType, relatedBookingId, relatedTransactionId }: SendMessageRequest = await req.json();
    
    if (!lineUserId || !message) {
      throw new Error('缺少必要參數：lineUserId 或 message');
    }
    
    // 取得 LINE Messaging API Token
    const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');
    }
    
    console.log('📤 準備發送訊息', { lineUserId, type: notificationType });
    
    // 判斷訊息類型：Flex Message 或純文字
    let messagePayload;
    if (typeof message === 'object' && message.type === 'flex') {
      // Flex Message
      console.log('📊 發送 Flex Message');
      messagePayload = message;
    } else {
      // 純文字訊息
      console.log('📝 發送純文字訊息');
      messagePayload = {
        type: 'text',
        text: message
      };
    }
    
    // 發送 LINE 訊息
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [messagePayload]
      }),
    });
    
    if (!lineResponse.ok) {
      const error = await lineResponse.text();
      console.error('❌ LINE API 錯誤:', error);
      throw new Error(`LINE API 錯誤: ${error}`);
    }
    
    console.log('✅ LINE 訊息發送成功');
    
    // 記錄到資料庫
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 取得 member_id
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single();
    
    if (member) {
      // 記錄通知（Flex Message 使用 altText 作為訊息內容）
      const messageText = typeof message === 'object' && message.altText 
        ? message.altText 
        : (typeof message === 'string' ? message : 'Flex Message');
      
      await supabase
        .from('notification_logs')
        .insert({
          member_id: member.id,
          notification_type: notificationType || 'system',
          message: messageText,
          related_booking_id: relatedBookingId || null,
          related_transaction_id: relatedTransactionId || null,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
      
      console.log('✅ 通知記錄已儲存');
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '訊息發送成功'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('❌ Edge Function 錯誤:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '訊息發送失敗',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

