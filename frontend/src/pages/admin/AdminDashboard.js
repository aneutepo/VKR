import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, coursesAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersAPI.list({ role: 'student' }).catch(() => ({ data: [] })),
      usersAPI.list({ role: 'teacher' }).catch(() => ({ data: [] })),
      coursesAPI.list().catch(() => ({ data: [] })),
      usersAPI.list().catch(() => ({ data: [] })),
    ]).then(([students, teachers, courses, all]) => {
      const s = students.data; const t = teachers.data; const c = courses.data;
      setStats({
        students: Array.isArray(s) ? s.length : s.count || 0,
        teachers: Array.isArray(t) ? t.length : t.count || 0,
        courses: Array.isArray(c) ? c.length : c.count || 0,
      });
      const allUsers = Array.isArray(all.data) ? all.data : all.data.results || [];
      setRecentUsers(allUsers.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Студентов', value: stats.students, icon: '🎓', color: '#6366f1', to: '/admin/users?role=student' },
    { label: 'Преподавателей', value: stats.teachers, icon: '👨‍🏫', color: '#22c55e', to: '/admin/users?role=teacher' },
    { label: 'Курсов', value: stats.courses, icon: '📚', color: '#f59e0b', to: '/admin/courses' },
  ];

  return (
    <div>
      <h1 style={s.h1}>Панель администратора</h1>
      <p style={s.sub}>Добро пожаловать, {user?.first_name}. Управляйте платформой.</p>

      <div style={s.grid}>
        {cards.map(c => (
          <Link key={c.label} to={c.to} style={{ ...s.card, borderTop: `4px solid ${c.color}`, textDecoration: 'none' }}>
            <div style={s.cardIcon}>{c.icon}</div>
            <div style={s.cardVal}>{loading ? '...' : c.value}</div>
            <div style={s.cardLabel}>{c.label}</div>
          </Link>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.h2}>Последние пользователи</h2>
          <Link to="/admin/users" style={s.seeAll}>Все пользователи →</Link>
        </div>
        <div style={s.tableWrap}>
          {recentUsers.length === 0 && !loading ? (
            <div style={s.empty}>Нет пользователей</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Пользователь</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Роль</th>
                  <th style={s.th}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.name}>{u.full_name || `${u.last_name} ${u.first_name}`}</div>
                    </td>
                    <td style={s.td}><span style={s.email}>{u.email}</span></td>
                    <td style={s.td}><RoleBadge role={u.role} /></td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#166534' : '#991b1b' }}>
                        {u.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={s.quickActions}>
        <h2 style={s.h2}>Быстрые действия</h2>
        <div style={s.actionsGrid}>
          <ActionCard to="/admin/users" icon="👨‍🏫" title="Добавить преподавателя"
            desc="Создайте аккаунт для нового преподавателя" />
          <ActionCard to="/admin/courses" icon="📝" title="Управление курсами"
            desc="Просмотр, публикация и архивирование курсов" />
          <ActionCard to="/admin/users?role=student" icon="👥" title="Студенты"
            desc="Список всех студентов платформы" />
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    admin: { label: 'Админ', bg: '#ede9fe', color: '#5b21b6' },
    teacher: { label: 'Преподаватель', bg: '#dbeafe', color: '#1e40af' },
    student: { label: 'Студент', bg: '#f0fdf4', color: '#166534' },
  };
  const r = map[role] || { label: role, bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: r.bg, color: r.color }}>
      {r.label}
    </span>
  );
}

function ActionCard({ to, icon, title, desc }) {
  return (
    <Link to={to} style={s.actionCard}>
      <span style={s.actionIcon}>{icon}</span>
      <div>
        <div style={s.actionTitle}>{title}</div>
        <div style={s.actionDesc}>{desc}</div>
      </div>
    </Link>
  );
}

const s = {
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub: { color: '#64748b', marginBottom: 28 },
  grid: { display: 'flex', gap: 16, marginBottom: 28 },
  card: {
    flex: 1, background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center', color: 'inherit',
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardVal: { fontSize: 36, fontWeight: 700, color: '#1e293b' },
  cardLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  section: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h2: { fontSize: 18, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' },
  seeAll: { fontSize: 14, color: '#6366f1', textDecoration: 'none', fontWeight: 600 },
  tableWrap: {},
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14 },
  name: { fontWeight: 600, color: '#1e293b' },
  email: { color: '#64748b', fontSize: 13 },
  badge: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  empty: { padding: 32, textAlign: 'center', color: '#94a3b8' },
  quickActions: {},
  actionsGrid: { display: 'flex', gap: 16 },
  actionCard: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 16,
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textDecoration: 'none',
    border: '1.5px solid transparent', transition: 'border-color 0.15s',
  },
  actionIcon: { fontSize: 28, flexShrink: 0 },
  actionTitle: { fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4 },
  actionDesc: { fontSize: 13, color: '#64748b' },
};
