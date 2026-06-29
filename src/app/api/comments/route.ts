import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/comments?post_id=xxx - 获取评论
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('post_id');

  if (!postId) {
    return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('comments')
    .select('*, users(nickname)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: `查询失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}

// POST /api/comments - 发布评论
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { post_id, user_id, content } = body;

  if (!post_id || !user_id || !content) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 插入评论
  const { data, error } = await client
    .from('comments')
    .insert({ post_id, user_id, content: content.trim() })
    .select('*, users(nickname)')
    .single();

  if (error) {
    return NextResponse.json({ error: `评论失败: ${error.message}` }, { status: 500 });
  }

  // 更新帖子评论数
  const { data: post } = await client
    .from('posts')
    .select('comments_count')
    .eq('id', post_id)
    .single();

  if (post) {
    await client
      .from('posts')
      .update({ comments_count: (post.comments_count || 0) + 1 })
      .eq('id', post_id);
  }

  return NextResponse.json({ comment: data });
}

// DELETE /api/comments?id=xxx - 删除评论
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少评论ID' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 获取评论的 post_id 用于更新计数
  const { data: comment } = await client
    .from('comments')
    .select('post_id')
    .eq('id', id)
    .maybeSingle();

  const { error } = await client.from('comments').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: `删除失败: ${error.message}` }, { status: 500 });
  }

  // 更新帖子评论数
  if (comment?.post_id) {
    const { data: post } = await client
      .from('posts')
      .select('comments_count')
      .eq('id', comment.post_id)
      .single();

    if (post) {
      await client
        .from('posts')
        .update({ comments_count: Math.max(0, (post.comments_count || 1) - 1) })
        .eq('id', comment.post_id);
    }
  }

  return NextResponse.json({ success: true });
}
