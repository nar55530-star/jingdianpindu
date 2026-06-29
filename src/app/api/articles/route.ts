import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/articles - 获取篇目列表
export async function GET() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('articles')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ articles: data });
}

// POST /api/articles - 创建篇目（管理员）
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, author, description, cover_key, pdf_key, sort_order } = body;

  if (!title || !author) {
    return NextResponse.json({ error: '标题和作者不能为空' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('articles')
    .insert({ title, author, description, cover_key, pdf_key, sort_order: sort_order || 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `创建失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ article: data });
}

// PUT /api/articles - 更新篇目（管理员）
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: '缺少篇目ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('articles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `更新失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ article: data });
}

// DELETE /api/articles?id=xxx - 删除篇目（管理员）
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少篇目ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { error } = await client.from('articles').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: `删除失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
