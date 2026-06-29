import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/favorites?user_id=xxx&target_type=article - 获取收藏
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const targetType = searchParams.get('target_type');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  let query = client.from('favorites').select('*').eq('user_id', userId);

  if (targetType) {
    query = query.eq('target_type', targetType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ favorites: data });
}

// POST /api/favorites - 添加收藏
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, target_type, target_id } = body;

  if (!user_id || !target_type || !target_id) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 检查是否已收藏
  const { data: existing } = await client
    .from('favorites')
    .select('id')
    .eq('user_id', user_id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ favorite: existing, already_favorited: true });
  }

  const { data, error } = await client
    .from('favorites')
    .insert({ user_id, target_type, target_id: String(target_id) })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `收藏失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ favorite: data, already_favorited: false });
}

// DELETE /api/favorites - 取消收藏
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const targetType = searchParams.get('target_type');
  const targetId = searchParams.get('target_id');

  if (!userId || !targetType || !targetId) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  if (error) {
    return NextResponse.json({ error: `取消收藏失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
