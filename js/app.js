// ===== Supabase 初始化 =====
const SUPABASE_URL = 'https://br-sure-kite-582892a2.supabase2.aidap-global.cn-beijing.volces.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNjMyNTU1MjEsInJvbGUiOiJhbm9uIn0.-m16Gj3D8GZZvdMZlTsOG19lAyDpQ2hAuk_nAELdO3I';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 使用 service_role_key 的客户端（用于管理操作）
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNjMyNTU1MjEsInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ.uiL2iKI3Mpv9QstlvTfihrVKBuomBvCQQ49T0jSbT8Q';
const dbAdmin = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ===== 用户状态管理 =====
let currentUser = null;

function setUserInfo(id, nickname, isAdmin) {
  currentUser = { id, nickname, is_admin: isAdmin || false };
  localStorage.setItem('userId', id);
  localStorage.setItem('userNickname', nickname);
  if (isAdmin) localStorage.setItem('isAdmin', '1');
}

function clearUserInfo() {
  currentUser = null;
  localStorage.removeItem('userId');
  localStorage.removeItem('userNickname');
  localStorage.removeItem('isAdmin');
}

// initApp: 先渲染DOM（导航栏+弹窗），再检查用户
async function initApp() {
  // 渲染导航栏和弹窗到DOM（必须在ensureUser之前）
  const navbarEl = document.getElementById('navbar');
  if (navbarEl) navbarEl.innerHTML = renderNavbar();
  const modalEl = document.getElementById('nickname-modal-container');
  if (modalEl) modalEl.innerHTML = renderNicknameModal();

  // 绑定昵称弹窗事件
  bindNicknameModalEvents();

  // 检查用户
  await ensureUser();
}

async function ensureUser() {
  const userId = localStorage.getItem('userId');
  if (userId) {
    const { data } = await db.from('users').select('*').eq('id', userId).single();
    if (data) {
      currentUser = data;
      updateNavbar(data);
      return data;
    }
  }
  showNicknameModal();
  return null;
}

function showNicknameModal() {
  const modal = document.getElementById('nickname-modal');
  if (modal) modal.style.display = 'flex';
}

function hideNicknameModal() {
  const modal = document.getElementById('nickname-modal');
  if (modal) modal.style.display = 'none';
}

function bindNicknameModalEvents() {
  setTimeout(() => {
    const input = document.getElementById('nickname-input');
    const btn = document.getElementById('nickname-submit');
    if (input && btn) {
      btn.addEventListener('click', () => {
        submitNickname(input.value);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitNickname(input.value);
      });
    }
  }, 100);
}

async function submitNickname(nickname) {
  if (!nickname || !nickname.trim()) { showToast('请输入昵称', 'error'); return; }
  const { data, error } = await db.from('users').insert({ nickname: nickname.trim() }).select().single();
  if (error) { showToast('昵称设置失败：' + error.message, 'error'); return; }
  setUserInfo(data.id, data.nickname, data.is_admin);
  hideNicknameModal();
  updateNavbar(data);
  // 通知页面用户已就绪
  if (typeof onPageUserReady === 'function') onPageUserReady(data);
  return data;
}

function updateNavbar(user) {
  const nickEl = document.getElementById('user-nickname');
  if (nickEl) nickEl.textContent = user.nickname;
  const adminLink = document.getElementById('admin-link');
  const adminLinkMobile = document.getElementById('admin-link-mobile');
  if (adminLink && user.is_admin) adminLink.style.display = '';
  if (adminLinkMobile && user.is_admin) adminLinkMobile.style.display = '';
}

// ===== Toast 通知 =====
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ===== 通用工具 =====
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function getCoverClass(id) {
  return 'cover-' + ((id % 6) + 1);
}

function getArticleGradient(id) {
  const gradients = [
    'linear-gradient(135deg, #8B0000, #B22222)',
    'linear-gradient(135deg, #8B4513, #A0522D)',
    'linear-gradient(135deg, #2F4F4F, #4A7C7C)',
    'linear-gradient(135deg, #1a1a2e, #16213e)',
    'linear-gradient(135deg, #4A3728, #6B5744)',
    'linear-gradient(135deg, #2C3E50, #34495E)',
  ];
  return gradients[(id - 1) % gradients.length];
}

// ===== 阅读徽章 =====
const BADGES = [
  { name: '初读者', min: 1, icon: '📖' },
  { name: '思考者', min: 2, icon: '🤔' },
  { name: '经典品读达人', min: 4, icon: '🏆' },
  { name: '博学之士', min: 6, icon: '🎓' },
];

function renderBadges(readCount) {
  const container = document.getElementById('badges-container');
  if (!container) return;
  container.innerHTML = BADGES.map(b => {
    const earned = readCount >= b.min;
    return `<span class="badge ${earned ? 'badge-earned' : 'badge-locked'}">${b.icon} ${b.name}</span>`;
  }).join('');
}

// ===== 导航高亮 =====
function highlightNav(pageName) {
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.page === pageName) {
      link.classList.add('nav-active');
    }
  });
  // 移动端菜单
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
  }
}
