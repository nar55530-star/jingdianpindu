'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/user-context';
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

  useEffect(() => {
    // 获取篇目列表
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => {
        if (data.articles) setArticles(data.articles);
      });

    // 获取阅读记录
    if (user?.id) {
      fetch(`/api/reading-records?user_id=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.records) {
            setReadArticleIds(new Set(data.records.map((r: ReadingRecord) => r.article_id)));
          }
        });
    }

    // 获取公告
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (data.announcements) setAnnouncements(data.announcements.slice(0, 3));
      });

    // 获取排行榜
    fetch('/api/reading-records')
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) setLeaderboard(data.leaderboard.slice(0, 5));
      });

    // 获取统计数据
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) setTotalPosts(data.posts.length);
      });

    fetch('/api/golden-quotes')
      .then((res) => res.json())
      .then((data) => {
        if (data.quotes) setTotalQuotes(data.quotes.length);
      });
  }, [user?.id]);

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
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-1 text-2xl font-bold text-foreground">{totalCount}</p>
              <p className="text-xs text-muted-foreground">经典篇目</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <MessageSquare className="mx-auto h-6 w-6 text-accent" />
              <p className="mt-1 text-2xl font-bold text-foreground">{totalPosts}</p>
              <p className="text-xs text-muted-foreground">心得分享</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <Quote className="mx-auto h-6 w-6 text-secondary-foreground" />
              <p className="mt-1 text-2xl font-bold text-foreground">{totalQuotes}</p>
              <p className="text-xs text-muted-foreground">金句摘录</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <Users className="mx-auto h-6 w-6 text-destructive" />
              <p className="mt-1 text-2xl font-bold text-foreground">{leaderboard.length}</p>
              <p className="text-xs text-muted-foreground">活跃读者</p>
            </div>
          </div>

          {/* 阅读进度（仅登录用户） */}
          {user && (
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-serif font-medium">我的阅读进度</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {readCount} / {totalCount} 篇
                </span>
              </div>
              <Progress value={progressPercent} className="mt-2 h-3" />
              <div className="mt-3 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <Badge
                    key={badge.name}
                    variant={badge.earned ? 'default' : 'outline'}
                    className={badge.earned ? 'bg-primary text-primary-foreground' : ''}
                  >
                    {badge.icon} {badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 公告栏 */}
      {announcements.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h2 className="flex items-center gap-2 font-serif font-medium text-primary">
              <Star className="h-4 w-4" />
              公告栏
            </h2>
            <div className="mt-2 space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="text-sm">
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-2 text-muted-foreground text-xs">
                    {new Date(a.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 经典篇目网格 */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">经典篇目</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, idx) => {
            const isRead = readArticleIds.has(article.id);
            return (
              <Card
                key={article.id}
                className="article-card-hover overflow-hidden border-border"
              >
                {/* 封面 */}
                <div
                  className={`relative h-48 bg-gradient-to-br ${coverColors[idx % coverColors.length]} flex items-center justify-center p-6`}
                >
                  <div className="text-center">
                    <h3 className="font-serif text-xl font-bold text-white/90 leading-relaxed">
                      《{article.title}》
                    </h3>
                    <p className="mt-2 text-sm text-white/60">{article.author}</p>
                  </div>
                  {isRead && (
                    <div className="absolute right-3 top-3">
                      <div className="stamp text-white border-white/60">已读</div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                </div>

                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      {article.author}
                    </Badge>
                    {isRead && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        已完成
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.description || '暂无简介'}
                  </p>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link href={`/article/${article.id}`} className="w-full">
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      size="sm"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      {isRead ? '再次阅读' : '开始阅读'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 阅读排行榜 */}
      {leaderboard.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">阅读排行</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-3">
              {leaderboard.map((item, idx) => (
                <div key={item.user_id} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                      idx === 0
                        ? 'bg-yellow-500 text-white'
                        : idx === 1
                          ? 'bg-gray-400 text-white'
                          : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 font-medium">{item.nickname}</span>
                  <span className="text-sm text-muted-foreground">
                    已读 {item.count} 篇
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
