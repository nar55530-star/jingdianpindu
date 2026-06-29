import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/reading-records?user_id=xxx - 获取用户阅读记录
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  const client = getSupabaseClient();

  if (userId) {
    const { data, error } = await client
      .from('reading_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ records: data });
  }

  // 获取排行榜（按阅读篇数排序）
  const { data, error } = await client
    .from('reading_records')
    .select('user_id, users(nickname)');

  if (error) {
    return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
  }

  // 统计每个用户的阅读数量
  const countMap = new Map<string, { nickname: string; count: number }>();
  if (data) {
    for (const record of data) {
      const uid = record.user_id;
      const existing = countMap.get(uid);
      if (existing) {
        existing.count++;
      } else {
        const nickname = (record.users as unknown as { nickname: string })?.nickname || '未知用户';
        countMap.set(uid, { nickname, count: 1 });
      }
    }
  }

  const leaderboard = Array.from(countMap.entries())
    .map(([user_id, info]) => ({ user_id, ...info }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return NextResponse.json({ leaderboard });
}

// POST /api/reading-records - 打卡（记录阅读）
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, article_id } = body;

  if (!user_id || !article_id) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 检查是否已打卡
  const { data: existing } = await client
    .from('reading_records')
    .select('id')
    .eq('user_id', user_id)
    .eq('article_id', article_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ record: existing, already_read: true });
  }

  const { data, error } = await client
    .from('reading_records')
    .insert({ user_id, article_id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `打卡失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ record: data, already_read: false });
}

// DELETE /api/reading-records?user_id=xxx&article_id=xxx - 取消打卡
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const articleId = searchParams.get('article_id');

  if (!userId || !articleId) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from('reading_records')
    .delete()
    .eq('user_id', userId)
    .eq('article_id', articleId);

  if (error) {
    return NextResponse.json({ error: `取消失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
