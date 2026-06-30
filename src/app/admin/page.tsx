'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Users,
  MessageSquare,
  Quote,
  Pin,
  Trash2,
  Plus,
  Trophy,
  Megaphone,
} from 'lucide-react';

interface Article {
  id: number;
  title: string;
  author: string;
  description: string;
  content: string | null;
  sort_order: number;
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

interface LeaderboardEntry {
  user_id: string;
  nickname: string;
  count: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  users: { nickname: string } | null;
}

export default function AdminPage() {
  const { user } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newArticle, setNewArticle] = useState({ title: '', author: '', description: '', content: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

  const loadAll = useCallback(async () => {
    const [articlesRes, postsRes, recordsRes, announcementsRes] = await Promise.all([
      supabase.from('articles').select('*').order('sort_order'),
      supabase.from('posts').select('id, user_id, article_id, content, likes_count, comments_count, is_pinned, created_at, users(nickname), articles(title)').order('created_at', { ascending: false }),
      supabase.from('reading_records').select('user_id, users(nickname)'),
      supabase.from('announcements').select('id, title, content, created_at, users(nickname)').order('created_at', { ascending: false }),
    ]);
    if (articlesRes.data) setArticles(articlesRes.data as unknown as Article[]);
    if (postsRes.data) setPosts(postsRes.data as unknown as Post[]);
    if (announcementsRes.data) setAnnouncements(announcementsRes.data as unknown as Announcement[]);
    if (recordsRes.data) {
      const counts: Record<string, { nickname: string; count: number }> = {};
      for (const r of recordsRes.data) {
        const uid = r.user_id;
        const nick = ((r.users as unknown as { nickname: string }) || {}).nickname || '未知';
        if (!counts[uid]) counts[uid] = { nickname: nick, count: 0 };
        counts[uid].count++;
      }
      setLeaderboard(
        Object.entries(counts)
          .map(([user_id, v]) => ({ user_id, ...v }))
          .sort((a, b) => b.count - a.count)
      );
    }
  }, []);

  useEffect(() => {
    if (user?.is_admin) loadAll();
  }, [user?.is_admin, loadAll]);

  const handleCreateArticle = async () => {
    if (!newArticle.title || !newArticle.author) return;
    const maxOrder = articles.length > 0 ? Math.max(...articles.map((a) => a.sort_order)) : 0;
    await supabase.from('articles').insert({
      title: newArticle.title,
      author: newArticle.author,
      description: newArticle.description,
      content: newArticle.content || null,
      sort_order: maxOrder + 1,
    });
    setNewArticle({ title: '', author: '', description: '', content: '' });
    loadAll();
  };

  const handleDeleteArticle = async (id: number) => {
    await supabase.from('articles').delete().eq('id', id);
    loadAll();
  };

  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    await supabase.from('posts').update({ is_pinned: !isPinned }).eq('id', postId);
    loadAll();
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    loadAll();
  };

  const handleCreateAnnouncement = async () => {
    if (!user || !newAnnouncement.title || !newAnnouncement.content) return;
    await supabase.from('announcements').insert({
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      user_id: user.id,
    });
    setNewAnnouncement({ title: '', content: '' });
    loadAll();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    loadAll();
  };

  if (!user?.is_admin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">仅管理员可访问此页面</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">管理后台</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 篇目管理 */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <BookOpen className="h-5 w-5 text-primary" />
              篇目管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <Input
                placeholder="篇目标题"
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
              />
              <Input
                placeholder="作者"
                value={newArticle.author}
                onChange={(e) => setNewArticle({ ...newArticle, author: e.target.value })}
              />
              <Input
                placeholder="简介"
                value={newArticle.description}
                onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
              />
              <Textarea
                placeholder="正文内容（选填）"
                value={newArticle.content}
                onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                rows={3}
              />
              <Button onClick={handleCreateArticle} className="w-full bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> 添加篇目
              </Button>
            </div>
            <div className="space-y-2">
              {articles.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">《{a.title}》</p>
                    <p className="text-xs text-muted-foreground">{a.author}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteArticle(a.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 帖子管理 */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <MessageSquare className="h-5 w-5 text-primary" />
              帖子管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {posts.map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {(p.users as unknown as { nickname: string })?.nickname || '未知'}
                        </span>
                        {p.is_pinned && (
                          <span className="text-xs text-amber-600">已置顶</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{p.content}</p>
                      <p className="text-xs text-muted-foreground">
                        《{(p.articles as unknown as { title: string })?.title || '未知'}》
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="sm" onClick={() => handleTogglePin(p.id, p.is_pinned)}>
                        <Pin className={`h-4 w-4 ${p.is_pinned ? 'text-amber-600' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePost(p.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 阅读排行 */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <Trophy className="h-5 w-5 text-primary" />
              阅读排行
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{entry.nickname}</span>
                    </div>
                    <span className="text-sm text-primary font-medium">{entry.count} 篇</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 公告管理 */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <Megaphone className="h-5 w-5 text-primary" />
              公告管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <Input
                placeholder="公告标题"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              />
              <Textarea
                placeholder="公告内容"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                rows={2}
              />
              <Button onClick={handleCreateAnnouncement} className="w-full bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> 发布公告
              </Button>
            </div>
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.content}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteAnnouncement(a.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 统计概览 */}
      <Card className="mt-6 border-border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{articles.length}</p>
              <p className="text-xs text-muted-foreground">篇目总数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{posts.length}</p>
              <p className="text-xs text-muted-foreground">心得总数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{leaderboard.length}</p>
              <p className="text-xs text-muted-foreground">活跃用户</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{announcements.length}</p>
              <p className="text-xs text-muted-foreground">公告数</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
