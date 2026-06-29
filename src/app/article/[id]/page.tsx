'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  Trash2,
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

  useEffect(() => {
    if (!articleId) return;

    // 获取篇目信息
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => {
        const found = data.articles?.find((a: Article) => a.id === articleId);
        if (found) setArticle(found);
      });

    // 获取阅读记录
    if (user?.id) {
      fetch(`/api/reading-records?user_id=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.records) {
            setIsRead(data.records.some((r: { article_id: number }) => r.article_id === articleId));
          }
        });

      // 检查收藏
      fetch(`/api/favorites?user_id=${user.id}&target_type=article`)
        .then((res) => res.json())
        .then((data) => {
          if (data.favorites) {
            setIsFavorited(data.favorites.some((f: { target_id: string }) => f.target_id === String(articleId)));
          }
        });
    }

    // 获取相关帖子
    fetch(`/api/posts?article_id=${articleId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) setPosts(data.posts);
      });
  }, [articleId, user?.id]);

  const handleCheckIn = async () => {
    if (!user) return;
    const res = await fetch('/api/reading-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, article_id: articleId }),
    });
    const data = await res.json();
    if (data.already_read) {
      setIsRead(true);
    } else {
      setIsRead(true);
    }
  };

  const handleFavorite = async () => {
    if (!user) return;
    if (isFavorited) {
      await fetch(`/api/favorites?user_id=${user.id}&target_type=article&target_id=${articleId}`, {
        method: 'DELETE',
      });
      setIsFavorited(false);
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, target_type: 'article', target_id: String(articleId) }),
      });
      setIsFavorited(true);
    }
  };

  const handlePostSubmit = async () => {
    if (!user || !newPostContent.trim()) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        article_id: articleId,
        content: newPostContent.trim(),
      }),
    });
    const data = await res.json();
    if (data.post) {
      setPosts([data.post, ...posts]);
      setNewPostContent('');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    const res = await fetch('/api/post-likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, user_id: user.id }),
    });
    const data = await res.json();
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (data.liked) next.add(postId);
      else next.delete(postId);
      return next;
    });
    // 更新帖子点赞数
    setPosts(posts.map((p) =>
      p.id === postId
        ? { ...p, likes_count: data.liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }
        : p
    ));
  };

  const handleLoadComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    if (!comments[postId]) {
      const res = await fetch(`/api/comments?post_id=${postId}`);
      const data = await res.json();
      if (data.comments) {
        setComments({ ...comments, [postId]: data.comments });
      }
    }
    setExpandedPostId(postId);
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!user || !newCommentContent.trim()) return;
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        user_id: user.id,
        content: newCommentContent.trim(),
      }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), data.comment],
      });
      setPosts(posts.map((p) =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
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
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => router.push('/')} className="mb-4 -ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回首页
      </Button>

      {/* 篇目信息卡片 */}
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

          {/* 文章正文 */}
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

          {/* 操作按钮 */}
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

      {/* 发表心得 */}
      {user && (
        <Card className="mt-6 border-border">
          <CardHeader>
            <CardTitle className="font-serif text-lg">发表阅读心得</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="写下你阅读《{article.title}》的感想..."
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

      {/* 心得列表 */}
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
                        {(post.users as { nickname: string } | null)?.nickname?.charAt(0) || '?'}
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {(post.users as { nickname: string } | null)?.nickname || '未知用户'}
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

                  {/* 评论区域 */}
                  {expandedPostId === post.id && (
                    <div className="mt-4 border-t border-border pt-4">
                      {(comments[post.id] || []).map((comment) => (
                        <div key={comment.id} className="mb-3 flex gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/50 text-xs">
                            {(comment.users as { nickname: string } | null)?.nickname?.charAt(0) || '?'}
                          </div>
                          <div>
                            <span className="text-xs font-medium">
                              {(comment.users as { nickname: string } | null)?.nickname || '未知'}
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
