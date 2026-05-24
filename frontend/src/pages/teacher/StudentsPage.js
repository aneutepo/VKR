import React, { useEffect, useState } from 'react';
import { usersAPI, coursesAPI, activityAPI } from '../../api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ student: '', course: '' });
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('students'); // students | enrollments

  const load = () => {
    setLoading(true);
    Promise.all([
      usersAPI.students(),
      coursesAPI.list(),
      coursesAPI.enrollments(),
      activityAPI.metrics(),
    ]).then(([s, c, e, m]) => {
      setStudents(s.data.results || s.data);
      setCourses(c.data.results || c.data);
      setEnrollments(e.data.results || e.data);
      setMetrics(m.data.results || m.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollForm.student || !enrollForm.course) return;
    try {
      await coursesAPI.enroll({ student: enrollForm.student, course: enrollForm.course });
      setMsg('Студент успешно записан на курс!');
      setEnrollForm({ student: '', course: '' });
      setShowEnrollForm(false);
      load();
    } catch (err) {
      setMsg(err.response?.data?.non_field_errors?.[0] || 'Ошибка: студент уже записан или произошла ошибка');
    }
  };

  const getStudentMetrics = (studentId) => {
    return metrics.filter(m => m.student === studentId);
  };

  const getStudentCourses = (studentId) => {
    return enrollments.filter(e => e.student === studentId);
  };

  const getActivityStatus = (studentId) => {
    const m = getStudentMetrics(studentId);
    if (m.length === 0) return { label: 'Нет данных', color: '#94a3b8' };
    const totalTime = m.reduce((sum, x) => sum + x.total_time_minutes, 0);
    if (totalTime > 60) return { label: 'Активный', color: '#22c55e' };
    if (totalTime > 10) return { label: 'Средний', color: '#f59e0b' };
    return { label: 'Низкая активность', color: '#ef4444' };
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>👥 Студенты</h1>
          <p style={s.sub}>Управление обучающимися и назначение на курсы</p>
        </div>
        <button style={s.btnPrimary} onClick={() => setShowEnrollForm(!showEnrollForm)}>
          + Записать на курс
        </button>
      </div>

      {msg && (
        <div style={{ ...s.msgBox, background: msg.includes('Ошибка') ? '#fee2e2' : '#dcfce7', color: msg.includes('Ошибка') ? '#991b1b' : '#166534' }}>
          {msg}
        </div>
      )}

      {/* Форма записи на курс */}
      {showEnrollForm && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Записать студента на курс</h3>
          <form onSubmit={handleEnroll}>
            <div style={s.formRow}>
              <div style={s.field}>
                <label style={s.label}>Студент *</label>
                <select
                  style={s.input}
                  value={enrollForm.student}
                  onChange={e => setEnrollForm({ ...enrollForm, student: e.target.value })}
                  required
                >
                  <option value="">— Выберите студента —</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.full_name || `${st.last_name} ${st.first_name}`}</option>
                  ))}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Курс *</label>
                <select
                  style={s.input}
                  value={enrollForm.course}
                  onChange={e => setEnrollForm({ ...enrollForm, course: e.target.value })}
                  required
                >
                  <option value="">— Выберите курс —</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={s.btnRow}>
              <button type="submit" style={s.btnPrimary}>Записать</button>
              <button type="button" style={s.btnSecondary} onClick={() => setShowEnrollForm(false)}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      {/* Табы */}
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(activeTab === 'students' ? s.tabActive : {}) }} onClick={() => setActiveTab('students')}>
          Список студентов ({students.length})
        </button>
        <button style={{ ...s.tab, ...(activeTab === 'enrollments' ? s.tabActive : {}) }} onClick={() => setActiveTab('enrollments')}>
          Записи на курсы ({enrollments.length})
        </button>
      </div>

      {loading ? (
        <div style={s.empty}>Загрузка...</div>
      ) : activeTab === 'students' ? (
        // Список студентов
        students.length === 0 ? (
          <div style={s.empty}>Студентов пока нет</div>
        ) : (
          <div style={s.card}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Студент</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Курсов</th>
                  <th style={s.th}>Активность</th>
                  <th style={s.th}>Время на платформе</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => {
                  const status = getActivityStatus(st.id);
                  const stCourses = getStudentCourses(st.id);
                  const stMetrics = getStudentMetrics(st.id);
                  const totalTime = stMetrics.reduce((sum, m) => sum + m.total_time_minutes, 0);
                  return (
                    <tr key={st.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={s.studentName}>{st.full_name || `${st.last_name} ${st.first_name}`}</div>
                      </td>
                      <td style={s.td}><span style={s.email}>{st.email}</span></td>
                      <td style={s.td}>{stCourses.length}</td>
                      <td style={s.td}>
                        <span style={{ ...s.statusBadge, background: status.color + '20', color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={s.td}>{totalTime > 0 ? `${totalTime.toFixed(0)} мин` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // Записи на курсы
        enrollments.length === 0 ? (
          <div style={s.empty}>Записей пока нет. Запишите студента на курс!</div>
        ) : (
          <div style={s.card}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Студент</th>
                  <th style={s.th}>Курс</th>
                  <th style={s.th}>Дата записи</th>
                  <th style={s.th}>Прогресс</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(e => (
                  <tr key={e.id} style={s.tr}>
                    <td style={s.td}>{e.student_name}</td>
                    <td style={s.td}>{e.course_title}</td>
                    <td style={s.td}>{e.enrolled_at}</td>
                    <td style={s.td}>
                      <div style={s.progressWrap}>
                        <div style={s.progressBar}>
                          <div style={{ ...s.progressFill, width: `${e.progress}%` }} />
                        </div>
                        <span style={s.progressText}>{e.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub: { color: '#64748b', margin: 0 },
  msgBox: { padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  card: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 16px' },
  formRow: { display: 'flex', gap: 16 },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 8 },
  btnPrimary: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  tabs: { display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' },
  tab: { padding: '8px 20px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 14, cursor: 'pointer', color: '#64748b' },
  tabActive: { background: '#fff', color: '#1e293b', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  empty: { background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', color: '#94a3b8' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#1e293b' },
  studentName: { fontWeight: 600 },
  email: { color: '#64748b', fontSize: 13 },
  statusBadge: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#6366f1', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#64748b', width: 32 },
};