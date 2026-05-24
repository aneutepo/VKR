import React, { useEffect, useRef, useState } from 'react';
import { coursesAPI, testingAPI, activityAPI } from '../../api';

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments]   = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [tests, setTests]               = useState([]);
  const [myResults, setMyResults]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [msg, setMsg]                   = useState(null);
  const [view, setView]                 = useState('courses'); // courses | content
  const [completedModules, setCompletedModules] = useState(new Set());

  const sessionStartRef = useRef(null);
  const sessionCourseRef = useRef(null);

  // { [testId]: { [questionId]: Set<answerId> } }
  const [selected, setSelected] = useState({});
  // { [testId]: { score, passed, correct, total } }
  const [submitResults, setSubmitResults] = useState({});
  const [submitting, setSubmitting] = useState(null);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadData = () => {
    Promise.all([
      coursesAPI.myCourses(),
      testingAPI.myResults(),
      coursesAPI.myCompletions(),
    ]).then(([e, r, c]) => {
      setEnrollments(e.data.results || e.data);
      setMyResults(r.data.results || r.data);
      setCompletedModules(new Set(c.data));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const logCurrentSession = () => {
    if (!sessionStartRef.current || !sessionCourseRef.current) return;
    const { module, enrollment } = sessionCourseRef.current;
    const sessionEnd = new Date();
    const duration = Math.round((sessionEnd - sessionStartRef.current) / 1000);
    activityAPI.logEvent({
      course: enrollment.course,
      module: module.id,
      action_type: 'view',
      session_start: sessionStartRef.current.toISOString(),
      session_end: sessionEnd.toISOString(),
      duration_seconds: Math.max(duration, 1),
    }).catch(() => {});
    sessionStartRef.current = null;
    sessionCourseRef.current = null;
  };

  useEffect(() => {
    return () => { logCurrentSession(); };
  }, []);

  const handleOpenModule = async (module, enrollment) => {
    logCurrentSession();
    setSelectedModule(module);
    setSelectedCourse(enrollment);
    setSelected({});
    setSubmitResults({});
    setView('content');
    sessionStartRef.current = new Date();
    sessionCourseRef.current = { module, enrollment };

    const { data } = await testingAPI.tests(module.id);
    setTests(data.results || data);
  };

  const handleBackToCourses = () => {
    logCurrentSession();
    setView('courses');
  };

  const handleCompleteModule = async () => {
    if (!selectedModule) return;
    try {
      const { data } = await coursesAPI.completeModule(selectedModule.id);
      setCompletedModules(new Set(data.completed_module_ids));
      setEnrollments(prev => prev.map(e =>
        e.course === selectedCourse?.course
          ? { ...e, progress: data.progress }
          : e
      ));
      flash(data.progress === 100 ? '🎉 Курс завершён!' : 'Модуль завершён!', 'success');
    } catch {
      flash('Ошибка при завершении модуля', 'error');
    }
  };

  const toggleAnswer = (testId, questionId, answerId, isMultiple) => {
    setSelected(prev => {
      const testSel = { ...(prev[testId] || {}) };
      const qSel    = new Set(testSel[questionId] || []);
      if (isMultiple) {
        qSel.has(answerId) ? qSel.delete(answerId) : qSel.add(answerId);
      } else {
        qSel.clear();
        qSel.add(answerId);
      }
      testSel[questionId] = qSel;
      return { ...prev, [testId]: testSel };
    });
  };

  const handleSubmitTest = async (testId) => {
    const testSel = selected[testId] || {};
    const answerIds = Object.values(testSel).flatMap(set => [...set]);
    setSubmitting(testId);
    try {
      const { data } = await testingAPI.submitTest(testId, answerIds);
      setSubmitResults(prev => ({ ...prev, [testId]: data }));
      const r = await testingAPI.myResults();
      setMyResults(r.data.results || r.data);
    } catch {
      flash('Ошибка при отправке теста', 'error');
    } finally {
      setSubmitting(null);
    }
  };

  const getStoredResult = (testId) => myResults.find(r => r.test === testId);

  if (loading) return <div style={s.loading}>Загрузка курсов...</div>;

  return (
    <div>
      <div style={s.breadcrumb}>
        <span style={s.bcLink} onClick={handleBackToCourses}>📚 Мои курсы</span>
        {selectedCourse && (
          <><span style={s.bcSep}>›</span>
          <span style={s.bcLink} onClick={handleBackToCourses}>{selectedCourse.course_title}</span></>
        )}
        {selectedModule && (
          <><span style={s.bcSep}>›</span>
          <span style={s.bcCur}>{selectedModule.title}</span></>
        )}
      </div>

      {msg && (
        <div style={{ ...s.msgBox, background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#991b1b' : '#166534' }}>
          {msg.text}
        </div>
      )}

      {/* ── Список курсов ── */}
      {view === 'courses' && (
        <div>
          <h1 style={s.h1}>📚 Мои курсы</h1>
          <p style={s.sub}>Выберите курс чтобы начать обучение</p>

          {enrollments.length === 0 ? (
            <div style={s.emptyWrap}>
              <div style={s.emptyIcon}>📭</div>
              <div style={s.emptyTitle}>Курсов пока нет</div>
              <div style={s.emptyText}>Преподаватель ещё не записал вас ни на один курс.<br />Как только вас добавят — курсы появятся здесь.</div>
            </div>
          ) : (
            enrollments.map(enrollment => (
              <div key={enrollment.id} style={s.courseCard}>
                <h2 style={s.courseTitle}>{enrollment.course_title}</h2>
                <div style={s.progressWrap}>
                  <div style={s.progressBar}>
                    <div style={{ ...s.progressFill, width: `${enrollment.progress}%` }} />
                  </div>
                  <span style={s.progressText}>{enrollment.progress}% завершено</span>
                </div>
                <div style={s.modulesList}>
                  <div style={s.modulesLabel}>МОДУЛИ:</div>
                  {enrollment.course_modules?.length > 0 ? (
                    enrollment.course_modules.map((mod, i) => {
                      const done = completedModules.has(mod.id);
                      return (
                        <div key={mod.id} style={{ ...s.moduleItem, opacity: done ? 0.75 : 1 }} onClick={() => handleOpenModule(mod, enrollment)}>
                          <span style={{ ...s.moduleNum, background: done ? '#22c55e' : '#6366f1' }}>{done ? '✓' : i + 1}</span>
                          <span style={s.moduleTitle}>{mod.title}</span>
                          <span style={s.moduleArrow}>{done ? '✅' : '→'}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={s.noContent}>Модули ещё не добавлены преподавателем</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Контент модуля ── */}
      {view === 'content' && selectedModule && (
        <div>
          <h1 style={s.h1}>{selectedModule.title}</h1>
          <p style={s.sub}>Курс: {selectedCourse?.course_title}</p>

          {/* Учебный материал */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>📖 Учебный материал</h3>
            {selectedModule.content
              ? <div style={s.contentText}>{selectedModule.content}</div>
              : <div style={s.noContent}>Преподаватель ещё не добавил контент к этому модулю</div>}
          </div>

          {/* Тесты */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>✏️ Тесты</h3>
            {tests.length === 0
              ? <div style={s.noContent}>Тестов для этого модуля пока нет</div>
              : tests.map(test => <TestBlock
                  key={test.id}
                  test={test}
                  selected={selected[test.id] || {}}
                  storedResult={getStoredResult(test.id)}
                  freshResult={submitResults[test.id]}
                  submitting={submitting === test.id}
                  onToggle={(qId, aId, multi) => toggleAnswer(test.id, qId, aId, multi)}
                  onSubmit={() => handleSubmitTest(test.id)}
                />)
            }
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <button style={s.btnSecondary} onClick={handleBackToCourses}>← Вернуться к курсам</button>
            {selectedModule && !completedModules.has(selectedModule.id) ? (
              <button style={s.btnComplete} onClick={handleCompleteModule}>✅ Завершить модуль</button>
            ) : (
              <span style={s.completedBadge}>✅ Модуль завершён</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TestBlock({ test, selected, storedResult, freshResult, submitting, onToggle, onSubmit }) {
  const result = freshResult || (storedResult ? { score: storedResult.score, passed: storedResult.passed } : null);
  const questions = test.questions || [];
  const hasQuestions = questions.length > 0;

  const answeredAll = hasQuestions && questions.every(q => {
    const sel = selected[q.id];
    return sel && sel.size > 0;
  });

  return (
    <div style={s.testCard}>
      <div style={s.testHeader}>
        <div>
          <div style={s.testTitle}>{test.title}</div>
          <div style={s.testMeta}>Макс. балл: {test.max_score} · Проходной: {test.passing_score}</div>
        </div>
        {result && (
          <div style={{ ...s.resultBadge, background: result.passed ? '#dcfce7' : '#fee2e2', color: result.passed ? '#166534' : '#991b1b' }}>
            {result.passed ? '✅ Пройден' : '❌ Не пройден'} — {result.score} баллов
            {freshResult && <span style={{ fontSize: 11, display: 'block', marginTop: 2 }}>{freshResult.correct} из {freshResult.total} правильно</span>}
          </div>
        )}
      </div>

      {!result && !hasQuestions && (
        <div style={s.noContent}>Вопросы ещё не добавлены преподавателем</div>
      )}

      {!result && hasQuestions && (
        <div>
          {questions.map((q, qi) => {
            const isMultiple = q.question_type === 'multiple';
            const qSel = selected[q.id] || new Set();
            return (
              <div key={q.id} style={s.questionBlock}>
                <div style={s.questionText}>
                  <span style={s.qNum}>{qi + 1}</span>
                  {q.text}
                  {isMultiple && <span style={s.qHint}> (несколько вариантов)</span>}
                </div>
                <div style={s.answers}>
                  {q.answers.map(a => {
                    const checked = qSel.has(a.id);
                    return (
                      <label key={a.id} style={{ ...s.answerLabel, background: checked ? '#ede9fe' : '#f8fafc', borderColor: checked ? '#6366f1' : '#e2e8f0' }}>
                        <input
                          type={isMultiple ? 'checkbox' : 'radio'}
                          name={`q_${q.id}`}
                          checked={checked}
                          onChange={() => onToggle(q.id, a.id, isMultiple)}
                          style={{ marginRight: 10, accentColor: '#6366f1' }}
                        />
                        {a.text}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <button
            style={{ ...s.btnPrimary, opacity: answeredAll ? 1 : 0.5 }}
            onClick={onSubmit}
            disabled={!answeredAll || submitting}
          >
            {submitting ? 'Проверка...' : 'Сдать тест'}
          </button>
          {!answeredAll && <span style={s.hint}>Ответьте на все вопросы</span>}
        </div>
      )}
    </div>
  );
}

const s = {
  loading:      { padding: 40, textAlign: 'center', color: '#64748b' },
  breadcrumb:   { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 14 },
  bcLink:       { color: '#6366f1', cursor: 'pointer', fontWeight: 500 },
  bcSep:        { color: '#94a3b8' },
  bcCur:        { color: '#1e293b', fontWeight: 600 },
  h1:           { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub:          { color: '#64748b', marginBottom: 24 },
  msgBox:       { padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  emptyWrap:    { background: '#fff', borderRadius: 12, padding: '48px 32px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8 },
  emptyText:    { fontSize: 14, color: '#94a3b8', lineHeight: 1.7 },
  courseCard:   { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  courseTitle:  { fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  progressBar:  { flex: 1, maxWidth: 300, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#6366f1', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' },
  modulesList:  { borderTop: '1px solid #f1f5f9', paddingTop: 16 },
  modulesLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 8 },
  moduleItem:   { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: '#f8fafc' },
  moduleNum:    { width: 28, height: 28, background: '#6366f1', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  moduleTitle:  { flex: 1, fontSize: 14, fontWeight: 500, color: '#1e293b' },
  moduleArrow:  { color: '#6366f1', fontWeight: 700 },
  card:         { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle:    { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' },
  contentText:  { fontSize: 15, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  noContent:    { fontSize: 14, color: '#94a3b8', padding: '4px 0' },
  testCard:     { background: '#f8fafc', borderRadius: 10, padding: 20, marginBottom: 12, border: '1px solid #e2e8f0' },
  testHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  testTitle:    { fontSize: 15, fontWeight: 700, color: '#1e293b' },
  testMeta:     { fontSize: 12, color: '#64748b', marginTop: 4 },
  resultBadge:  { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: 'right' },
  questionBlock:{ marginBottom: 20 },
  questionText: { display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 10 },
  qNum:         { minWidth: 26, height: 26, background: '#6366f1', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  qHint:        { fontSize: 12, color: '#94a3b8', fontWeight: 400 },
  answers:      { display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 36 },
  answerLabel:  { display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 14, color: '#374151', transition: 'all 0.1s' },
  btnPrimary:   { padding: '11px 28px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  btnSecondary: { padding: '10px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnComplete: { padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  completedBadge: { fontSize: 14, color: '#22c55e', fontWeight: 600 },
  hint:         { fontSize: 12, color: '#94a3b8', marginLeft: 12 },
};
