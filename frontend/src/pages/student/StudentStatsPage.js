import React, { useEffect, useState } from 'react';
import { activityAPI, testingAPI } from '../../api';

export default function StudentStatsPage() {
  const [metrics, setMetrics] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      activityAPI.myMetrics(),
      testingAPI.myResults(),
    ]).then(([m, r]) => {
      setMetrics(m.data.results || m.data);
      setResults(r.data.results || r.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loading}>Загрузка статистики...</div>;

  const totalTime = metrics.reduce((sum, m) => sum + (m.total_time_minutes || 0), 0);
  const totalSessions = metrics.reduce((sum, m) => sum + (m.session_count || 0), 0);
  const totalTests = metrics.reduce((sum, m) => sum + (m.test_attempts || 0), 0);
  const avgScore = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + (m.avg_test_score || 0), 0) / metrics.length).toFixed(1)
    : '—';
  const passedCount = results.filter(r => r.passed).length;

  return (
    <div>
      <h1 style={s.h1}>📊 Моя статистика</h1>
      <p style={s.sub}>Персональная учебная траектория и показатели активности</p>

      {/* Сводные показатели */}
      <div style={s.summaryGrid}>
        <StatCard icon="⏱️" label="Время на платформе" value={`${Math.round(totalTime)} мин`} color="#6366f1" />
        <StatCard icon="🔁" label="Учебных сессий" value={totalSessions} color="#06b6d4" />
        <StatCard icon="✏️" label="Тестов пройдено" value={results.length} color="#f59e0b" />
        <StatCard icon="⭐" label="Средний балл" value={avgScore} color="#22c55e" />
        <StatCard icon="✅" label="Тестов сдано" value={passedCount} color="#8b5cf6" />
      </div>

      {/* Статистика по курсам */}
      {metrics.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📭</div>
          <div style={s.emptyTitle}>Активности пока нет</div>
          <div style={s.emptyText}>Начните изучать курсы — здесь появится ваша статистика.</div>
        </div>
      ) : (
        <div style={s.card}>
          <h3 style={s.cardTitle}>📚 Показатели по курсам</h3>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Курс</th>
                <th style={s.th}>Время (мин)</th>
                <th style={s.th}>Сессий</th>
                <th style={s.th}>Просмотров</th>
                <th style={s.th}>Тестов</th>
                <th style={s.th}>Средний балл</th>
                <th style={s.th}>Последняя активность</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.id} style={s.tr}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{m.course_title}</td>
                  <td style={s.td}>{Math.round(m.total_time_minutes || 0)}</td>
                  <td style={s.td}>{m.session_count}</td>
                  <td style={s.td}>{m.content_views}</td>
                  <td style={s.td}>{m.test_attempts}</td>
                  <td style={s.td}>
                    <ScoreBadge score={m.avg_test_score} />
                  </td>
                  <td style={{ ...s.td, color: '#94a3b8', fontSize: 12 }}>
                    {m.last_activity ? new Date(m.last_activity).toLocaleDateString('ru') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* История тестов */}
      {results.length > 0 && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>📝 История прохождения тестов</h3>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Тест</th>
                <th style={s.th}>Балл</th>
                <th style={s.th}>Результат</th>
                <th style={s.th}>Дата</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} style={s.tr}>
                  <td style={s.td}>{r.test_title || `Тест #${r.test}`}</td>
                  <td style={s.td}>{r.score}</td>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: r.passed ? '#dcfce7' : '#fee2e2',
                      color: r.passed ? '#166534' : '#991b1b',
                    }}>
                      {r.passed ? '✅ Сдан' : '❌ Не сдан'}
                    </span>
                  </td>
                  <td style={{ ...s.td, color: '#94a3b8', fontSize: 12 }}>
                    {r.completed_at ? new Date(r.completed_at).toLocaleDateString('ru') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, color }}>{icon}</div>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const v = Math.round(score || 0);
  const color = v >= 80 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#ef4444';
  return <span style={{ fontWeight: 700, color }}>{v}</span>;
}

const s = {
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub: { color: '#64748b', marginBottom: 24 },
  summaryGrid: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  statCard: {
    flex: '1 1 140px', background: '#fff', borderRadius: 12, padding: '20px 16px',
    textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: 700, color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  card: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#1e293b' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  empty: { background: '#fff', borderRadius: 12, padding: '48px 32px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7 },
};
