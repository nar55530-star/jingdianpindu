// ===== Supabase 客户端 =====
const SUPABASE_URL = 'https://br-sure-kite-582892a2.supabase2.aidap-global.cn-beijing.volces.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNjMyNTU1MjEsInJvbGUiOiJhbm9uIn0.-m16Gj3D8GZZvdMZlTsOG19lAyDpQ2hAuk_nAELdO3I';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNjMyNTU1MjEsInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ.uiL2iKI3Mpv9QstlvTfihrVKBuomBvCQQ49T0jSbT8Q';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ===== 用户管理 =====
function getUserId() {
  return localStorage.getItem('cp_user_id') || '';
}
function getUserNickname() {
  return localStorage.getItem('cp_user_nickname') || '';
}
function getUserIsAdmin() {
  return localStorage.getItem('cp_user_is_admin') === 'true';
}
function setUserInfo(id, nickname, isAdmin) {
  localStorage.setItem('cp_user_id', id);
  localStorage.setItem('cp_user_nickname', nickname);
  localStorage.setItem('cp_user_is_admin', isAdmin ? 'true' : 'false');
}

async function ensureUser() {
  let userId = getUserId();
  if (userId) {
    // 验证用户是否还存在
    const { data } = await db.from('users').select('*').eq('id', userId).single();
    if (data) {
      updateNavbar(data);
      return data;
    }
  }
  showNicknameModal();
  return null;
}

function showNicknameModal() {
  const modal = document.getElementById('nickname-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function hideNicknameModal() {
  const modal = document.getElementById('nickname-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function submitNickname(nickname) {
  if (!nickname.trim()) return;
  const { data, error } = await db.from('users').insert({ nickname: nickname.trim() }).select().single();
  if (error) { showToast('昵称设置失败：' + error.message, 'error'); return; }
  setUserInfo(data.id, data.nickname, data.is_admin);
  hideNicknameModal();
  updateNavbar(data);
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

function getBadgeInfo(count) {
  if (count >= 6) return { name: '经典品读达人', icon: '🏆' };
  if (count >= 4) return { name: '思考者', icon: '🤔' };
  if (count >= 2) return { name: '初读者', icon: '📖' };
  if (count >= 1) return { name: '启程者', icon: '🌟' };
  return null;
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
  // 移动端菜单
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  }

  // 昵称弹窗
  const submitBtn = document.getElementById('nickname-submit');
  const nickInput = document.getElementById('nickname-input');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => submitNickname(nickInput.value));
  }
  if (nickInput) {
    nickInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitNickname(nickInput.value); });
  }

  // 高亮当前页
  const currentPage = location.pathname.split('/').pop().replace('.html', '') || 'index';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.page === currentPage) link.classList.add('active');
  });

  // 确保用户
  const user = await ensureUser();
  if (user && typeof onPageReady === 'function') onPageReady(user);
  else if (!user) {
    // 等用户设置昵称后再初始化
  }
});
