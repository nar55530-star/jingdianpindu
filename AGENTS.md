# AGENTS.md

## 项目概览

经典品读学习交流平台 —— 面向学生群体的经典文献阅读与心得交流网站。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Storage**: S3 兼容对象存储 (coze-coding-dev-sdk)

## 目录结构

```
├── public/                 # 静态资源
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── page.tsx        # 首页（经典篇目展示）
│   │   ├── layout.tsx      # 根布局（导航栏、用户上下文）
│   │   ├── globals.css     # 全局样式与 Design Tokens
│   │   ├── article/[id]/   # 篇目详情页
│   │   ├── forum/          # 心得论坛页
│   │   ├── quotes/         # 金句墙页
│   │   ├── profile/        # 个人中心页
│   │   ├── admin/          # 管理后台页
│   │   └── api/            # API 路由
│   │       ├── users/      # 用户 CRUD
│   │       ├── articles/   # 篇目 CRUD
│   │       ├── reading-records/ # 阅读打卡
│   │       ├── posts/      # 心得帖子 CRUD
│   │       ├── comments/   # 评论 CRUD
│   │       ├── post-likes/ # 帖子点赞
│   │       ├── golden-quotes/ # 金句 CRUD
│   │       ├── quote-likes/ # 金句点赞
│   │       ├── favorites/  # 收藏 CRUD
│   │       ├── announcements/ # 公告 CRUD
│   │       ├── upload/     # 文件上传
│   │       └── seed/       # 种子数据初始化
│   ├── components/         # 组件
│   │   ├── ui/             # shadcn/ui 组件库
│   │   ├── navbar.tsx      # 顶部导航栏
│   │   └── nickname-dialog.tsx # 昵称设置弹窗
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/
│   │   ├── utils.ts        # 通用工具函数 (cn)
│   │   └── user-context.tsx # 用户上下文（localStorage 持久化）
│   └── storage/
│       └── database/
│           ├── supabase-client.ts # Supabase 客户端
│           └── shared/
│               └── schema.ts  # Drizzle 数据库 Schema
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 数据库设计

11 张表：users, articles, reading_records, posts, comments, post_likes, golden_quotes, quote_likes, favorites, announcements, health_check

所有表均启用 RLS，使用 `public readable + public writable` 策略（无 Auth 系统）。Supabase 客户端默认使用 service_role_key 绕过 RLS。

## 构建与测试命令

- 安装依赖：`pnpm install`
- 开发：`pnpm run dev`
- 构建：`pnpm run build`
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint`
- 启动生产：`pnpm run start`

## 编码规范

- TypeScript strict 模式
- 禁止隐式 any
- 函数内部定义的异步函数在 useEffect 中使用时，必须用 useCallback 包裹，防止 before-declaration 错误
- 用户身份通过 localStorage + Supabase 查询实现，无 Auth 系统
- 管理员通过 users.is_admin 字段标识

## UI 规范

- 采用 shadcn/ui 组件和风格
- 字体：Noto Serif SC (标题/正文), ZCOOL XiaoWei (金句引用)
- 色彩：书院暖色系，主色 #8B2500，背景 #FAF6F1
- 详见 DESIGN.md
