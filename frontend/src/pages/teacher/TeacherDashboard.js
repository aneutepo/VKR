import React, { useEffect, useState } from 'react';
import { usersAPI, coursesAPI, activityAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, courses: 0 });

  useEffect(() => {
    Promise.all([
      usersAPI.students().catch(() => ({ data: [] })),
      coursesAPI.list().catch(() => ({ data: [] })),
    ]).then(([students, courses]) => {
      const s = students.data;
      const c = courses.data;
      setStats({
        students: Array.isArray(s) ? s.length : s.count || 0,
        courses: Array.isArray(c) ? c.length : c.count || 0,
      });
    });
  }, []);

  return (
    <div>
      <h1 style={s.h1}>Добро пожаловать, {user?.first_name}! 👋</h1>
      <p style={s.sub}>Дашборд преподавателя</p>
      <div style={s.grid}>
        {[
          { label: 'Студентов', value: stats.students, icon: '👥', color: '#6366f1' },
          { label: 'Курсов', value: stats.courses, icon: '📚', color: '#22c55e' },
          { label: 'Анализ', value: 'GKA+Ward', icon: '🧠', color: '#f59e0b' },
        ].map(card => (
          <div key={card.label} style={{ ...s.card, borderTop: `4px solid ${card.color}` }}>
            <div style={s.cardIcon}>{card.icon}</div>
            <div style={s.cardVal}>{card.value}</div>
            <div style={s.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>
      <div style={s.card2}>
        <h3 style={s.h3}>📌 Быстрые действия</h3>
        <ul style={s.list}>
          <li>Перейдите в раздел <b>Аналитика</b> для запуска кластеризации студентов</li>
          <li>В разделе <b>Студенты</b> просмотрите список обучающихся</li>
          <li>В разделе <b>Курсы</b> создайте новый курс или добавьте модули</li>
        </ul>
      </div>
    </div>
  );
}

const s = {
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub: { color: '#64748b', marginBottom: 28 },
  grid: { display: 'flex', gap: 16, marginBottom: 24 },
  card: {
    flex: 1, background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center'
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardVal: { fontSize: 32, fontWeight: 700, color: '#1e293b' },
  cardLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  card2: {
    background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  },
  h3: { fontSize: 16, fontWeight: 600, margin: '0 0 12px' },
  list: { paddingLeft: 20, color: '#374151', lineHeight: 2.2 },
};
