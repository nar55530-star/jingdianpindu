'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Megaphone,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  author: string;
  description: string | null;
  sort_order: number;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  article_id: number;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  users: { nickname: string } | null;
  articles: { title: string } | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  users: { nickname: string } | null;
}

interface ReaderStat {
  user_id: string;
  nickname: string;
  count: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaderboard, setLeaderboard] = useState<ReaderStat[]>([]);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', author: '', description: '', sort_order: 0 });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

  const loadAll = useCallback(async () => {
    const [articlesRes, postsRes, announcementsRes, leaderboardRes] = await Promise.all([
      fetch('/api/articles'),
      fetch('/api/posts'),
      fetch('/api/announcements'),
      fetch('/api/reading-records'),
    ]);

    const articlesData = await articlesRes.json();
    const postsData = await postsRes.json();
    const announcementsData = await announcementsRes.json();
    const leaderboardData = await leaderboardRes.json();

    if (articlesData.articles) setArticles(articlesData.articles);
    if (postsData.posts) setPosts(postsData.posts);
    if (announcementsData.announcements) setAnnouncements(announcementsData.announcements);
    if (leaderboardData.leaderboard) setLeaderboard(leaderboardData.leaderboard);
  }, []);

  useEffect(() => {
    if (!user?.is_admin) return;
    loadAll();
  }, [user?.is_admin, loadAll]);

  const handleCreateArticle = async () => {
    if (!newArticle.title || !newArticle.author) return;
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArticle),
    });
    if (res.ok) {
      setShowArticleDialog(false);
      setNewArticle({ title: '', author: '', description: '', sort_order: 0 });
      loadAll();
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('确认删除此篇目？')) return;
    await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
    loadAll();
  };

  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    await fetch('/api/posts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId, is_pinned: !isPinned }),
    });
    loadAll();
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('确认删除此帖子？')) return;
    await fetch(`/api/posts?id=${postId}`, { method: 'DELETE' });
    loadAll();
  };

  const handleCreateAnnouncement = async () => {
    if (!user || !newAnnouncement.title || !newAnnouncement.content) return;
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, ...newAnnouncement }),
    });
    if (res.ok) {
      setShowAnnouncementDialog(false);
      setNewAnnouncement({ title: '', content: '' });
      loadAll();
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('确认删除此公告？')) return;
    await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
    loadAll();
  };

  if (!user?.is_admin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-md border-border p-8 text-center">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h2 className="mt-4 font-serif text-lg font-medium">需要管理员权限</h2>
          <p className="mt-2 text-sm text-muted-foreground">您不是管理员，无法访问此页面</p>
          <Link href="/">
            <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              返回首页
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/')} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="font-serif text-2xl font-bold">管理后台</h1>
        </div>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">
            <BookOpen className="mr-1 h-4 w-4" />
            篇目管理
          </TabsTrigger>
          <TabsTrigger value="posts">
            <MessageSquare className="mr-1 h-4 w-4" />
            帖子管理
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="mr-1 h-4 w-4" />
            公告管理
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Users className="mr-1 h-4 w-4" />
            数据统计
          </TabsTrigger>
        </TabsList>

        {/* 篇目管理 */}
        <TabsContent value="articles" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowArticleDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              添加篇目
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>序号</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>简介</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>{article.sort_order}</TableCell>
                    <TableCell className="font-medium">《{article.title}》</TableCell>
                    <TableCell>{article.author}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {article.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 帖子管理 */}
        <TabsContent value="posts" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>作者</TableHead>
                  <TableHead>篇目</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>点赞</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>{(post.users as { nickname: string } | null)?.nickname}</TableCell>
                    <TableCell>《{(post.articles as { title: string } | null)?.title}》</TableCell>
                    <TableCell className="max-w-[200px] truncate">{post.content}</TableCell>
                    <TableCell>{post.likes_count}</TableCell>
                    <TableCell>
                      {post.is_pinned && <Badge className="bg-amber-100 text-amber-700 text-xs">置顶</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePin(post.id, post.is_pinned)}
                      >
                        {post.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 公告管理 */}
        <TabsContent value="announcements" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowAnnouncementDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              发布公告
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>发布人</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{a.content}</TableCell>
                    <TableCell>{(a.users as { nickname: string } | null)?.nickname}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(a.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 数据统计 */}
        <TabsContent value="stats" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-3xl font-bold">{articles.length}</p>
                <p className="text-sm text-muted-foreground">篇目总数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-accent" />
                <p className="mt-2 text-3xl font-bold">{posts.length}</p>
                <p className="text-sm text-muted-foreground">心得总数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="mx-auto h-8 w-8 text-destructive" />
                <p className="mt-2 text-3xl font-bold">{leaderboard.length}</p>
                <p className="text-sm text-muted-foreground">活跃读者</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="font-serif text-lg">阅读排行榜</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>昵称</TableHead>
                    <TableHead>已读篇数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((item, idx) => (
                    <TableRow key={item.user_id}>
                      <TableCell>
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
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
                      </TableCell>
                      <TableCell>{item.nickname}</TableCell>
                      <TableCell>{item.count} 篇</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加篇目对话框 */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">添加篇目</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
            <Textarea
              placeholder="简介"
              value={newArticle.description}
              onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
              rows={3}
            />
            <Input
              type="number"
              placeholder="排序号"
              value={newArticle.sort_order}
              onChange={(e) => setNewArticle({ ...newArticle, sort_order: Number(e.target.value) })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArticleDialog(false)}>取消</Button>
            <Button
              onClick={handleCreateArticle}
              disabled={!newArticle.title || !newArticle.author}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 发布公告对话框 */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">发布公告</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="公告标题"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            />
            <Textarea
              placeholder="公告内容"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>取消</Button>
            <Button
              onClick={handleCreateAnnouncement}
              disabled={!newAnnouncement.title || !newAnnouncement.content}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
