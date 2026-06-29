'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  BookOpen,
  MessageSquare,
  Quote,
  Star,
  Award,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  author: string;
}

interface ReadingRecord {
  article_id: number;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  article_id: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  articles: { title: string } | null;
}

interface GoldenQuote {
  id: string;
  quote: string;
  reflection: string | null;
  article_id: number;
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

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [readRecords, setReadRecords] = useState<ReadingRecord[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myQuotes, setMyQuotes] = useState<GoldenQuote[]>([]);
  const [myFavorites, setMyFavorites] = useState<Favorite[]>([]);
  const [editNickname, setEditNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => {
        if (data.articles) setArticles(data.articles);
      });

    fetch(`/api/reading-records?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.records) setReadRecords(data.records);
      });

    fetch(`/api/posts?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) setMyPosts(data.posts);
      });

    fetch(`/api/golden-quotes?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.quotes) setMyQuotes(data.quotes);
      });

    fetch(`/api/favorites?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.favorites) setMyFavorites(data.favorites);
      });
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-md border-border p-8 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h2 className="mt-4 font-serif text-lg font-medium">请先设置昵称</h2>
          <p className="mt-2 text-sm text-muted-foreground">设置昵称后即可查看个人中心</p>
          <Link href="/">
            <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              返回首页
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const readArticleIds = new Set(readRecords.map((r) => r.article_id));
  const readCount = readArticleIds.size;
  const totalCount = articles.length;
  const progressPercent = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  const badges: { name: string; icon: string; earned: boolean; desc: string }[] = [
    { name: '初读者', icon: '📖', earned: readCount >= 1, desc: '阅读1篇经典' },
    { name: '思考者', icon: '🤔', earned: readCount >= 3, desc: '阅读3篇经典' },
    { name: '深思者', icon: '💡', earned: readCount >= 5, desc: '阅读5篇经典' },
    { name: '经典品读达人', icon: '🏆', earned: readCount >= totalCount && totalCount > 0, desc: '阅读全部经典' },
  ];

  const favoriteArticles = myFavorites.filter((f) => f.target_type === 'article');
  const favoriteQuotes = myFavorites.filter((f) => f.target_type === 'quote');

  const handleUpdateNickname = async () => {
    if (!editNickname.trim()) return;
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, nickname: editNickname.trim() }),
    });
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
      setIsEditingNickname(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 用户信息 */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-serif font-bold">
              {user.nickname.charAt(0)}
            </div>
            <div className="flex-1">
              {isEditingNickname ? (
                <div className="flex gap-2">
                  <Input
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="输入新昵称"
                    maxLength={20}
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateNickname}
                    disabled={!editNickname.trim()}
                    className="bg-primary text-primary-foreground"
                  >
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingNickname(false)}
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl font-bold">{user.nickname}</h2>
                  <button
                    onClick={() => {
                      setEditNickname(user.nickname);
                      setIsEditingNickname(true);
                    }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                加入时间：{new Date(user.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>

          {/* 阅读进度 */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="font-serif font-medium">阅读进度</span>
              <span className="text-sm text-muted-foreground">{readCount} / {totalCount} 篇</span>
            </div>
            <Progress value={progressPercent} className="mt-2 h-3" />
          </div>

          {/* 徽章 */}
          <div className="mt-4">
            <h3 className="font-serif font-medium mb-2">我的徽章</h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge
                  key={badge.name}
                  variant={badge.earned ? 'default' : 'outline'}
                  className={badge.earned ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
                  title={badge.desc}
                >
                  {badge.icon} {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细标签页 */}
      <Tabs defaultValue="reading" className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reading">
            <BookOpen className="mr-1 h-4 w-4" />
            我的阅读
          </TabsTrigger>
          <TabsTrigger value="posts">
            <MessageSquare className="mr-1 h-4 w-4" />
            我的心得
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <Quote className="mr-1 h-4 w-4" />
            我的金句
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="mr-1 h-4 w-4" />
            我的收藏
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="mt-4">
          {articles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无篇目</p>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => {
                const isRead = readArticleIds.has(article.id);
                const record = readRecords.find((r) => r.article_id === article.id);
                return (
                  <Card key={article.id} className="border-border">
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        {isRead ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <Link href={`/article/${article.id}`} className="text-sm font-medium hover:text-primary">
                            《{article.title}》
                          </Link>
                          <p className="text-xs text-muted-foreground">{article.author}</p>
                        </div>
                      </div>
                      {isRead && record && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          {myPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无心得</p>
          ) : (
            <div className="space-y-3">
              {myPosts.map((post) => (
                <Card key={post.id} className="border-border">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>《{(post.articles as { title: string } | null)?.title}》</span>
                      <span>·</span>
                      <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <p className="mt-1 text-sm line-clamp-3">{post.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>❤ {post.likes_count}</span>
                      <span>💬 {post.comments_count}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes" className="mt-4">
          {myQuotes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无金句</p>
          ) : (
            <div className="space-y-3">
              {myQuotes.map((q) => (
                <Card key={q.id} className="border-border">
                  <CardContent className="py-3">
                    <p className="font-quote text-primary">&ldquo;{q.quote}&rdquo;</p>
                    {q.reflection && (
                      <p className="mt-1 text-sm text-muted-foreground italic">{q.reflection}</p>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      《{(q.articles as { title: string } | null)?.title}》 · ❤ {q.likes_count}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          {myFavorites.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无收藏</p>
          ) : (
            <div className="space-y-3">
              {favoriteArticles.map((fav) => {
                const article = articles.find((a) => String(a.id) === fav.target_id);
                if (!article) return null;
                return (
                  <Card key={fav.id} className="border-border">
                    <CardContent className="flex items-center gap-3 py-3">
                      <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                      <Link href={`/article/${article.id}`} className="text-sm font-medium hover:text-primary">
                        《{article.title}》- {article.author}
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
              {favoriteQuotes.map((fav) => (
                <Card key={fav.id} className="border-border">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                      <span className="text-xs text-muted-foreground">收藏的金句</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
