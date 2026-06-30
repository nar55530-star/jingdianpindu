import type { Metadata } from 'next';
import { Noto_Serif_SC, ZCOOL_XiaoWei } from 'next/font/google';
import { Inspector } from 'react-dev-inspector';
import { UserProvider } from '@/lib/user-context';
import { Navbar } from '@/components/navbar';
import { NicknameDialog } from '@/components/nickname-dialog';
import './globals.css';

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
});

const zcoolXiaoWei = ZCOOL_XiaoWei({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-zcool-xiaowei',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '经典品读学习交流平台',
    template: '%s | 经典品读',
  },
  description:
    '经典品读学习交流平台——面向学生群体的经典文献阅读与心得交流网站，集阅读、思考、交流、展示于一体。',
  keywords: [
    '经典品读',
    '经典阅读',
    '学习交流',
    '阅读打卡',
    '心得论坛',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`${notoSerifSC.variable} ${zcoolXiaoWei.variable} antialiased`}>
        <UserProvider>
          <NicknameDialog />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border bg-secondary/30 py-6 text-center text-sm text-muted-foreground">
              <p className="font-serif">经典品读学习交流平台 — 读经典 · 悟思想 · 共成长</p>
            </footer>
          </div>
        </UserProvider>
        {isDev && <Inspector />}
      </body>
    </html>
  );
}
