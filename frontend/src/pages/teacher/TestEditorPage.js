import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testingAPI } from '../../api';

export default function TestEditorPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Редактирование заголовка теста
  const [testForm, setTestForm] = useState({ title: '', max_score: 100, passing_score: 60 });
  const [testFormDirty, setTestFormDirty] = useState(false);

  // Новый вопрос
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ text: '', question_type: 'single' });

  // Новый ответ: { [questionId]: { text, is_correct } }
  const [answerForms, setAnswerForms] = useState({});
  const [showAnswerForm, setShowAnswerForm] = useState(null); // question id

  const [msg, setMsg] = useState(null);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = useCallback(() => {
    testingAPI.getTest(testId).then(({ data }) => {
      setTest(data);
      setTestForm({ title: data.title, max_score: data.max_score, passing_score: data.passing_score });
    }).finally(() => setLoading(false));
  }, [testId]);

  useEffect(() => { load(); }, [load]);

  // ── Тест ──────────────────────────────────────────────────────────────────
  const saveTestInfo = async () => {
    setSaving(true);
    try {
      await testingAPI.updateTest(testId, testForm);
      setTestFormDirty(false);
      flash('Настройки теста сохранены');
      load();
    } catch {
      flash('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Вопросы ───────────────────────────────────────────────────────────────
  const addQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.text.trim()) return;
    try {
      await testingAPI.createQuestion(testId, {
        ...questionForm,
        order: test.questions.length,
      });
      setQuestionForm({ text: '', question_type: 'single' });
      setShowQuestionForm(false);
      load();
    } catch {
      flash('Ошибка при добавлении вопроса', 'error');
    }
  };

  const deleteQuestion = async (qId) => {
    if (!window.confirm('Удалить вопрос и все его ответы?')) return;
    try {
      await testingAPI.deleteQuestion(qId);
      load();
    } catch {
      flash('Ошибка удаления', 'error');
    }
  };

  const toggleQuestionType = async (q) => {
    const newType = q.question_type === 'single' ? 'multiple' : 'single';
    await testingAPI.updateQuestion(q.id, { question_type: newType });
    load();
  };

  // ── Ответы ────────────────────────────────────────────────────────────────
  const addAnswer = async (e, questionId) => {
    e.preventDefault();
    const form = answerForms[questionId] || { text: '', is_correct: false };
    if (!form.text.trim()) return;
    try {
      await testingAPI.createAnswer(questionId, form);
      setAnswerForms(prev => ({ ...prev, [questionId]: { text: '', is_correct: false } }));
      setShowAnswerForm(null);
      load();
    } catch {
      flash('Ошибка при добавлении ответа', 'error');
    }
  };

  const toggleCorrect = async (answer) => {
    await testingAPI.updateAnswer(answer.id, { is_correct: !answer.is_correct });
    load();
  };

  const deleteAnswer = async (aId) => {
    await testingAPI.deleteAnswer(aId);
    load();
  };

  if (loading) return <div style={s.loading}>Загрузка теста...</div>;
  if (!test) return <div style={s.loading}>Тест не найден</div>;

  const questions = test.questions || [];

  return (
    <div>
      {/* Шапка */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>← Назад к курсам</button>
        <div style={s.breadcrumb}>Редактор теста</div>
      </div>

      {msg && (
        <div style={{ ...s.msg, background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#991b1b' : '#166534' }}>
          {msg.text}
        </div>
      )}

      {/* Настройки теста */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>Настройки теста</h2>
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Название теста</label>
            <input style={s.input} value={testForm.title}
              onChange={e => { setTestForm({ ...testForm, title: e.target.value }); setTestFormDirty(true); }} />
          </div>
          <div style={{ ...s.field, maxWidth: 160 }}>
            <label style={s.label}>Макс. балл</label>
            <input type="number" style={s.input} value={testForm.max_score}
              onChange={e => { setTestForm({ ...testForm, max_score: +e.target.value }); setTestFormDirty(true); }} />
          </div>
          <div style={{ ...s.field, maxWidth: 160 }}>
            <label style={s.label}>Проходной балл</label>
            <input type="number" style={s.input} value={testForm.passing_score}
              onChange={e => { setTestForm({ ...testForm, passing_score: +e.target.value }); setTestFormDirty(true); }} />
          </div>
        </div>
        {testFormDirty && (
          <button style={s.btnPrimary} onClick={saveTestInfo} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        )}
      </div>

      {/* Вопросы */}
      <div style={s.sectionHeader}>
        <h2 style={s.h2}>Вопросы <span style={s.count}>({questions.length})</span></h2>
        <button style={s.btnPrimary} onClick={() => setShowQuestionForm(v => !v)}>
          {showQuestionForm ? 'Отмена' : '+ Добавить вопрос'}
        </button>
      </div>

      {showQuestionForm && (
        <div style={s.card}>
          <form onSubmit={addQuestion}>
            <div style={s.field}>
              <label style={s.label}>Текст вопроса *</label>
              <textarea style={{ ...s.input, height: 80, resize: 'vertical' }}
                value={questionForm.text} placeholder="Введите текст вопроса..."
                onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })}
                required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Тип вопроса</label>
              <select style={{ ...s.input, maxWidth: 280 }} value={questionForm.question_type}
                onChange={e => setQuestionForm({ ...questionForm, question_type: e.target.value })}>
                <option value="single">Один правильный ответ</option>
                <option value="multiple">Несколько правильных ответов</option>
              </select>
            </div>
            <div style={s.btnRow}>
              <button type="submit" style={s.btnPrimary}>Добавить вопрос</button>
              <button type="button" style={s.btnSecondary} onClick={() => setShowQuestionForm(false)}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      {questions.length === 0 && !showQuestionForm && (
        <div style={s.empty}>Вопросов пока нет — добавьте первый</div>
      )}

      {questions.map((q, qi) => (
        <div key={q.id} style={s.questionCard}>
          {/* Заголовок вопроса */}
          <div style={s.questionHeader}>
            <div style={s.questionLeft}>
              <span style={s.qNum}>{qi + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={s.questionText}>{q.text}</div>
                <button style={s.typeToggle} onClick={() => toggleQuestionType(q)}>
                  {q.question_type === 'single' ? '◉ Один ответ' : '☑ Несколько ответов'}
                </button>
              </div>
            </div>
            <button style={s.deleteBtn} onClick={() => deleteQuestion(q.id)} title="Удалить вопрос">✕</button>
          </div>

          {/* Ответы */}
          <div style={s.answersBlock}>
            {q.answers.length === 0 && (
              <div style={s.noAnswers}>Нет вариантов ответа</div>
            )}
            {q.answers.map(a => (
              <div key={a.id} style={{ ...s.answerRow, background: a.is_correct ? '#f0fdf4' : '#fff' }}>
                <button
                  style={{ ...s.correctToggle, color: a.is_correct ? '#16a34a' : '#cbd5e1' }}
                  onClick={() => toggleCorrect(a)}
                  title={a.is_correct ? 'Правильный (нажмите чтобы сбросить)' : 'Отметить как правильный'}
                >
                  {q.question_type === 'single' ? (a.is_correct ? '◉' : '○') : (a.is_correct ? '☑' : '☐')}
                </button>
                <span style={{ ...s.answerText, color: a.is_correct ? '#15803d' : '#374151' }}>{a.text}</span>
                <button style={s.answerDeleteBtn} onClick={() => deleteAnswer(a.id)} title="Удалить ответ">✕</button>
              </div>
            ))}

            {/* Форма добавления ответа */}
            {showAnswerForm === q.id ? (
              <form style={s.answerForm} onSubmit={e => addAnswer(e, q.id)}>
                <input
                  style={{ ...s.input, flex: 1 }}
                  placeholder="Текст варианта ответа..."
                  value={answerForms[q.id]?.text || ''}
                  onChange={e => setAnswerForms(prev => ({ ...prev, [q.id]: { ...prev[q.id], text: e.target.value, is_correct: prev[q.id]?.is_correct || false } }))}
                  autoFocus
                  required
                />
                <label style={s.correctLabel}>
                  <input type="checkbox"
                    checked={answerForms[q.id]?.is_correct || false}
                    onChange={e => setAnswerForms(prev => ({ ...prev, [q.id]: { ...prev[q.id], is_correct: e.target.checked } }))}
                  />
                  Правильный
                </label>
                <button type="submit" style={s.btnSmall}>Добавить</button>
                <button type="button" style={s.btnSecondarySmall} onClick={() => setShowAnswerForm(null)}>✕</button>
              </form>
            ) : (
              <button style={s.addAnswerBtn} onClick={() => { setShowAnswerForm(q.id); setAnswerForms(prev => ({ ...prev, [q.id]: { text: '', is_correct: false } })); }}>
                + Добавить вариант ответа
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Итог */}
      {questions.length > 0 && (
        <div style={s.summary}>
          <span>Итого: <b>{questions.length}</b> вопр.</span>
          <span style={{ margin: '0 12px', color: '#cbd5e1' }}>|</span>
          <span>Макс. балл: <b>{test.max_score}</b></span>
          <span style={{ margin: '0 12px', color: '#cbd5e1' }}>|</span>
          <span>Проходной: <b>{test.passing_score}</b></span>
        </div>
      )}
    </div>
  );
}

const s = {
  loading: { padding: 48, textAlign: 'center', color: '#94a3b8' },
  topBar: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { background: 'none', border: 'none', color: '#6366f1', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '6px 0' },
  breadcrumb: { fontSize: 14, color: '#94a3b8' },
  msg: { padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  card: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#1e293b' },
  row: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 8 },
  btnPrimary: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnSmall: { padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSecondarySmall: { padding: '8px 10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h2: { fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 },
  count: { fontSize: 16, color: '#94a3b8', fontWeight: 400 },
  empty: { background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94a3b8', marginBottom: 16 },
  questionCard: { background: '#fff', borderRadius: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' },
  questionHeader: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  questionLeft: { display: 'flex', gap: 12, flex: 1 },
  qNum: { width: 28, height: 28, background: '#6366f1', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 },
  questionText: { fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 6, lineHeight: 1.4 },
  typeToggle: { background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '3px 10px' },
  deleteBtn: { background: 'none', border: 'none', color: '#cbd5e1', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0, lineHeight: 1 },
  answersBlock: { padding: '12px 20px 16px' },
  noAnswers: { fontSize: 13, color: '#94a3b8', padding: '8px 0' },
  answerRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 6, border: '1px solid #f1f5f9' },
  correctToggle: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: 0 },
  answerText: { flex: 1, fontSize: 14 },
  answerDeleteBtn: { background: 'none', border: 'none', color: '#cbd5e1', fontSize: 15, cursor: 'pointer', padding: '0 2px', flexShrink: 0 },
  answerForm: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, background: '#f8fafc', padding: '10px 12px', borderRadius: 8 },
  correctLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', whiteSpace: 'nowrap', cursor: 'pointer' },
  addAnswerBtn: { background: 'none', border: '1.5px dashed #d1d5db', borderRadius: 8, color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '8px 16px', marginTop: 8, width: '100%' },
  summary: { background: '#fff', borderRadius: 12, padding: '16px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', marginTop: 8 },
};
