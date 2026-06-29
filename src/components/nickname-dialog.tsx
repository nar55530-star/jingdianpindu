'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useUser } from '@/lib/user-context';
import { BookOpen } from 'lucide-react';

export function NicknameDialog() {
  const { user, setUser } = useUser();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(!user && !localStorage.getItem('classic_reading_user_id'));

  const handleSubmit = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('classic_reading_user_id', data.user.id);
        setOpen(false);
      }
    } catch {
      // 错误处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center font-serif text-xl">欢迎来到经典品读</DialogTitle>
          <DialogDescription className="text-center">
            请输入你的昵称，开始经典阅读之旅
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="请输入昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            maxLength={20}
            className="text-center text-lg"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            昵称将用于论坛发帖、评论和打卡展示
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!nickname.trim() || loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? '设置中...' : '开始阅读'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
