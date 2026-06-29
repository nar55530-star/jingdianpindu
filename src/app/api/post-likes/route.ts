import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/post-likes - 点赞/取消点赞
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { post_id, user_id } = body;

  if (!post_id || !user_id) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 检查是否已点赞
  const { data: existing } = await client
    .from('post_likes')
    .select('id')
    .eq('post_id', post_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (existing) {
    // 取消点赞
    const { error } = await client.from('post_likes').delete().eq('id', existing.id);
    if (error) {
      return NextResponse.json({ error: `操作失败: ${error.message}` }, { status: 500 });
    }

    // 更新点赞计数
    const { data: post } = await client.from('posts').select('likes_count').eq('id', post_id).single();
    if (post) {
      await client
        .from('posts')
        .update({ likes_count: Math.max(0, (post.likes_count || 1) - 1) })
        .eq('id', post_id);
    }

    return NextResponse.json({ liked: false });
  } else {
    // 点赞
    const { error } = await client.from('post_likes').insert({ post_id, user_id });
    if (error) {
      return NextResponse.json({ error: `点赞失败: ${error.message}` }, { status: 500 });
    }

    // 更新点赞计数
    const { data: post } = await client.from('posts').select('likes_count').eq('id', post_id).single();
    if (post) {
      await client
        .from('posts')
        .update({ likes_count: (post.likes_count || 0) + 1 })
        .eq('id', post_id);
    }

    return NextResponse.json({ liked: true });
  }
}

// GET /api/post-likes?post_id=xxx&user_id=xxx - 检查是否已点赞
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('post_id');
  const userId = searchParams.get('user_id');

  if (!postId || !userId) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data } = await client
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({ liked: !!data });
}
