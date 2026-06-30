'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  MessageSquare,
  Quote,
  Heart,
  Trophy,
  Edit3,
  Check,
} from 'lucide-react';

interface Article {
  id: number;
  title: string;
  author: string;
}

interface ReadingRecord {
  id: string;
  article_id: number;
  created_at: string;
  articles: Article | null;
}

interface Post {
  id: string;
  article_id: number;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  articles: { title: string } | null;
}

interface GoldenQuote {
  id: string;
  article_id: number;
  quote: string;
  reflection: string | null;
  likes_count: number;
  created_at: string;
  articles: { title: string } | null;
}

interface Favorite {
  id: string;
  target_type: string;
  target_id: string;
  created_at: string;
}

const BADGES = [
  { min: 1, label: '初读者', icon: '📖' },
  { min: 3, label: '思考者', icon: '🤔' },
  { min: 5, label: '深度阅读者', icon: '📚' },
  { min: 6, label: '经典品读达人', icon: '🏆' },
];

export default function ProfilePage() {
  const { user, setNickname: setUserNickname } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [readRecords, setReadRecords] = useState<ReadingRecord[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myQuotes, setMyQuotes] = useState<GoldenQuote[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [activeTab, setActiveTab] = useState<'reading' | 'posts' | 'quotes' | 'favorites'>('reading');
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  const loadArticles = useCallback(async () => {
    const { data } = await supabase.from('articles').select('id, title, author').order('sort_order');
    if (data) setArticles(data as unknown as Article[]);
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    const [recordsRes, postsRes, quotesRes, favsRes] = await Promise.all([
      supabase.from('reading_records').select('id, article_id, created_at, articles(id, title, author)').eq('user_id', user.id),
      supabase.from('posts').select('id, article_id, content, likes_count, comments_count, created_at, articles(title)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('golden_quotes').select('id, article_id, quote, reflection, likes_count, created_at, articles(title)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('favorites').select('id, target_type, target_id, created_at').eq('user_id', user.id),
    ]);
    if (recordsRes.data) setReadRecords(recordsRes.data as unknown as ReadingRecord[]);
    if (postsRes.data) setMyPosts(postsRes.data as unknown as Post[]);
    if (quotesRes.data) setMyQuotes(quotesRes.data as unknown as GoldenQuote[]);
    if (favsRes.data) setFavorites(favsRes.data as unknown as Favorite[]);
  }, [user?.id]);

  useEffect(() => {
    loadArticles();
    if (user?.id) loadUserData();
  }, [loadArticles, loadUserData, user?.id]);

  const totalArticles = articles.length;
  const readCount = readRecords.length;
  const earnedBadges = BADGES.filter((b) => readCount >= b.min);

  const handleSaveNickname = async () => {
    if (!user || !newNickname.trim()) return;
    await supabase.from('users').update({ nickname: newNickname.trim() }).eq('id', user.id);
    setUserNickname(newNickname.trim());
    setEditingNickname(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">请先设置昵称</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 用户信息卡片 */}
      <Card className="mb-6 border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-serif font-bold">
              {user.nickname?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              {editingNickname ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <Button size="sm" onClick={handleSaveNickname} className="bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-serif font-bold">{user.nickname}</span>
                  <button
                    onClick={() => { setNewNickname(user.nickname); setEditingNickname(true); }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                已读 {readCount} / {totalArticles} 篇
              </p>
            </div>
          </div>

          {/* 阅读进度 */}
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-border">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: totalArticles > 0 ? `${(readCount / totalArticles) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* 徽章 */}
          {earnedBadges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {earnedBadges.map((badge) => (
                <Badge key={badge.label} className="bg-primary/10 text-primary hover:bg-primary/20">
                  <span className="mr-1">{badge.icon}</span>
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 标签页 */}
      <div className="mb-4 flex border-b border-border">
        {[
          { key: 'reading' as const, label: '我的阅读', icon: BookOpen },
          { key: 'posts' as const, label: '我的心得', icon: MessageSquare },
          { key: 'quotes' as const, label: '我的金句', icon: Quote },
          { key: 'favorites' as const, label: '我的收藏', icon: Heart },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      {activeTab === 'reading' && (
        <div>
          {readRecords.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">还没有阅读记录</p>
          ) : (
            <div className="space-y-3">
              {readRecords.map((r) => (
                <Card key={r.id} className="border-border">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">《{(r.articles as unknown as { title: string }[])?.[0]?.title || '未知'}》</p>
                        <p className="text-xs text-muted-foreground">{(r.articles as unknown as { author: string }[])?.[0]?.author}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div>
          {myPosts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">还没有发布心得</p>
          ) : (
            <div className="space-y-3">
              {myPosts.map((p) => (
                <Card key={p.id} className="border-border">
                  <CardContent className="py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>《{(p.articles as unknown as { title: string }[])?.[0]?.title || '未知'}》</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{p.comments_count}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'quotes' && (
        <div>
          {myQuotes.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">还没有发布金句</p>
          ) : (
            <div className="space-y-3">
              {myQuotes.map((q) => (
                <Card key={q.id} className="border-border">
                  <CardContent className="py-3">
                    <p className="font-serif text-sm leading-relaxed" style={{ fontFamily: 'var(--font-zcool-xiaowei), serif' }}>
                      {q.quote}
                    </p>
                    {q.reflection && (
                      <p className="mt-1 text-xs text-muted-foreground italic">—— {q.reflection}</p>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      《{(q.articles as unknown as { title: string }[])?.[0]?.title || '未知'}》 · <Heart className="inline h-3 w-3" /> {q.likes_count}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">还没有收藏</p>
          ) : (
            <div className="space-y-3">
              {favorites.map((f) => {
                const article = articles.find((a) => String(a.id) === f.target_id);
                return (
                  <Card key={f.id} className="border-border">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-destructive fill-destructive" />
                        <div>
                          <p className="text-sm font-medium">
                            {f.target_type === 'article' ? '篇目' : '金句'}：{article ? `《${article.title}》` : f.target_id}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(f.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
