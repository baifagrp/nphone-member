// =============================================
// LINE Login Callback Handler
// Supabase Edge Function
// =============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LineTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token: string;
}

interface LineProfileResponse {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 取得 authorization code
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const redirectUri = url.searchParams.get('redirect_uri');

    if (!code) {
      throw new Error('Authorization code not provided');
    }

    // LINE Channel 設定（從環境變數取得）
    const LINE_CHANNEL_ID = Deno.env.get('LINE_CHANNEL_ID');
    const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET');

    if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
      throw new Error('LINE credentials not configured');
    }

    // =============================================
    // 步驟 1: 使用 code 交換 access token
    // =============================================
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri || '',
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const tokenData: LineTokenResponse = await tokenResponse.json();

    // =============================================
    // 步驟 2: 使用 access token 取得使用者資料
    // =============================================
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      throw new Error(`Failed to get user profile: ${error}`);
    }

    const profileData: LineProfileResponse = await profileResponse.json();

    // =============================================
    // 步驟 3: 在 Supabase 建立或更新會員記錄
    // =============================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 使用 upsert_member_from_line 函數
    const { data: member, error: memberError } = await supabase
      .rpc('upsert_member_from_line', {
        p_line_user_id: profileData.userId,
        p_name: profileData.displayName,
        p_avatar_url: profileData.pictureUrl || null,
      });

    if (memberError) {
      throw new Error(`Failed to upsert member: ${memberError.message}`);
    }

    // =============================================
    // 步驟 4: 回傳結果給前端
    // =============================================
    return new Response(
      JSON.stringify({
        success: true,
        member: member,
        line_user_id: profileData.userId,
        access_token: tokenData.access_token, // 前端可以儲存以備後用
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

// =============================================
// 部署說明
// =============================================
// 1. 在 Supabase Dashboard 建立 Edge Function
// 2. 設定環境變數：
//    - LINE_CHANNEL_ID
//    - LINE_CHANNEL_SECRET
//    - SUPABASE_URL (自動提供)
//    - SUPABASE_SERVICE_ROLE_KEY (自動提供)
// 3. 部署此函數
// 4. 複製函數 URL 到前端 config.js

