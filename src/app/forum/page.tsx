'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart,
  MessageSquare,
  Send,
  Pin,
  BookOpen,
} from 'lucide-react';

interface Article {
  id: number;
  title: string;
  author: string;
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

export default function ForumPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">加载中...</div>}>
      <ForumContent />
    </Suspense>
  );
}

function ForumContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const preselectedArticleId = searchParams.get('article_id');

  const [articles, setArticles] = useState<Article[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>(preselectedArticleId || 'all');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostArticleId, setNewPostArticleId] = useState<string>(preselectedArticleId || '');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newCommentContent, setNewCommentContent] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const loadArticles = useCallback(async () => {
    const { data } = await supabase
      .from('articles')
      .select('id, title, author')
      .order('sort_order');
    if (data) setArticles(data as unknown as Article[]);
  }, []);

  const loadPosts = useCallback(async (articleId: string) => {
    let query = supabase
      .from('posts')
      .select('id, user_id, article_id, content, likes_count, comments_count, is_pinned, created_at, users(nickname), articles(title)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (articleId !== 'all') {
      query = query.eq('article_id', Number(articleId));
    }
    const { data } = await query;
    if (data) setPosts(data as unknown as Post[]);
  }, []);

  const loadLikedPosts = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map((l: { post_id: string }) => l.post_id)));
  }, [user?.id]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    loadPosts(selectedArticleId);
  }, [selectedArticleId, loadPosts]);

  useEffect(() => {
    loadLikedPosts();
  }, [loadLikedPosts]);

  const handlePostSubmit = async () => {
    if (!user || !newPostContent.trim() || !newPostArticleId) return;
    const { data } = await supabase
      .from('posts')
      .insert({ user_id: user.id, article_id: Number(newPostArticleId), content: newPostContent.trim() })
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
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(posts.map((p) => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">心得论坛</h1>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">按篇目筛选：</span>
        <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="全部篇目" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部篇目</SelectItem>
            {articles.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                《{a.title}》- {a.author}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {user && (
        <Card className="mb-6 border-border">
          <CardContent className="pt-4">
            <div className="mb-3">
              <Select value={newPostArticleId} onValueChange={setNewPostArticleId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择关联篇目" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      《{a.title}》
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="分享你的阅读心得..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={3}
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handlePostSubmit}
                disabled={!newPostContent.trim() || !newPostArticleId}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="mr-2 h-4 w-4" />
                发布心得
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">暂无心得，来写第一篇吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="border-border">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-serif font-medium">
                      {(post.users as unknown as { nickname: string })?.nickname?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {(post.users as unknown as { nickname: string })?.nickname || '未知用户'}
                        </span>
                        {post.is_pinned && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            <Pin className="mr-1 h-3 w-3" /> 置顶
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                        <span>·</span>
                        <span>《{(post.articles as unknown as { title: string })?.title || '未知篇目'}》</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <div className="mt-4 flex items-center gap-5">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      likedPosts.has(post.id) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    {post.likes_count}
                  </button>
                  <button
                    onClick={() => handleLoadComments(post.id)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {post.comments_count} 条评论
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
                          value={newCommentContent}
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
  );
}
