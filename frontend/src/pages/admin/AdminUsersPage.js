import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usersAPI } from '../../api';

const RESET_EMPTY = { show: false, user: null, newPassword: null };

const ROLE_LABELS = { admin: 'Админ', teacher: 'Преподаватель', student: 'Студент' };
const ROLE_COLORS = {
  admin:   { bg: '#ede9fe', color: '#5b21b6' },
  teacher: { bg: '#dbeafe', color: '#1e40af' },
  student: { bg: '#f0fdf4', color: '#166534' },
};

const EMPTY_FORM = { first_name: '', last_name: '', email: '', password: '', role: 'teacher' };

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterRole = searchParams.get('role') || '';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [resetState, setResetState] = useState(RESET_EMPTY);

  const load = useCallback(() => {
    setLoading(true);
    const params = filterRole ? { role: filterRole } : {};
    usersAPI.list(params)
      .then(({ data }) => setUsers(Array.isArray(data) ? data : data.results || []))
      .finally(() => setLoading(false));
  }, [filterRole]);

  useEffect(() => { load(); }, [load]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);
    try {
      const payload = { ...form, username: form.email };
      await usersAPI.create(payload);
      setMsg({ type: 'success', text: `Пользователь ${form.first_name} ${form.last_name} успешно создан!` });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      const data = err.response?.data || {};
      if (typeof data === 'object') setFormErrors(data);
      else setMsg({ type: 'error', text: 'Ошибка при создании пользователя' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    const user = confirmDelete;
    setConfirmDelete(null);
    try {
      await usersAPI.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setMsg({ type: 'success', text: `Пользователь ${user.first_name} ${user.last_name} удалён` });
    } catch {
      setMsg({ type: 'error', text: 'Не удалось удалить пользователя' });
    }
  };

  const toggleActive = async (user) => {
    try {
      await usersAPI.update(user.id, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      setMsg({ type: 'success', text: `Пользователь ${user.is_active ? 'заблокирован' : 'разблокирован'}` });
    } catch {
      setMsg({ type: 'error', text: 'Не удалось изменить статус' });
    }
  };

  const handleResetPassword = async (user) => {
    try {
      const { data } = await usersAPI.resetPassword(user.id);
      setResetState({ show: true, user, newPassword: data.new_password });
    } catch {
      setMsg({ type: 'error', text: 'Не удалось сбросить пароль' });
    }
  };

  const tabs = [
    { label: 'Все', value: '' },
    { label: 'Преподаватели', value: 'teacher' },
    { label: 'Студенты', value: 'student' },
  ];

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Пользователи</h1>
          <p style={s.sub}>Управление учётными записями на платформе</p>
        </div>
        <button style={s.btnPrimary} onClick={() => { setShowForm(!showForm); setFormErrors({}); }}>
          {showForm ? 'Отмена' : '+ Добавить пользователя'}
        </button>
      </div>

      {msg && (
        <div style={{ ...s.msgBox, background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#991b1b' : '#166534' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={s.msgClose}>✕</button>
        </div>
      )}

      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Новый пользователь</h3>
          <form onSubmit={handleCreate}>
            <div style={s.formRow}>
              <FormField label="Имя *" error={formErrors.first_name?.[0]}>
                <input style={s.input} value={form.first_name} onChange={set('first_name')} placeholder="Иван" required />
              </FormField>
              <FormField label="Фамилия *" error={formErrors.last_name?.[0]}>
                <input style={s.input} value={form.last_name} onChange={set('last_name')} placeholder="Иванов" required />
              </FormField>
            </div>
            <div style={s.formRow}>
              <FormField label="Email *" error={formErrors.email?.[0]}>
                <input style={s.input} type="email" value={form.email} onChange={set('email')} placeholder="ivan@edu.ru" required />
              </FormField>
              <FormField label="Роль *" error={formErrors.role?.[0]}>
                <select style={s.input} value={form.role} onChange={set('role')}>
                  <option value="teacher">Преподаватель</option>
                  <option value="student">Студент</option>
                  <option value="admin">Администратор</option>
                </select>
              </FormField>
            </div>
            <FormField label="Пароль * (минимум 8 символов)" error={formErrors.password?.[0]} style={{ maxWidth: 340 }}>
              <input style={{ ...s.input, maxWidth: 340 }} type="password" value={form.password}
                onChange={set('password')} placeholder="••••••••" required minLength={8} />
            </FormField>
            {formErrors.non_field_errors && (
              <p style={{ color: '#ef4444', fontSize: 13 }}>{formErrors.non_field_errors[0]}</p>
            )}
            <div style={s.btnRow}>
              <button type="submit" style={s.btnPrimary} disabled={formLoading}>
                {formLoading ? 'Создание...' : 'Создать'}
              </button>
              <button type="button" style={s.btnSecondary} onClick={() => { setShowForm(false); setFormErrors({}); }}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={s.tabs}>
        {tabs.map(t => (
          <button
            key={t.value}
            style={{ ...s.tab, ...(filterRole === t.value ? s.tabActive : {}) }}
            onClick={() => setSearchParams(t.value ? { role: t.value } : {})}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.empty}>Загрузка...</div>
      ) : users.length === 0 ? (
        <div style={s.empty}>Нет пользователей в этой категории</div>
      ) : (
        <div style={s.tableCard}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Пользователь</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Роль</th>
                <th style={s.th}>Статус</th>
                <th style={s.th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.avatar}>
                      <div style={s.avatarCircle}>{u.first_name?.[0]}{u.last_name?.[0]}</div>
                      <div>
                        <div style={s.name}>{u.full_name || `${u.last_name} ${u.first_name}`}</div>
                        <div style={s.date}>С {new Date(u.created_at).toLocaleDateString('ru-RU')}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.emailText}>{u.email}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, ...ROLE_COLORS[u.role] }}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#166534' : '#991b1b' }}>
                      {u.is_active ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button
                        style={{ ...s.actionBtn, color: u.is_active ? '#dc2626' : '#16a34a' }}
                        onClick={() => toggleActive(u)}
                      >
                        {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                      </button>
                      <button
                        style={{ ...s.actionBtn, color: '#6366f1' }}
                        onClick={() => handleResetPassword(u)}
                        title="Сбросить пароль"
                      >
                        Сбросить пароль
                      </button>
                      <button
                        style={{ ...s.actionBtn, color: '#94a3b8' }}
                        onClick={() => setConfirmDelete(u)}
                        title="Удалить пользователя"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Удалить пользователя?</h3>
            <p style={s.modalText}>
              Вы уверены, что хотите удалить{' '}
              <b>{confirmDelete.first_name} {confirmDelete.last_name}</b>?
              Это действие нельзя отменить — все данные будут удалены из базы.
            </p>
            <div style={s.modalBtns}>
              <button style={s.btnDanger} onClick={handleDelete}>Да, удалить</button>
              <button style={s.btnSecondary} onClick={() => setConfirmDelete(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {resetState.show && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>🔑 Пароль сброшен</h3>
            <p style={s.modalText}>
              Новый пароль для <b>{resetState.user?.first_name} {resetState.user?.last_name}</b>:
            </p>
            <div style={s.passwordBox}>{resetState.newPassword}</div>
            <p style={{ ...s.modalText, fontSize: 12, color: '#94a3b8' }}>
              Скопируйте и передайте пользователю. После закрытия этого окна пароль не будет показан повторно.
            </p>
            <div style={s.modalBtns}>
              <button style={s.btnPrimary} onClick={() => {
                navigator.clipboard?.writeText(resetState.newPassword);
                setResetState(RESET_EMPTY);
              }}>Скопировать и закрыть</button>
              <button style={s.btnSecondary} onClick={() => setResetState(RESET_EMPTY)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, error, children, style }) {
  return (
    <div style={{ flex: 1, ...style }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub: { color: '#64748b', margin: 0 },
  msgBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14,
  },
  msgClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit', padding: '0 4px' },
  formCard: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  formTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 20px' },
  formRow: { display: 'flex', gap: 16, marginBottom: 16 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 8, marginTop: 8 },
  btnPrimary: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  tabs: { display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' },
  tab: { padding: '8px 20px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 14, cursor: 'pointer', color: '#64748b' },
  tabActive: { background: '#fff', color: '#1e293b', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  empty: { background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', color: '#94a3b8' },
  tableCard: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14 },
  avatar: { display: 'flex', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 36, height: 36, borderRadius: '50%', background: '#e0e7ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: '#4338ca', flexShrink: 0,
  },
  name: { fontWeight: 600, color: '#1e293b' },
  date: { fontSize: 12, color: '#94a3b8' },
  emailText: { color: '#64748b', fontSize: 13 },
  badge: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '4px 8px', borderRadius: 6 },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '32px 36px', width: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' },
  modalText: { fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 24px' },
  modalBtns: { display: 'flex', gap: 8 },
  btnDanger: { padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  passwordBox: {
    background: '#f0f4ff', border: '2px dashed #6366f1', borderRadius: 8,
    padding: '14px 20px', fontFamily: 'monospace', fontSize: 20, fontWeight: 700,
    color: '#4338ca', textAlign: 'center', letterSpacing: 2, marginBottom: 12,
  },
};
