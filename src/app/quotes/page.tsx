'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Quote,
  Send,
  BookOpen,
} from 'lucide-react';

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
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">加载中...</div>}>
      <QuotesContent />
    </Suspense>
  );
}

function QuotesContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const preselectedArticleId = searchParams.get('article_id');

  const [articles, setArticles] = useState<Article[]>([]);
  const [quotes, setQuotes] = useState<GoldenQuote[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>(preselectedArticleId || 'all');
  const [newQuote, setNewQuote] = useState('');
  const [newReflection, setNewReflection] = useState('');
  const [newQuoteArticleId, setNewQuoteArticleId] = useState<string>(preselectedArticleId || '');
  const [likedQuotes, setLikedQuotes] = useState<Set<string>>(new Set());

  const loadArticles = useCallback(async () => {
    const { data } = await supabase
      .from('articles')
      .select('id, title, author')
      .order('sort_order');
    if (data) setArticles(data as unknown as Article[]);
  }, []);

  const loadQuotes = useCallback(async (articleId: string) => {
    let query = supabase
      .from('golden_quotes')
      .select('id, user_id, article_id, quote, reflection, likes_count, created_at, users(nickname), articles(title, author)')
      .order('created_at', { ascending: false });
    if (articleId !== 'all') {
      query = query.eq('article_id', Number(articleId));
    }
    const { data } = await query;
    if (data) setQuotes(data as unknown as GoldenQuote[]);
  }, []);

  const loadLikedQuotes = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('quote_likes')
      .select('quote_id')
      .eq('user_id', user.id);
    if (data) setLikedQuotes(new Set(data.map((l: { quote_id: string }) => l.quote_id)));
  }, [user?.id]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    loadQuotes(selectedArticleId);
  }, [selectedArticleId, loadQuotes]);

  useEffect(() => {
    loadLikedQuotes();
  }, [loadLikedQuotes]);

  const handleSubmit = async () => {
    if (!user || !newQuote.trim() || !newQuoteArticleId) return;
    const { data } = await supabase
      .from('golden_quotes')
      .insert({
        user_id: user.id,
        article_id: Number(newQuoteArticleId),
        quote: newQuote.trim(),
        reflection: newReflection.trim() || null,
      })
      .select('id, user_id, article_id, quote, reflection, likes_count, created_at, users(nickname), articles(title, author)')
      .single();
    if (data) {
      setQuotes([data as unknown as GoldenQuote, ...quotes]);
      setNewQuote('');
      setNewReflection('');
    }
  };

  const handleLikeQuote = async (quoteId: string) => {
    if (!user) return;
    if (likedQuotes.has(quoteId)) {
      await supabase.from('quote_likes').delete().eq('quote_id', quoteId).eq('user_id', user.id);
      setLikedQuotes((prev) => { const n = new Set(prev); n.delete(quoteId); return n; });
      setQuotes(quotes.map((q) => q.id === quoteId ? { ...q, likes_count: Math.max(0, q.likes_count - 1) } : q));
    } else {
      await supabase.from('quote_likes').insert({ quote_id: quoteId, user_id: user.id });
      setLikedQuotes((prev) => { const n = new Set(prev); n.add(quoteId); return n; });
      setQuotes(quotes.map((q) => q.id === quoteId ? { ...q, likes_count: q.likes_count + 1 } : q));
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">金句墙</h1>

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
            </div>
            <Textarea
              placeholder="摘录经典金句..."
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              rows={2}
            />
            <Textarea
              placeholder="写一句你的感悟（选填）..."
              value={newReflection}
              onChange={(e) => setNewReflection(e.target.value)}
              rows={2}
              className="mt-2"
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!newQuote.trim() || !newQuoteArticleId}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="mr-2 h-4 w-4" />
                发布金句
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {quotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">暂无金句，来摘录第一条吧</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2">
          {quotes.map((q) => (
            <Card key={q.id} className="mb-4 border-border break-inside-avoid">
              <CardContent className="pt-4">
                <Quote className="mb-2 h-5 w-5 text-primary/40" />
                <p className="font-serif text-base leading-relaxed text-foreground" style={{ fontFamily: 'var(--font-zcool-xiaowei), serif' }}>
                  {q.quote}
                </p>
                {q.reflection && (
                  <p className="mt-2 text-sm text-muted-foreground italic">
                    —— {q.reflection}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{(q.users as unknown as { nickname: string })?.nickname || '未知'}</span>
                    <span>·</span>
                    <span>《{(q.articles as unknown as { title: string; author: string })?.title || '未知'}》</span>
                  </div>
                  <button
                    onClick={() => handleLikeQuote(q.id)}
                    className={`flex items-center gap-1 transition-colors ${
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
