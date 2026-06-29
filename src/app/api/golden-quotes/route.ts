import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/golden-quotes - 获取金句
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const articleId = searchParams.get('article_id');

  const client = getSupabaseClient();

  let query = client
    .from('golden_quotes')
    .select('*, users(nickname), articles(title, author)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (articleId) {
    query = query.eq('article_id', articleId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ quotes: data });
}

// POST /api/golden-quotes - 发布金句
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, article_id, quote, reflection } = body;

  if (!user_id || !article_id || !quote) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('golden_quotes')
    .insert({ user_id, article_id, quote: quote.trim(), reflection: reflection?.trim() || null })
    .select('*, users(nickname), articles(title, author)')
    .single();

  if (error) {
    return NextResponse.json({ error: `发布失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ quote: data });
}

// DELETE /api/golden-quotes?id=xxx - 删除金句
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少金句ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { error } = await client.from('golden_quotes').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: `删除失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
