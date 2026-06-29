import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/quote-likes - 点赞/取消点赞金句
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { quote_id, user_id } = body;

  if (!quote_id || !user_id) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data: existing } = await client
    .from('quote_likes')
    .select('id')
    .eq('quote_id', quote_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (existing) {
    const { error } = await client.from('quote_likes').delete().eq('id', existing.id);
    if (error) {
      return NextResponse.json({ error: `操作失败: ${error.message}` }, { status: 500 });
    }

    const { data: q } = await client.from('golden_quotes').select('likes_count').eq('id', quote_id).single();
    if (q) {
      await client
        .from('golden_quotes')
        .update({ likes_count: Math.max(0, (q.likes_count || 1) - 1) })
        .eq('id', quote_id);
    }

    return NextResponse.json({ liked: false });
  } else {
    const { error } = await client.from('quote_likes').insert({ quote_id, user_id });
    if (error) {
      return NextResponse.json({ error: `点赞失败: ${error.message}` }, { status: 500 });
    }

    const { data: q } = await client.from('golden_quotes').select('likes_count').eq('id', quote_id).single();
    if (q) {
      await client
        .from('golden_quotes')
        .update({ likes_count: (q.likes_count || 0) + 1 })
        .eq('id', quote_id);
    }

    return NextResponse.json({ liked: true });
  }
}

// GET /api/quote-likes?quote_id=xxx&user_id=xxx - 检查是否已点赞
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get('quote_id');
  const userId = searchParams.get('user_id');

  if (!quoteId || !userId) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data } = await client
    .from('quote_likes')
    .select('id')
    .eq('quote_id', quoteId)
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({ liked: !!data });
}
