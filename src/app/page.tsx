'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  CheckCircle2,
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  Quote,
} from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  author: string;
  description: string | null;
  cover_key: string | null;
  content: string | null;
  sort_order: number;
}

interface ReadingRecord {
  article_id: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  users: { nickname: string } | null;
}

export default function HomePage() {
  const { user } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [readArticleIds, setReadArticleIds] = useState<Set<number>>(new Set());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ user_id: string; nickname: string; count: number }[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalQuotes, setTotalQuotes] = useState(0);

  const loadArticles = useCallback(async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setArticles(data as unknown as Article[]);
  }, []);

  const loadReadingRecords = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('reading_records')
      .select('article_id')
      .eq('user_id', user.id);
    if (data) setReadArticleIds(new Set(data.map((r: ReadingRecord) => r.article_id)));
  }, [user?.id]);

  const loadAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, created_at, users(nickname)')
      .order('created_at', { ascending: false })
      .limit(3);
    if (data) setAnnouncements(data as unknown as Announcement[]);
  }, []);

  const loadLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('reading_records')
      .select('user_id, users(nickname)');
    if (data) {
      const countMap = new Map<string, { nickname: string; count: number }>();
      for (const r of data) {
        const nickname = (r.users as unknown as { nickname: string })?.nickname || '未知用户';
        const existing = countMap.get(r.user_id);
        if (existing) {
          existing.count++;
        } else {
          countMap.set(r.user_id, { nickname, count: 1 });
        }
      }
      const sorted = Array.from(countMap.entries())
        .map(([user_id, v]) => ({ user_id, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setLeaderboard(sorted);
    }
  }, []);

  const loadStats = useCallback(async () => {
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    if (postCount !== null) setTotalPosts(postCount);

    const { count: quoteCount } = await supabase
      .from('golden_quotes')
      .select('*', { count: 'exact', head: true });
    if (quoteCount !== null) setTotalQuotes(quoteCount);
  }, []);

  useEffect(() => {
    loadArticles();
    loadAnnouncements();
    loadLeaderboard();
    loadStats();
  }, [loadArticles, loadAnnouncements, loadLeaderboard, loadStats]);

  useEffect(() => {
    loadReadingRecords();
  }, [loadReadingRecords]);

  const readCount = readArticleIds.size;
  const totalCount = articles.length;
  const progressPercent = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  // 徽章计算
  const badges: { name: string; icon: string; earned: boolean }[] = [
    { name: '初读者', icon: '📖', earned: readCount >= 1 },
    { name: '思考者', icon: '🤔', earned: readCount >= 3 },
    { name: '深思者', icon: '💡', earned: readCount >= 5 },
    { name: '经典品读达人', icon: '🏆', earned: readCount >= totalCount && totalCount > 0 },
  ];

  // 为每个篇目生成封面颜色
  const coverColors = [
    'from-red-900/80 to-amber-900/60',
    'from-amber-900/80 to-yellow-900/60',
    'from-emerald-900/80 to-teal-900/60',
    'from-blue-900/80 to-indigo-900/60',
    'from-purple-900/80 to-pink-900/60',
    'from-stone-800/80 to-red-900/60',
  ];

  return (
    <div className="bg-ink-wash min-h-screen">
      {/* Hero 区域 */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">
              经典品读学习交流平台
            </h1>
            <p className="mt-3 text-lg text-muted-foreground font-serif">
              读经典 · 悟思想 · 共成长
            </p>
          </div>

          {/* 统计概览 */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4 shadow-sm">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="mt-1 text-2xl font-bold text-foreground">{totalCount}</span>
              <span className="text-xs text-muted-foreground">经典篇目</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <span className="mt-1 text-2xl font-bold text-foreground">{readCount}</span>
              <span className="text-xs text-muted-foreground">已读篇目</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4 shadow-sm">
              <MessageSquare className="h-6 w-6 text-amber-600" />
              <span className="mt-1 text-2xl font-bold text-foreground">{totalPosts}</span>
              <span className="text-xs text-muted-foreground">心得交流</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4 shadow-sm">
              <Quote className="h-6 w-6 text-rose-600" />
              <span className="mt-1 text-2xl font-bold text-foreground">{totalQuotes}</span>
              <span className="text-xs text-muted-foreground">金句摘录</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 左侧：经典篇目 */}
          <div className="lg:col-span-2">
            {/* 阅读进度 */}
            {user && totalCount > 0 && (
              <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold text-foreground">我的阅读进度</h3>
                  <span className="text-sm text-muted-foreground">
                    {readCount} / {totalCount} 篇
                  </span>
                </div>
                <Progress value={progressPercent} className="mt-3 h-2" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <Badge
                      key={badge.name}
                      variant={badge.earned ? 'default' : 'outline'}
                      className={badge.earned ? 'bg-primary text-white' : ''}
                    >
                      {badge.icon} {badge.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 公告栏 */}
            {announcements.length > 0 && (
              <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  公告栏
                </h3>
                <div className="mt-3 space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
                      <p className="font-medium text-foreground">{a.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.users?.nickname} · {new Date(a.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">经典篇目</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {articles.map((article, index) => {
                const isRead = readArticleIds.has(article.id);
                return (
                  <Link key={article.id} href={`/article/${article.id}`}>
                    <Card className="group overflow-hidden border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer">
                      {/* 封面渐变色 */}
                      <div
                        className={`relative h-32 bg-gradient-to-br ${coverColors[index % coverColors.length]} flex items-center justify-center`}
                      >
                        <span className="font-serif text-xl font-bold text-white/90 text-center px-4 drop-shadow-lg">
                          {article.title}
                        </span>
                        {isRead && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs text-white">
                            <CheckCircle2 className="h-3 w-3" />
                            已读
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground font-serif">{article.author}</p>
                        <p className="mt-1 text-sm text-foreground/80 line-clamp-2">
                          {article.description}
                        </p>
                      </CardContent>
                      <CardFooter className="border-t border-border px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                        >
                          <BookOpen className="mr-1 h-4 w-4" />
                          {isRead ? '再次阅读' : '开始阅读'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 右侧：排行榜 */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                阅读排行榜
              </h3>
              {leaderboard.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground text-center">暂无阅读记录</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {leaderboard.map((item, index) => (
                    <div key={item.user_id} className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                          index === 0
                            ? 'bg-amber-100 text-amber-700'
                            : index === 1
                            ? 'bg-gray-100 text-gray-600'
                            : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-foreground">{item.nickname}</span>
                      <span className="text-sm font-medium text-primary">{item.count} 篇</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-border pt-4">
                <h4 className="font-serif text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  快速导航
                </h4>
                <div className="mt-2 space-y-2">
                  <Link
                    href="/forum"
                    className="block rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5"
                  >
                    💬 心得论坛
                  </Link>
                  <Link
                    href="/quotes"
                    className="block rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5"
                  >
                    ✨ 金句墙
                  </Link>
                  {user && (
                    <Link
                      href="/profile"
                      className="block rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5"
                    >
                      👤 个人中心
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
