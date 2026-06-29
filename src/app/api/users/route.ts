import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/users?id=xxx - 获取用户信息
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client.from('users').select('*').eq('id', id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: data });
}

// POST /api/users - 创建用户（设置昵称）
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nickname } = body;

  if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
    return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
  }

  if (nickname.trim().length > 20) {
    return NextResponse.json({ error: '昵称不能超过20个字符' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .insert({ nickname: nickname.trim(), is_admin: false })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `创建失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

// PUT /api/users - 更新用户昵称
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, nickname } = body;

  if (!id || !nickname) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .update({ nickname: nickname.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `更新失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
