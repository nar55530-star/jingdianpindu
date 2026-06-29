import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/posts?article_id=xxx - 获取心得帖子
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('article_id');
  const userId = searchParams.get('user_id');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '10');

  const client = getSupabaseClient();

  let query = client
    .from('posts')
    .select('*, users(nickname), articles(title)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (articleId) {
    query = query.eq('article_id', articleId);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ posts: data });
}

// POST /api/posts - 发布心得
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, article_id, content } = body;

  if (!user_id || !article_id || !content) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  if (content.trim().length === 0) {
    return NextResponse.json({ error: '心得内容不能为空' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .insert({ user_id, article_id, content: content.trim() })
    .select('*, users(nickname), articles(title)')
    .single();

  if (error) {
    return NextResponse.json({ error: `发布失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

// PUT /api/posts - 更新帖子（管理员置顶等）
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `更新失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

// DELETE /api/posts?id=xxx - 删除帖子
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { error } = await client.from('posts').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: `删除失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
