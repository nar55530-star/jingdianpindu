import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/announcements - 获取公告
export async function GET() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('announcements')
    .select('*, users(nickname)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ announcements: data });
}

// POST /api/announcements - 发布公告（管理员）
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, title, content } = body;

  if (!user_id || !title || !content) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('announcements')
    .insert({ user_id, title: title.trim(), content: content.trim() })
    .select('*, users(nickname)')
    .single();

  if (error) {
    return NextResponse.json({ error: `发布失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ announcement: data });
}

// DELETE /api/announcements?id=xxx - 删除公告
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少公告ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { error } = await client.from('announcements').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: `删除失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
