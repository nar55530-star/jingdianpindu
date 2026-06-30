'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  Heart,
  MessageSquare,
  Star,
  Quote,
  Send,
  Pin,
} from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  author: string;
  description: string | null;
  content: string | null;
  cover_key: string | null;
  pdf_key: string | null;
}

interface Post {
  id: string;
  user_id: string;
  article_id: number;
  content: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  users: { nickname: string } | null;
  articles: { title: string } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users: { nickname: string } | null;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const articleId = Number(params.id);

  const [article, setArticle] = useState<Article | null>(null);
  const [isRead, setIsRead] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newCommentContent, setNewCommentContent] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const loadArticle = useCallback(async () => {
    if (!articleId) return;
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();
    if (data) setArticle(data as unknown as Article);
  }, [articleId]);

  const loadReadingRecord = useCallback(async () => {
    if (!user?.id || !articleId) return;
    const { data } = await supabase
      .from('reading_records')
      .select('article_id')
      .eq('user_id', user.id)
      .eq('article_id', articleId);
    if (data && data.length > 0) setIsRead(true);
  }, [user?.id, articleId]);

  const loadFavorite = useCallback(async () => {
    if (!user?.id || !articleId) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', 'article')
      .eq('target_id', String(articleId));
    if (data && data.length > 0) setIsFavorited(true);
  }, [user?.id, articleId]);

  const loadPosts = useCallback(async () => {
    if (!articleId) return;
    const { data } = await supabase
      .from('posts')
      .select('id, user_id, article_id, content, likes_count, comments_count, is_pinned, created_at, users(nickname), articles(title)')
      .eq('article_id', articleId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setPosts(data as unknown as Post[]);
  }, [articleId]);

  const loadLikedPosts = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map((l: { post_id: string }) => l.post_id)));
  }, [user?.id]);

  useEffect(() => {
    loadArticle();
    loadPosts();
  }, [loadArticle, loadPosts]);

  useEffect(() => {
    loadReadingRecord();
    loadFavorite();
    loadLikedPosts();
  }, [loadReadingRecord, loadFavorite, loadLikedPosts]);

  const handleCheckIn = async () => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('reading_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('article_id', articleId);
    if (!existing || existing.length === 0) {
      await supabase
        .from('reading_records')
        .insert({ user_id: user.id, article_id: articleId });
    }
    setIsRead(true);
  };

  const handleFavorite = async () => {
    if (!user) return;
    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', 'article')
        .eq('target_id', String(articleId));
      setIsFavorited(false);
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, target_type: 'article', target_id: String(articleId) });
      setIsFavorited(true);
    }
  };

  const handlePostSubmit = async () => {
    if (!user || !newPostContent.trim()) return;
    const { data } = await supabase
      .from('posts')
      .insert({ user_id: user.id, article_id: articleId, content: newPostContent.trim() })
      .select('id, user_id, article_id, content, likes_count, comments_count, is_pinned, created_at, users(nickname), articles(title)')
      .single();
    if (data) {
      setPosts([data as unknown as Post, ...posts]);
      setNewPostContent('');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    if (likedPosts.has(postId)) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(posts.map((p) => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
      setLikedPosts((prev) => { const n = new Set(prev); n.add(postId); return n; });
      setPosts(posts.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const handleLoadComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    if (!comments[postId]) {
      const { data } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, users(nickname)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (data) setComments({ ...comments, [postId]: data as unknown as Comment[] });
    }
    setExpandedPostId(postId);
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!user || !newCommentContent.trim()) return;
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content: newCommentContent.trim() })
      .select('id, content, created_at, user_id, users(nickname)')
      .single();
    if (data) {
      setComments({ ...comments, [postId]: [...(comments[postId] || []), data as unknown as Comment] });
      setPosts(posts.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
      setNewCommentContent('');
    }
  };

  if (!article) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" onClick={() => router.push('/')} className="mb-4 -ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回首页
      </Button>

      <Card className="border-border">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-serif text-2xl text-primary">
                《{article.title}》
              </CardTitle>
              <Badge variant="outline" className="mt-2 border-primary/30 text-primary">
                {article.author}
              </Badge>
            </div>
            {isRead && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                已完成阅读
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground leading-relaxed">
            {article.description || '暂无简介'}
          </p>

          {article.content && (
            <div className="mt-6 rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2 text-primary">
                <BookOpen className="h-5 w-5" />
                <h2 className="font-serif text-lg font-semibold">原文选读</h2>
              </div>
              <div className="prose prose-neutral max-w-none">
                {article.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 text-foreground leading-[1.9] text-[15px] indent-[2em] font-serif">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleCheckIn}
              disabled={isRead || !user}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isRead ? '已打卡' : '完成阅读打卡'}
            </Button>
            <Button
              variant={isFavorited ? 'default' : 'outline'}
              onClick={handleFavorite}
              disabled={!user}
              className={isFavorited ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              <Star className="mr-2 h-4 w-4" />
              {isFavorited ? '已收藏' : '收藏篇目'}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/forum?article_id=${articleId}`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                查看心得
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/quotes?article_id=${articleId}`}>
                <Quote className="mr-2 h-4 w-4" />
                摘录金句
              </Link>
            </Button>
          </div>

          {!user && (
            <p className="mt-2 text-sm text-muted-foreground">请先设置昵称后再进行打卡和互动</p>
          )}
        </CardContent>
      </Card>

      {user && (
        <Card className="mt-6 border-border">
          <CardHeader>
            <CardTitle className="font-serif text-lg">发表阅读心得</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={`写下你阅读《${article.title}》的感想...`}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={4}
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handlePostSubmit}
                disabled={!newPostContent.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="mr-2 h-4 w-4" />
                发布心得
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <h3 className="mb-4 font-serif text-lg font-medium">相关心得</h3>
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            暂无心得，来写第一篇吧
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-serif">
                        {(post.users as unknown as { nickname: string })?.nickname?.charAt(0) || '?'}
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {(post.users as unknown as { nickname: string })?.nickname || '未知用户'}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      {post.is_pinned && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          <Pin className="mr-1 h-3 w-3" /> 置顶
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1 text-sm ${
                        likedPosts.has(post.id) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      {post.likes_count}
                    </button>
                    <button
                      onClick={() => handleLoadComments(post.id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {post.comments_count}
                    </button>
                  </div>

                  {expandedPostId === post.id && (
                    <div className="mt-4 border-t border-border pt-4">
                      {(comments[post.id] || []).map((comment) => (
                        <div key={comment.id} className="mb-3 flex gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/50 text-xs">
                            {(comment.users as unknown as { nickname: string })?.nickname?.charAt(0) || '?'}
                          </div>
                          <div>
                            <span className="text-xs font-medium">
                              {(comment.users as unknown as { nickname: string })?.nickname || '未知'}
                            </span>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      {user && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="写评论..."
                            value={expandedPostId === post.id ? newCommentContent : ''}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCommentSubmit(post.id)}
                            disabled={!newCommentContent.trim()}
                            className="bg-primary text-primary-foreground"
                          >
                            发送
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
