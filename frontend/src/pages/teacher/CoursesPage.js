import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI, testingAPI } from '../../api';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(null);
  const [showTestForm, setShowTestForm] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [editingModule, setEditingModule] = useState(null); // { id, title, description, content, order }
  const [courseForm, setCourseForm] = useState({ title: '', description: '', status: 'draft' });
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', content: '', order: 0 });
  const [testForm, setTestForm] = useState({ title: '', max_score: 100, passing_score: 60 });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const load = () => {
    setLoading(true);
    coursesAPI.list()
      .then(({ data }) => setCourses(data.results || data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.create(courseForm);
      showMsg('Курс создан!');
      setCourseForm({ title: '', description: '', status: 'draft' });
      setShowCourseForm(false);
      load();
    } catch {
      showMsg('Ошибка при создании курса', 'error');
    }
  };

  const handleCreateModule = async (e, courseId) => {
    e.preventDefault();
    try {
      await coursesAPI.createModule(courseId, moduleForm);
      showMsg('Модуль добавлен!');
      setModuleForm({ title: '', description: '', content: '', order: 0 });
      setShowModuleForm(null);
      load();
    } catch {
      showMsg('Ошибка при создании модуля', 'error');
    }
  };

  const handleCreateTest = async (e, moduleId) => {
    e.preventDefault();
    try {
      const { data } = await testingAPI.createTest({ ...testForm, module: moduleId });
      setTestForm({ title: '', max_score: 100, passing_score: 60 });
      setShowTestForm(null);
      navigate(`/teacher/tests/${data.id}`);
    } catch {
      showMsg('Ошибка при создании теста', 'error');
    }
  };

  const handleDeleteModule = async (moduleId, moduleTitle) => {
    if (!window.confirm(`Удалить модуль «${moduleTitle}»?\n\nВсе тесты модуля будут удалены.`)) return;
    try {
      await coursesAPI.deleteModule(moduleId);
      showMsg('Модуль удалён');
      load();
    } catch {
      showMsg('Ошибка при удалении модуля', 'error');
    }
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.updateModule(editingModule.id, {
        title: editingModule.title,
        description: editingModule.description,
        content: editingModule.content,
        order: editingModule.order,
      });
      showMsg('Модуль сохранён');
      setEditingModule(null);
      load();
    } catch {
      showMsg('Ошибка при сохранении модуля', 'error');
    }
  };

  const handleDeleteTest = async (testId, testTitle) => {
    if (!window.confirm(`Удалить тест «${testTitle}»? Все вопросы и результаты студентов будут удалены.`)) return;
    try {
      await testingAPI.deleteTest(testId);
      showMsg('Тест удалён');
      load();
    } catch {
      showMsg('Ошибка при удалении теста', 'error');
    }
  };

  const handlePublish = async (course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    await coursesAPI.update(course.id, { status: newStatus });
    load();
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Удалить курс «${course.title}»?\n\nБудут удалены все модули, тесты и записи студентов.`)) return;
    try {
      await coursesAPI.delete(course.id);
      showMsg('Курс удалён');
      load();
    } catch {
      showMsg('Ошибка при удалении курса', 'error');
    }
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>📚 Курсы</h1>
          <p style={s.sub}>Управление курсами, модулями и тестами</p>
        </div>
        <button style={s.btnPrimary} onClick={() => setShowCourseForm(!showCourseForm)}>
          + Создать курс
        </button>
      </div>

      {msg && (
        <div style={{ ...s.msgBox, background: msgType === 'error' ? '#fee2e2' : '#dcfce7', color: msgType === 'error' ? '#991b1b' : '#166534' }}>
          {msg}
        </div>
      )}

      {/* Форма создания курса */}
      {showCourseForm && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Новый курс</h3>
          <form onSubmit={handleCreateCourse}>
            <div style={s.formRow}>
              <div style={s.field}>
                <label style={s.label}>Название курса *</label>
                <input style={s.input} value={courseForm.title}
                  onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Например: Python для начинающих" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Статус</label>
                <select style={s.input} value={courseForm.status}
                  onChange={e => setCourseForm({ ...courseForm, status: e.target.value })}>
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликован</option>
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Описание</label>
              <textarea style={{ ...s.input, height: 80, resize: 'vertical' }}
                value={courseForm.description}
                onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Краткое описание курса..." />
            </div>
            <div style={s.btnRow}>
              <button type="submit" style={s.btnPrimary}>Создать</button>
              <button type="button" style={s.btnSecondary} onClick={() => setShowCourseForm(false)}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      {/* Список курсов */}
      {loading ? (
        <div style={s.empty}>Загрузка...</div>
      ) : courses.length === 0 ? (
        <div style={s.empty}>Курсов пока нет. Создайте первый!</div>
      ) : (
        courses.map(course => (
          <div key={course.id} style={s.courseCard}>
            {/* Заголовок курса */}
            <div style={s.courseHeader}>
              <div style={{ flex: 1 }}>
                <div style={s.courseTitle}
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  title="Нажмите чтобы раскрыть модули">
                  {expandedCourse === course.id ? '▼' : '▶'} {course.title}
                </div>
                <div style={s.courseMeta}>
                  <span style={{ ...s.badge, background: course.status === 'published' ? '#22c55e' : '#94a3b8' }}>
                    {course.status === 'published' ? 'Опубликован' : 'Черновик'}
                  </span>
                  <span style={s.metaText}>👥 Студентов: {course.enrolled_count}</span>
                  <span style={s.metaText}>📖 Модулей: {course.modules?.length || 0}</span>
                </div>
                {course.description && <p style={s.courseDesc}>{course.description}</p>}
              </div>
              <div style={s.btnRow}>
                <button style={s.btnSmall} onClick={() => handlePublish(course)}>
                  {course.status === 'published' ? 'Снять' : 'Опубликовать'}
                </button>
                <button style={s.btnSmallGreen}
                  onClick={() => setShowModuleForm(showModuleForm === course.id ? null : course.id)}>
                  + Модуль
                </button>
                <button style={s.btnSmallDanger} onClick={() => handleDeleteCourse(course)}>
                  Удалить курс
                </button>
              </div>
            </div>

            {/* Форма добавления модуля */}
            {showModuleForm === course.id && (
              <div style={s.subForm}>
                <h4 style={s.subFormTitle}>Добавить модуль</h4>
                <form onSubmit={e => handleCreateModule(e, course.id)}>
                  <div style={s.formRow}>
                    <div style={s.field}>
                      <label style={s.label}>Название модуля *</label>
                      <input style={s.input} value={moduleForm.title}
                        onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                        placeholder="Например: Введение в Python" required />
                    </div>
                    <div style={{ ...s.field, maxWidth: 100 }}>
                      <label style={s.label}>Порядок</label>
                      <input type="number" style={s.input} value={moduleForm.order}
                        onChange={e => setModuleForm({ ...moduleForm, order: +e.target.value })} />
                    </div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Учебный контент</label>
                    <textarea style={{ ...s.input, height: 100, resize: 'vertical' }}
                      value={moduleForm.content}
                      onChange={e => setModuleForm({ ...moduleForm, content: e.target.value })}
                      placeholder="Текст лекции, ссылки на материалы..." />
                  </div>
                  <div style={s.btnRow}>
                    <button type="submit" style={s.btnPrimary}>Добавить</button>
                    <button type="button" style={s.btnSecondary} onClick={() => setShowModuleForm(null)}>Отмена</button>
                  </div>
                </form>
              </div>
            )}

            {/* Модули курса */}
            {expandedCourse === course.id && course.modules?.length > 0 && (
              <div style={s.modulesList}>
                <div style={s.modulesTitle}>Модули курса:</div>
                {course.modules.map((m, i) => (
                  <div key={m.id} style={s.moduleItem}>
                    {/* Форма редактирования модуля */}
                    {editingModule?.id === m.id ? (
                      <form onSubmit={handleSaveModule}>
                        <div style={s.field}>
                          <label style={s.label}>Название *</label>
                          <input style={s.input} value={editingModule.title} required
                            onChange={e => setEditingModule({ ...editingModule, title: e.target.value })} />
                        </div>
                        <div style={s.field}>
                          <label style={s.label}>Описание</label>
                          <input style={s.input} value={editingModule.description}
                            onChange={e => setEditingModule({ ...editingModule, description: e.target.value })} />
                        </div>
                        <div style={s.field}>
                          <label style={s.label}>Учебный контент</label>
                          <textarea style={{ ...s.input, height: 100, resize: 'vertical' }} value={editingModule.content}
                            onChange={e => setEditingModule({ ...editingModule, content: e.target.value })} />
                        </div>
                        <div style={s.btnRow}>
                          <button type="submit" style={s.btnPrimary}>Сохранить</button>
                          <button type="button" style={s.btnSecondary} onClick={() => setEditingModule(null)}>Отмена</button>
                        </div>
                      </form>
                    ) : (
                    <div style={s.moduleHeader}>
                      <div style={s.moduleLeft}>
                        <span style={s.moduleNum}>{i + 1}</span>
                        <div>
                          <div style={s.moduleTitle}>{m.title}</div>
                          {m.description && <div style={s.moduleDesc}>{m.description}</div>}
                        </div>
                      </div>
                      <div style={s.btnRow}>
                        <button style={s.btnSmallPurple}
                          onClick={() => setShowTestForm(showTestForm === m.id ? null : m.id)}>
                          + Тест
                        </button>
                        <button style={s.btnSmall}
                          onClick={() => { setEditingModule({ id: m.id, title: m.title, description: m.description || '', content: m.content || '', order: m.order }); setShowTestForm(null); }}>
                          Изменить
                        </button>
                        <button style={s.btnSmallDanger} onClick={() => handleDeleteModule(m.id, m.title)}>
                          Удалить
                        </button>
                      </div>
                    </div>
                    )}

                    {/* Тесты и форма — только когда не редактируем */}
                    {editingModule?.id !== m.id && <>
                    {/* Существующие тесты */}
                    {m.tests && m.tests.length > 0 && (
                      <div style={s.testsBlock}>
                        {m.tests.map(t => (
                          <div key={t.id} style={s.testRow}>
                            <span style={s.testIcon}>📝</span>
                            <div style={s.testInfo}>
                              <span style={s.testTitle}>{t.title}</span>
                              <span style={s.testMeta}>{t.question_count} вопр. · макс. {t.max_score} · порог {t.passing_score}</span>
                            </div>
                            <button style={s.btnSmallPurple} onClick={() => navigate(`/teacher/tests/${t.id}`)}>
                              Редактировать
                            </button>
                            <button style={s.btnSmallDanger} onClick={() => handleDeleteTest(t.id, t.title)}>
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Форма создания теста */}
                    {showTestForm === m.id && (
                      <div style={s.testForm}>
                        <h4 style={s.subFormTitle}>Новый тест для модуля «{m.title}»</h4>
                        <form onSubmit={e => handleCreateTest(e, m.id)}>
                          <div style={s.field}>
                            <label style={s.label}>Название теста *</label>
                            <input style={s.input} value={testForm.title}
                              onChange={e => setTestForm({ ...testForm, title: e.target.value })}
                              placeholder="Например: Контрольный тест по теме 1" required />
                          </div>
                          <div style={s.formRow}>
                            <div style={s.field}>
                              <label style={s.label}>Максимальный балл</label>
                              <input type="number" style={s.input} value={testForm.max_score}
                                onChange={e => setTestForm({ ...testForm, max_score: +e.target.value })} />
                            </div>
                            <div style={s.field}>
                              <label style={s.label}>Проходной балл</label>
                              <input type="number" style={s.input} value={testForm.passing_score}
                                onChange={e => setTestForm({ ...testForm, passing_score: +e.target.value })} />
                            </div>
                          </div>
                          <div style={s.btnRow}>
                            <button type="submit" style={s.btnPrimary}>Создать и добавить вопросы →</button>
                            <button type="button" style={s.btnSecondary} onClick={() => setShowTestForm(null)}>Отмена</button>
                          </div>
                        </form>
                      </div>
                    )}
                    </>}
                  </div>
                ))}
              </div>
            )}

            {expandedCourse === course.id && (!course.modules || course.modules.length === 0) && (
              <div style={s.noModules}>Модулей пока нет — добавьте первый</div>
            )}
          </div>
        ))
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
  btnRow: { display: 'flex', gap: 8, alignItems: 'center' },
  btnPrimary: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnSmall: { padding: '6px 12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSmallGreen: { padding: '6px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSmallPurple: { padding: '5px 12px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSmallDanger: { padding: '5px 12px', background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' },
  empty: { background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', color: '#94a3b8' },
  courseCard: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  courseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  courseTitle: { fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8, cursor: 'pointer' },
  courseMeta: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  badge: { padding: '3px 10px', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 600 },
  metaText: { fontSize: 13, color: '#64748b' },
  courseDesc: { fontSize: 14, color: '#64748b', margin: '8px 0 0' },
  subForm: { background: '#f8fafc', borderRadius: 8, padding: 16, marginTop: 16, borderLeft: '3px solid #6366f1' },
  subFormTitle: { margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' },
  modulesList: { marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 12 },
  modulesTitle: { fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  moduleItem: { marginBottom: 12, background: '#f8fafc', borderRadius: 8, padding: 12 },
  moduleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  moduleLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  moduleNum: { width: 28, height: 28, background: '#6366f1', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  moduleTitle: { fontSize: 14, fontWeight: 600, color: '#1e293b' },
  moduleDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  testsBlock: { marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  testRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff' },
  testIcon: { fontSize: 16, flexShrink: 0 },
  testInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  testTitle: { fontSize: 13, fontWeight: 600, color: '#1e293b' },
  testMeta: { fontSize: 11, color: '#94a3b8' },
  testForm: { background: '#fff', borderRadius: 8, padding: 14, marginTop: 10, border: '1px solid #e2e8f0' },
  noModules: { marginTop: 12, padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 },
};