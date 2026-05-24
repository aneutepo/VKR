import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI, activityAPI, testingAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coursesAPI.myCourses(),
      activityAPI.myMetrics(),
      testingAPI.myResults(),
    ]).then(([e, m, r]) => {
      setEnrollments(Array.isArray(e.data) ? e.data : (e.data.results || []));
      setMetrics(m.data.results || m.data);
      setResults(r.data.results || r.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalTime = metrics.reduce((sum, m) => sum + (m.total_time_minutes || 0), 0);
  const avgScore = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + (m.avg_test_score || 0), 0) / metrics.length).toFixed(0)
    : null;
  const passedTests = results.filter(r => r.passed).length;
  const completedCourses = enrollments.filter(e => e.progress === 100).length;

  if (loading) return <div style={s.loading}>Загрузка...</div>;

  return (
    <div>
      <h1 style={s.h1}>Привет, {user?.first_name}! 🎓</h1>
      <p style={s.sub}>Ваш учебный кабинет</p>

      <div style={s.grid}>
        <StatCard icon="📚" value={enrollments.length} label="Курсов записано" color="#6366f1" onClick={() => navigate('/student/courses')} />
        <StatCard icon="✅" value={completedCourses} label="Завершено" color="#22c55e" onClick={() => navigate('/student/courses')} />
        <StatCard icon="⏱️" value={`${Math.round(totalTime)} мин`} label="На платформе" color="#06b6d4" onClick={() => navigate('/student/stats')} />
        <StatCard icon="⭐" value={avgScore !== null ? avgScore : '—'} label="Средний балл" color="#f59e0b" onClick={() => navigate('/student/stats')} />
        <StatCard icon="🏆" value={passedTests} label="Тестов сдано" color="#8b5cf6" onClick={() => navigate('/student/stats')} />
      </div>

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.h2}>Мои курсы</h2>
          <button style={s.linkBtn} onClick={() => navigate('/student/courses')}>Все курсы →</button>
        </div>

        {enrollments.length === 0 ? (
          <div style={s.emptyWrap}>
            <div style={s.emptyIcon}>📭</div>
            <div style={s.emptyTitle}>Курсов пока нет</div>
            <div style={s.emptyText}>Преподаватель запишет вас на курс — тогда они появятся здесь.</div>
          </div>
        ) : (
          enrollments.slice(0, 5).map(e => {
            const courseMet = metrics.find(m => m.course === e.course);
            return (
              <div key={e.id} style={s.courseCard} onClick={() => navigate('/student/courses')}>
                <div style={s.courseInfo}>
                  <div style={s.courseTitle}>{e.course_title}</div>
                  <div style={s.courseStats}>
                    {courseMet && (
                      <>
                        <span style={s.stat}>⏱ {Math.round(courseMet.total_time_minutes || 0)} мин</span>
                        <span style={s.stat}>✏️ {courseMet.test_attempts} тестов</span>
                        {courseMet.avg_test_score > 0 && (
                          <span style={s.stat}>⭐ {Math.round(courseMet.avg_test_score)} баллов</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div style={s.progressSide}>
                  <div style={s.progressLabel}>{e.progress}%</div>
                  <div style={s.progressBar}>
                    <div style={{ ...s.progressFill, width: `${e.progress}%` }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {results.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.h2}>Последние тесты</h2>
            <button style={s.linkBtn} onClick={() => navigate('/student/stats')}>Вся статистика →</button>
          </div>
          {results.slice(0, 3).map(r => (
            <div key={r.id} style={s.resultCard}>
              <div style={s.resultTitle}>{r.test_title || `Тест #${r.test}`}</div>
              <div style={s.resultRight}>
                <span style={{ ...s.badge, background: r.passed ? '#dcfce7' : '#fee2e2', color: r.passed ? '#166534' : '#991b1b' }}>
                  {r.passed ? '✅ Сдан' : '❌ Не сдан'}
                </span>
                <span style={s.score}>{r.score} баллов</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, color, onClick }) {
  return (
    <div style={{ ...s.card, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ ...s.cardIcon, color }}>{icon}</div>
      <div style={s.cardVal}>{value}</div>
      <div style={s.cardLabel}>{label}</div>
    </div>
  );
}

const s = {
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub: { color: '#64748b', marginBottom: 28 },
  grid: { display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
  card: {
    flex: '1 1 120px', background: '#fff', borderRadius: 12, padding: '20px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center',
    transition: 'box-shadow 0.15s',
  },
  cardIcon: { fontSize: 26, marginBottom: 8 },
  cardVal: { fontSize: 26, fontWeight: 700, color: '#1e293b' },
  cardLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { marginBottom: 28 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h2: { fontSize: 20, fontWeight: 600, color: '#1e293b', margin: 0 },
  linkBtn: { background: 'none', border: 'none', color: '#6366f1', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 },
  emptyWrap: { background: '#fff', borderRadius: 12, padding: '36px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
  courseCard: {
    background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
  },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 6 },
  courseStats: { display: 'flex', gap: 12 },
  stat: { fontSize: 12, color: '#64748b' },
  progressSide: { textAlign: 'right', minWidth: 120 },
  progressLabel: { fontSize: 12, color: '#6366f1', fontWeight: 700, marginBottom: 4 },
  progressBar: { height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', width: 120 },
  progressFill: { height: '100%', background: '#6366f1', borderRadius: 4 },
  resultCard: {
    background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 8,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
  },
  resultTitle: { fontSize: 14, fontWeight: 500, color: '#1e293b' },
  resultRight: { display: 'flex', alignItems: 'center', gap: 12 },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  score: { fontSize: 14, fontWeight: 700, color: '#6366f1' },
};
