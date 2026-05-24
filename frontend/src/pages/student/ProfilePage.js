import React, { useEffect, useState } from 'react';
import { authAPI, activityAPI, testingAPI, coursesAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [results, setResults] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', patronymic: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [activeTab, setActiveTab] = useState('profile');

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        patronymic: user.patronymic || '',
        email: user.email || '',
      });
    }
    Promise.all([
      activityAPI.myMetrics(),
      testingAPI.myResults(),
      coursesAPI.myCourses(),
    ]).then(([m, r, e]) => {
      setMetrics(Array.isArray(m.data) ? m.data : (m.data.results || []));
      setResults(Array.isArray(r.data) ? r.data : (r.data.results || []));
      setEnrollments(Array.isArray(e.data) ? e.data : (e.data.results || []));
    }).catch(() => {});
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(profileForm);
      showMsg('Профиль обновлён!');
    } catch {
      showMsg('Ошибка при обновлении', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await authAPI.changePassword(passwordForm);
      showMsg('Пароль успешно изменён!');
      setPasswordForm({ old_password: '', new_password: '' });
    } catch (err) {
      showMsg(err.response?.data?.old_password?.[0] || 'Ошибка при смене пароля', 'error');
    }
  };

  // Считаем общую статистику
  const totalTime = metrics.reduce((sum, m) => sum + m.total_time_minutes, 0);
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const avgScore = totalTests > 0 ? (results.reduce((sum, r) => sum + r.score, 0) / totalTests).toFixed(1) : 0;

  return (
    <div>
      <h1 style={s.h1}>👤 Личный кабинет</h1>
      <p style={s.sub}>{user?.full_name || `${user?.last_name} ${user?.first_name}`}</p>

      {msg && (
        <div style={{ ...s.msgBox, background: msgType === 'error' ? '#fee2e2' : '#dcfce7', color: msgType === 'error' ? '#991b1b' : '#166534' }}>
          {msg}
        </div>
      )}

      {/* Статистика */}
      <div style={s.statsGrid}>
        {[
          { icon: '⏱️', label: 'Время на платформе', value: `${Math.round(totalTime)} мин` },
          { icon: '📚', label: 'Курсов записано', value: enrollments.length },
          { icon: '✏️', label: 'Тестов пройдено', value: `${passedTests}/${totalTests}` },
          { icon: '⭐', label: 'Средний балл', value: avgScore },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={s.statIcon}>{stat.icon}</div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Табы */}
      <div style={s.tabs}>
        {[
          { id: 'profile', label: '📋 Профиль' },
          { id: 'trajectory', label: '📈 Траектория обучения' },
          { id: 'results', label: '✏️ Результаты тестов' },
          { id: 'password', label: '🔒 Пароль' },
        ].map(tab => (
          <button key={tab.id}
            style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Профиль */}
      {activeTab === 'profile' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Личные данные</h3>
          <form onSubmit={handleUpdateProfile}>
            <div style={s.formRow}>
              <div style={s.field}>
                <label style={s.label}>Фамилия</label>
                <input style={s.input} value={profileForm.last_name}
                  onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Имя</label>
                <input style={s.input} value={profileForm.first_name}
                  onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Отчество</label>
                <input style={s.input} value={profileForm.patronymic}
                  onChange={e => setProfileForm({ ...profileForm, patronymic: e.target.value })} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input type="email" style={s.input} value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
            </div>
            <button type="submit" style={s.btnPrimary}>Сохранить</button>
          </form>
        </div>
      )}

      {/* Траектория обучения */}
      {activeTab === 'trajectory' && (
        <div>
          {enrollments.length === 0 ? (
            <div style={s.empty}>Вы ещё не записаны ни на один курс</div>
          ) : (
            enrollments.map(e => {
              const courseMetrics = metrics.find(m => m.course === e.course);
              return (
                <div key={e.id} style={s.card}>
                  <h3 style={s.cardTitle}>{e.course_title}</h3>

                  {/* Прогресс */}
                  <div style={s.progressSection}>
                    <div style={s.progressLabel}>Прогресс завершения</div>
                    <div style={s.progressWrap}>
                      <div style={s.progressBar}>
                        <div style={{ ...s.progressFill, width: `${e.progress}%` }} />
                      </div>
                      <span style={s.progressText}>{e.progress}%</span>
                    </div>
                  </div>

                  {/* Метрики активности */}
                  {courseMetrics && (
                    <div style={s.metricsGrid}>
                      <div style={s.metricItem}>
                        <div style={s.metricVal}>{Math.round(courseMetrics.total_time_minutes)} мин</div>
                        <div style={s.metricLabel}>Общее время</div>
                      </div>
                      <div style={s.metricItem}>
                        <div style={s.metricVal}>{courseMetrics.session_count}</div>
                        <div style={s.metricLabel}>Сессий</div>
                      </div>
                      <div style={s.metricItem}>
                        <div style={s.metricVal}>{courseMetrics.content_views}</div>
                        <div style={s.metricLabel}>Просмотров</div>
                      </div>
                      <div style={s.metricItem}>
                        <div style={s.metricVal}>{courseMetrics.avg_test_score.toFixed(1)}</div>
                        <div style={s.metricLabel}>Средний балл</div>
                      </div>
                    </div>
                  )}

                  <div style={s.enrollDate}>Записан: {e.enrolled_at}</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Результаты тестов */}
      {activeTab === 'results' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>История прохождения тестов</h3>
          {results.length === 0 ? (
            <div style={s.empty}>Вы ещё не проходили тесты</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Тест</th>
                  <th style={s.th}>Балл</th>
                  <th style={s.th}>Статус</th>
                  <th style={s.th}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} style={s.tr}>
                    <td style={s.td}>{r.test_title}</td>
                    <td style={s.td}>{r.score}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: r.passed ? '#dcfce7' : '#fee2e2', color: r.passed ? '#166534' : '#991b1b' }}>
                        {r.passed ? '✅ Пройден' : '❌ Не пройден'}
                      </span>
                    </td>
                    <td style={s.td}>{new Date(r.completed_at).toLocaleDateString('ru')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Смена пароля */}
      {activeTab === 'password' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Смена пароля</h3>
          <form onSubmit={handleChangePassword}>
            <div style={s.field}>
              <label style={s.label}>Текущий пароль</label>
              <input type="password" style={s.input} value={passwordForm.old_password}
                onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Новый пароль</label>
              <input type="password" style={s.input} value={passwordForm.new_password}
                onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required minLength={8} />
            </div>
            <button type="submit" style={s.btnPrimary}>Сменить пароль</button>
          </form>
        </div>
      )}
    </div>
  );
}

const s = {
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub: { color: '#64748b', marginBottom: 24 },
  msgBox: { padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  statsGrid: { display: 'flex', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, background: '#fff', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: '4px solid #6366f1' },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 700, color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', padding: 4, borderRadius: 10, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 13, cursor: 'pointer', color: '#64748b' },
  tabActive: { background: '#fff', color: '#1e293b', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  card: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 16px' },
  formRow: { display: 'flex', gap: 16 },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  btnPrimary: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  empty: { padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 },
  progressSection: { marginBottom: 16 },
  progressLabel: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#6366f1', borderRadius: 5 },
  progressText: { fontSize: 14, fontWeight: 600, color: '#6366f1', width: 40 },
  metricsGrid: { display: 'flex', gap: 12, marginTop: 16 },
  metricItem: { flex: 1, background: '#f8fafc', borderRadius: 8, padding: 12, textAlign: 'center' },
  metricVal: { fontSize: 20, fontWeight: 700, color: '#6366f1' },
  metricLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  enrollDate: { fontSize: 12, color: '#94a3b8', marginTop: 12 },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#1e293b' },
  badge: { padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
};