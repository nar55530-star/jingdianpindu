'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, Quote, Send, BookOpen } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  author: string;
}

interface GoldenQuote {
  id: string;
  user_id: string;
  article_id: number;
  quote: string;
  reflection: string | null;
  likes_count: number;
  created_at: string;
  users: { nickname: string } | null;
  articles: { title: string; author: string } | null;
}

export default function QuotesPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const preselectedArticleId = searchParams.get('article_id');

  const [articles, setArticles] = useState<Article[]>([]);
  const [quotes, setQuotes] = useState<GoldenQuote[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>(preselectedArticleId || 'all');
  const [showForm, setShowForm] = useState(false);
  const [newQuote, setNewQuote] = useState('');
  const [newReflection, setNewReflection] = useState('');
  const [newQuoteArticleId, setNewQuoteArticleId] = useState<string>(preselectedArticleId || '');
  const [likedQuotes, setLikedQuotes] = useState<Set<string>>(new Set());

  const loadQuotes = useCallback(async (articleId: string) => {
    const url = articleId === 'all'
      ? '/api/golden-quotes'
      : `/api/golden-quotes?article_id=${articleId}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.quotes) setQuotes(data.quotes);
  }, []);

  useEffect(() => {
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => {
        if (data.articles) setArticles(data.articles);
      });
    loadQuotes(selectedArticleId);
  }, [selectedArticleId, loadQuotes]);

  // 检查已点赞
  useEffect(() => {
    if (!user?.id) return;
    quotes.forEach(async (q) => {
      const res = await fetch(`/api/quote-likes?quote_id=${q.id}&user_id=${user.id}`);
      const data = await res.json();
      if (data.liked) {
        setLikedQuotes((prev) => new Set(prev).add(q.id));
      }
    });
  }, [quotes, user?.id]);

  const handleSubmit = async () => {
    if (!user || !newQuote.trim() || !newQuoteArticleId) return;
    const res = await fetch('/api/golden-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        article_id: Number(newQuoteArticleId),
        quote: newQuote.trim(),
        reflection: newReflection.trim() || null,
      }),
    });
    const data = await res.json();
    if (data.quote) {
      setQuotes([data.quote, ...quotes]);
      setNewQuote('');
      setNewReflection('');
      setShowForm(false);
    }
  };

  const handleLikeQuote = async (quoteId: string) => {
    if (!user) return;
    const res = await fetch('/api/quote-likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote_id: quoteId, user_id: user.id }),
    });
    const data = await res.json();
    setLikedQuotes((prev) => {
      const next = new Set(prev);
      if (data.liked) next.add(quoteId);
      else next.delete(quoteId);
      return next;
    });
    setQuotes(quotes.map((q) =>
      q.id === quoteId
        ? { ...q, likes_count: data.liked ? q.likes_count + 1 : Math.max(0, q.likes_count - 1) }
        : q
    ));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-foreground">金句墙</h1>
        {user && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            <Quote className="mr-2 h-4 w-4" />
            摘录金句
          </Button>
        )}
      </div>

      {/* 筛选 */}
      <div className="mt-4 flex items-center gap-3">
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

      {/* 发布金句表单 */}
      {showForm && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <Select value={newQuoteArticleId} onValueChange={setNewQuoteArticleId}>
              <SelectTrigger>
                <SelectValue placeholder="选择来源篇目" />
              </SelectTrigger>
              <SelectContent>
                {articles.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    《{a.title}》
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="摘录经典语句..."
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              rows={2}
              className="mt-3"
            />
            <Input
              placeholder="写下你的感悟（选填）"
              value={newReflection}
              onChange={(e) => setNewReflection(e.target.value)}
              className="mt-3"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} size="sm">
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!newQuote.trim() || !newQuoteArticleId}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="mr-2 h-4 w-4" />
                发布
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 金句列表 */}
      {quotes.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
          <Quote className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">暂无金句，来摘录第一条吧</p>
        </div>
      ) : (
        <div className="mt-6 columns-1 gap-4 sm:columns-2">
          {quotes.map((q) => (
            <Card key={q.id} className="mb-4 border-border break-inside-avoid">
              <CardContent className="pt-4">
                <div className="font-quote text-lg text-primary leading-relaxed">
                  &ldquo;{q.quote}&rdquo;
                </div>
                {q.reflection && (
                  <p className="mt-2 text-sm text-muted-foreground italic">
                    —— {q.reflection}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    《{(q.articles as { title: string } | null)?.title}》 · {(q.users as { nickname: string } | null)?.nickname}
                  </div>
                  <button
                    onClick={() => handleLikeQuote(q.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      likedQuotes.has(q.id) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${likedQuotes.has(q.id) ? 'fill-current' : ''}`} />
                    {q.likes_count}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
