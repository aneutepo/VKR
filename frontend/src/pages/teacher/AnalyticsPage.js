import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { analyticsAPI, coursesAPI } from '../../api';

export default function AnalyticsPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [clusterData, setClusterData] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [nClusters, setNClusters] = useState(3);

  useEffect(() => {
    coursesAPI.list().then(({ data }) => setCourses(data.results || data));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    Promise.all([
      analyticsAPI.latest(selectedCourse).catch(() => ({ data: null })),
      analyticsAPI.distribution(selectedCourse).catch(() => ({ data: [] })),
    ]).then(([latestRes, distRes]) => {
      setClusterData(latestRes.data);
      setDistribution(distRes.data);
    }).finally(() => setLoading(false));
  }, [selectedCourse]);

  const handleRunClustering = async () => {
    if (!selectedCourse) return;
    setRunLoading(true);
    try {
      const { data } = await analyticsAPI.runClustering(selectedCourse, nClusters);
      setClusterData(data);
      const distRes = await analyticsAPI.distribution(selectedCourse);
      setDistribution(distRes.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка кластеризации');
    } finally {
      setRunLoading(false);
    }
  };

  const patternColors = { 'Проактивный': '#22C55E', 'Средний': '#F59E0B', 'Апатичный': '#EF4444' };

  return (
    <div>
      <h1 style={styles.h1}>🧠 Интеллектуальный анализ</h1>
      <p style={styles.subtitle}>Гибридный алгоритм кластеризации GKA + метод Уорда</p>

      {/* Настройки */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>⚙️ Параметры кластеризации</h3>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Курс</label>
            <select style={styles.select} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              <option value="">— Выберите курс —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Количество кластеров (k)</label>
            <input type="number" min={2} max={6} style={styles.input}
              value={nClusters} onChange={e => setNClusters(+e.target.value)} />
          </div>
          <button onClick={handleRunClustering} disabled={!selectedCourse || runLoading} style={styles.btn}>
            {runLoading ? '⏳ Анализ...' : '▶ Запустить кластеризацию'}
          </button>
        </div>
      </div>

      {loading && <div style={styles.loading}>Загрузка данных...</div>}

      {clusterData && (
        <>
          {/* Метрики качества */}
          <div style={styles.metricsRow}>
            <div style={styles.metric}>
              <div style={styles.metricVal}>{clusterData.silhouette_score?.toFixed(3)}</div>
              <div style={styles.metricLabel}>Силуэтный коэффициент</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricVal}>{clusterData.n_clusters}</div>
              <div style={styles.metricLabel}>Кластеров</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricVal}>{clusterData.results?.length || 0}</div>
              <div style={styles.metricLabel}>Студентов проанализировано</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricVal}>{new Date(clusterData.created_at).toLocaleDateString('ru')}</div>
              <div style={styles.metricLabel}>Дата анализа</div>
            </div>
          </div>

          <div style={styles.chartsRow}>
            {/* Pie chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.cardTitle}>Распределение по паттернам</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={distribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, count }) => `${name}: ${count}`}>
                    {distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color || patternColors[entry.name] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.cardTitle}>Количество студентов</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Экспорт */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <a
              href={analyticsAPI.exportUrl(selectedCourse)}
              download="analytics_report.csv"
              style={styles.exportBtn}
            >
              ⬇️ Экспорт в CSV
            </a>
          </div>

          {/* Рекомендации по паттернам */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>💡 Рекомендации по группам</h3>
            <div style={styles.recGrid}>
              {Object.values(
                (clusterData.results || []).reduce((acc, r) => {
                  const key = r.pattern_name;
                  if (!acc[key]) acc[key] = { name: key, color: r.pattern_color, recommendation: r.recommendation, count: 0, students: [] };
                  acc[key].count++;
                  acc[key].students.push(r.student_name);
                  return acc;
                }, {})
              ).map(group => (
                <div key={group.name} style={{ ...styles.recCard, borderLeft: `4px solid ${group.color || '#6366f1'}` }}>
                  <div style={styles.recHeader}>
                    <span style={{ ...styles.badge, background: group.color || '#6366f1' }}>{group.name}</span>
                    <span style={styles.recCount}>{group.count} студ.</span>
                  </div>
                  <div style={styles.recText}>{group.recommendation}</div>
                  <div style={styles.recStudents}>{group.students.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Таблица результатов */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📋 Детальные результаты студентов</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Студент</th>
                  <th style={styles.th}>Паттерн</th>
                  <th style={styles.th}>Силуэт</th>
                  <th style={styles.th}>Рекомендация</th>
                </tr>
              </thead>
              <tbody>
                {clusterData.results?.map(r => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{r.student_name}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: r.pattern_color || '#6366f1' }}>
                        {r.pattern_name}
                      </span>
                    </td>
                    <td style={styles.td}>{r.silhouette_coefficient?.toFixed(3)}</td>
                    <td style={{ ...styles.td, fontSize: 12, color: '#64748b', maxWidth: 300 }}>
                      {r.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!clusterData && !loading && selectedCourse && (
        <div style={styles.empty}>
          Кластеризация ещё не запускалась для этого курса.<br />
          Нажмите «Запустить кластеризацию» для анализа.
        </div>
      )}
    </div>
  );
}

const styles = {
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  subtitle: { color: '#64748b', marginBottom: 24 },
  card: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' },
  row: { display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  select: { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, minWidth: 220 },
  input: { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, width: 80 },
  btn: {
    padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
  },
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  metricsRow: { display: 'flex', gap: 16, marginBottom: 20 },
  metric: {
    flex: 1, background: '#fff', borderRadius: 12, padding: 20,
    textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  },
  metricVal: { fontSize: 28, fontWeight: 700, color: '#6366f1' },
  metricLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  chartsRow: { display: 'flex', gap: 16, marginBottom: 20 },
  chartCard: {
    flex: 1, background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#1e293b' },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
    color: '#fff', fontSize: 12, fontWeight: 600
  },
  empty: {
    background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center',
    color: '#64748b', lineHeight: 2
  },
  recGrid: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  recCard: {
    flex: '1 1 240px', background: '#f8fafc', borderRadius: 10, padding: 16,
    border: '1px solid #e2e8f0',
  },
  recHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recCount: { fontSize: 12, color: '#64748b', fontWeight: 600 },
  recText: { fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 10 },
  recStudents: { fontSize: 11, color: '#94a3b8', lineHeight: 1.5 },
  exportBtn: {
    display: 'inline-block', padding: '9px 20px', background: '#f0fdf4',
    color: '#166534', border: '1.5px solid #86efac', borderRadius: 8,
    fontSize: 14, fontWeight: 600, textDecoration: 'none',
  },
};
