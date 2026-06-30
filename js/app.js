/* ========== Supabase 初始化 ========== */
const SUPABASE_URL = 'https://br-sure-kite-582892a2.supabase2.aidap-global.cn-beijing.volces.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNjMyNTU1MjEsInJvbGUiOiJhbm9uIn0.-m16Gj3D8GZZvdMZlTsOG19lAyDpQ2hAuk_nAELdO3I';

let db = null;
let dbReady = false;

function initDb() {
  if (typeof window.supabase === 'undefined') {
    console.error('[App] Supabase SDK 未加载，请检查网络连接');
    const grids = document.querySelectorAll('#articles-grid, #posts-list, #quotes-grid');
    grids.forEach(el => { el.innerHTML = '<p style="color:#e11d48;text-align:center;padding:2rem;">数据服务加载失败，请刷新页面重试</p>'; });
    return false;
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  dbReady = true;
  return true;
}

/* ========== 用户管理 ========== */
let currentUser = null;

async function ensureUser() {
  if (!dbReady) return null;
  const uid = localStorage.getItem('userId');
  if (uid) {
    const { data } = await db.from('users').select('*').eq('id', uid).maybeSingle();
    if (data) { currentUser = data; return data; }
  }
  showNicknameModal();
  return null;
}

async function createUser(nickname) {
  const { data } = await db.from('users').insert({ nickname, is_admin: false }).select().single();
  if (data) {
    localStorage.setItem('userId', data.id);
    currentUser = data;
  }
  return data;
}

/* ========== 导航栏 ========== */
function renderNavbar() {
  document.getElementById('navbar').innerHTML = `
  <nav class="bg-white/80 backdrop-blur-sm border-b border-[var(--border)] sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="index.html" class="flex items-center gap-2 no-underline">
        <span class="text-2xl">📚</span>
        <span class="text-lg font-bold text-[var(--primary)]" style="font-family:'Noto Serif SC',serif;">经典品读</span>
      </a>
      <div class="hidden md:flex items-center gap-6">
        <a href="index.html" class="nav-link">首页</a>
        <a href="forum.html" class="nav-link">心得论坛</a>
        <a href="quotes.html" class="nav-link">金句墙</a>
        <a href="profile.html" class="nav-link">个人中心</a>
        <a href="admin.html" class="nav-link" id="admin-link" style="display:none">管理后台</a>
      </div>
      <div class="hidden md:flex items-center gap-3">
        <span class="text-sm text-[var(--muted)]" id="user-nickname"></span>
      </div>
      <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-gray-100 border-none bg-transparent cursor-pointer">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden border-t border-[var(--border)] px-4 pb-3">
      <a href="index.html" class="block py-2 nav-link">首页</a>
      <a href="forum.html" class="block py-2 nav-link">心得论坛</a>
      <a href="quotes.html" class="block py-2 nav-link">金句墙</a>
      <a href="profile.html" class="block py-2 nav-link">个人中心</a>
      <a href="admin.html" class="block py-2 nav-link" id="admin-link-mobile" style="display:none">管理后台</a>
    </div>
  </nav>`;
  // 移动菜单
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.toggle('hidden');
  });
}

function updateUserUI() {
  const el = document.getElementById('user-nickname');
  if (el && currentUser) el.textContent = currentUser.nickname;
  const adminLink = document.getElementById('admin-link');
  const adminLinkM = document.getElementById('admin-link-mobile');
  if (currentUser && currentUser.is_admin) {
    if (adminLink) adminLink.style.display = '';
    if (adminLinkM) adminLinkM.style.display = '';
  }
}

function highlightNav(activePage) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const isActive = (activePage === 'index' && href === 'index.html') || href === `${activePage}.html`;
    link.classList.toggle('text-[var(--primary)]', isActive);
  });
}

/* ========== 昵称弹窗 ========== */
function showNicknameModal() {
  let modal = document.getElementById('nickname-modal');
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', `
    <div id="nickname-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 class="text-xl font-bold text-[var(--primary)] mb-2" style="font-family:'Noto Serif SC',serif;">欢迎来到经典品读</h2>
        <p class="text-sm text-[var(--muted)] mb-6">请先设置你的昵称，即可参与心得交流</p>
        <input id="nickname-input" type="text" class="input-field mb-4" placeholder="输入你的昵称" maxlength="20">
        <button id="nickname-submit" class="btn-primary w-full py-3 text-base">进入平台</button>
      </div>
    </div>`);
    modal = document.getElementById('nickname-modal');
  } else {
    modal.style.display = '';
  }
  document.getElementById('nickname-submit').onclick = async () => {
    const nickname = document.getElementById('nickname-input').value.trim();
    if (!nickname) return;
    const user = await createUser(nickname);
    if (user) {
      modal.style.display = 'none';
      updateUserUI();
      if (typeof onPageUserReady === 'function') onPageUserReady(user);
    }
  };
}

/* ========== 统一初始化 ========== */
async function initApp() {
  if (!initDb()) return; // 初始化数据库连接
  renderNavbar();
  const user = await ensureUser();
  if (user) updateUserUI();
}

/* ========== 工具函数 ========== */
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ========== 徽章系统 ========== */
const BADGES = [
  { min: 1, name: '初读者', icon: '📖' },
  { min: 2, name: '思考者', icon: '🤔' },
  { min: 4, name: '品读者', icon: '📝' },
  { min: 6, name: '经典品读达人', icon: '🏆' },
];

function getBadges(readCount) {
  return BADGES.filter(b => readCount >= b.min);
}
