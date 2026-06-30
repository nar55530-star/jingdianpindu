// 渲染顶部导航栏（由各页面调用）
function renderNavbar() {
  return `
  <nav class="bg-white/80 backdrop-blur-sm border-b border-[var(--border)] sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="index.html" class="flex items-center gap-2 no-underline">
        <span class="text-2xl">📚</span>
        <span class="text-lg font-bold text-[var(--primary)]" style="font-family:'Noto Serif SC',serif;">经典品读</span>
      </a>
      <div class="hidden md:flex items-center gap-6">
        <a href="index.html" class="nav-link" data-page="index">首页</a>
        <a href="forum.html" class="nav-link" data-page="forum">心得论坛</a>
        <a href="quotes.html" class="nav-link" data-page="quotes">金句墙</a>
        <a href="profile.html" class="nav-link" data-page="profile">个人中心</a>
        <a href="admin.html" class="nav-link" data-page="admin" id="admin-link" style="display:none">管理后台</a>
      </div>
      <div class="hidden md:flex items-center gap-3">
        <span class="text-sm text-[var(--muted)]" id="user-nickname"></span>
      </div>
      <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-gray-100 border-none bg-transparent cursor-pointer">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden border-t border-[var(--border)] px-4 pb-3">
      <a href="index.html" class="block py-2 nav-link" data-page="index">首页</a>
      <a href="forum.html" class="block py-2 nav-link" data-page="forum">心得论坛</a>
      <a href="quotes.html" class="block py-2 nav-link" data-page="quotes">金句墙</a>
      <a href="profile.html" class="block py-2 nav-link" data-page="profile">个人中心</a>
      <a href="admin.html" class="block py-2 nav-link" data-page="admin" id="admin-link-mobile" style="display:none">管理后台</a>
    </div>
  </nav>`;
}

// 渲染昵称弹窗
function renderNicknameModal() {
  return `
  <div id="nickname-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" style="display:none">
    <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
      <h2 class="text-xl font-bold text-[var(--primary)] mb-2" style="font-family:'Noto Serif SC',serif;">欢迎来到经典品读</h2>
      <p class="text-sm text-[var(--muted)] mb-6">请先设置你的昵称，即可参与心得交流</p>
      <input id="nickname-input" type="text" class="input-field mb-4" placeholder="输入你的昵称" maxlength="20">
      <button id="nickname-submit" class="btn-primary w-full py-3 text-base">进入平台</button>
    </div>
  </div>`;
}
