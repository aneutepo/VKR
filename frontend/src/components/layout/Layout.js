import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../api';

const navItems = {
  admin: [
    { to: '/admin', label: '📊 Дашборд', end: true },
    { to: '/admin/users', label: '👥 Пользователи', end: true },
    { to: '/admin/users?role=teacher', label: 'Преподаватели', sub: true },
    { to: '/admin/users?role=student', label: 'Студенты', sub: true },
    { to: '/admin/courses', label: '📚 Курсы' },
    { to: '/admin/settings', label: '⚙️ Настройки алгоритма' },
  ],
  teacher: [
    { to: '/teacher', label: '📊 Дашборд', end: true },
    { to: '/teacher/students', label: '👥 Студенты' },
    { to: '/teacher/courses', label: '📚 Курсы' },
    { to: '/teacher/analytics', label: '🧠 Аналитика' },
  ],
  student: [
    { to: '/student', label: '🏠 Главная', end: true },
    { to: '/student/courses', label: '📚 Мои курсы' },
    { to: '/student/stats', label: '📊 Моя статистика' },
    { to: '/student/profile', label: '👤 Профиль' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);

  useEffect(() => {
    const fetchCount = () =>
      notificationsAPI.unreadCount().then(({ data }) => setUnread(data.count)).catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    if (!notifOpen) {
      notificationsAPI.list().then(({ data }) => {
        setNotifications(data.results || data);
        setNotifOpen(true);
      });
    } else {
      setNotifOpen(false);
    }
  };

  const handleMarkAll = () => {
    notificationsAPI.markAllRead().then(() => {
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    });
  };

  const handleMarkOne = (id) => {
    notificationsAPI.markRead(id).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items = navItems[user?.role] || [];
  const location = useLocation();

  function isItemActive(item) {
    const [path, qs] = item.to.split('?');
    if (location.pathname !== path) return false;
    if (qs) {
      const itemParams = new URLSearchParams(qs);
      const curParams = new URLSearchParams(location.search);
      for (const [k, v] of itemParams) {
        if (curParams.get(k) !== v) return false;
      }
      return true;
    }
    // end: true — активен только при точном совпадении пути БЕЗ query params
    if (item.end) return !location.search;
    return true;
  }

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarScroll}>
          <div style={styles.logo}>🎓 EduPlatform</div>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
            <div>
              <div style={styles.userName}>{user?.first_name} {user?.last_name}</div>
              <div style={styles.userRole}>{roleLabel(user?.role)}</div>
            </div>
          </div>
          <nav style={styles.nav}>
            {items.map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  ...styles.navLink,
                  ...(item.sub ? styles.navLinkSub : {}),
                  ...(isItemActive(item) ? (item.sub ? styles.navLinkSubActive : styles.navLinkActive) : {}),
                }}
              >
                {item.sub ? `· ${item.label}` : item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            🚪 Выйти
          </button>
        </div>
      </aside>
      <main style={styles.main}>
        <div style={styles.topBar}>
          <div style={{ flex: 1 }} />
          <div style={styles.bellWrap} ref={bellRef}>
            <button style={styles.bellBtn} onClick={handleBellClick} title="Уведомления">
              🔔
              {unread > 0 && <span style={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
            </button>
            {notifOpen && (
              <div style={styles.notifPanel}>
                <div style={styles.notifHeader}>
                  <span style={styles.notifTitle}>Уведомления</span>
                  {unread > 0 && (
                    <button style={styles.markAllBtn} onClick={handleMarkAll}>
                      Прочитать все
                    </button>
                  )}
                </div>
                <div style={styles.notifList}>
                  {notifications.length === 0 && (
                    <div style={styles.notifEmpty}>Уведомлений нет</div>
                  )}
                  {notifications.map(n => (
                    <div key={n.id} style={{ ...styles.notifItem, background: n.is_read ? '#fff' : '#f0f4ff' }}
                      onClick={() => !n.is_read && handleMarkOne(n.id)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{notifIcon(n.notif_type)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={styles.notifItemTitle}>{n.title}</div>
                          <div style={styles.notifItemMsg}>{n.message}</div>
                          <div style={styles.notifItemDate}>
                            {new Date(n.created_at).toLocaleString('ru', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                          </div>
                        </div>
                        {!n.is_read && <div style={styles.dot} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: 32 }}>{children}</div>
      </main>
    </div>
  );
}

function notifIcon(type) {
  return { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '🚨' }[type] || 'ℹ️';
}

function roleLabel(role) {
  return { admin: 'Администратор', teacher: 'Преподаватель', student: 'Студент' }[role] || '';
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  sidebar: {
    width: 240, background: '#1e293b', color: '#fff',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100vh',
  },
  sidebarScroll: {
    flex: 1, overflowY: 'auto', padding: '24px 16px 8px',
  },
  sidebarFooter: {
    padding: '8px 16px 16px', borderTop: '1px solid #334155',
  },
  logo: { fontSize: 20, fontWeight: 700, padding: '0 8px 24px', borderBottom: '1px solid #334155' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 8px', borderBottom: '1px solid #334155' },
  avatar: {
    width: 40, height: 40, background: '#6366f1', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, flexShrink: 0
  },
  userName: { fontSize: 13, fontWeight: 600, color: '#f1f5f9' },
  userRole: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  nav: { flex: 1, paddingTop: 16 },
  navLink: {
    display: 'block', padding: '10px 12px', borderRadius: 8,
    color: '#94a3b8', textDecoration: 'none', fontSize: 14,
    marginBottom: 4, transition: 'all 0.15s'
  },
  navLinkActive: { background: '#6366f1', color: '#fff' },
  navLinkSub: {
    paddingLeft: 28, fontSize: 13, marginBottom: 2, color: '#64748b',
  },
  navLinkSubActive: { color: '#c7d2fe', fontWeight: 600 },
  logoutBtn: {
    background: 'transparent', border: '1px solid #334155', color: '#94a3b8',
    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
    fontSize: 14, textAlign: 'left', width: '100%', marginTop: 8
  },
  main: { marginLeft: 240, flex: 1, background: '#f8fafc', minHeight: '100vh' },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    padding: '12px 32px', background: '#fff', borderBottom: '1px solid #f1f5f9',
    position: 'sticky', top: 0, zIndex: 100,
  },
  bellWrap: { position: 'relative' },
  bellBtn: {
    position: 'relative', background: 'none', border: 'none', fontSize: 22,
    cursor: 'pointer', padding: '4px 8px', borderRadius: 8,
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
    borderRadius: 10, padding: '1px 5px', lineHeight: 1.4,
  },
  notifPanel: {
    position: 'absolute', right: 0, top: '110%', width: 380,
    background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    border: '1px solid #e2e8f0', zIndex: 200, overflow: 'hidden',
  },
  notifHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
  },
  notifTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b' },
  markAllBtn: {
    background: 'none', border: 'none', color: '#6366f1', fontSize: 12,
    fontWeight: 600, cursor: 'pointer', padding: 0,
  },
  notifList: { maxHeight: 400, overflowY: 'auto' },
  notifEmpty: { padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 },
  notifItem: {
    padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer', transition: 'background 0.1s',
  },
  notifItemTitle: { fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 3 },
  notifItemMsg: { fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 4 },
  notifItemDate: { fontSize: 11, color: '#94a3b8' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 },
};
