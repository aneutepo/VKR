import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../../api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    analyticsAPI.getSettings().then(({ data }) => {
      setSettings(data);
      setForm(data);
    });
  }, []);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await analyticsAPI.updateSettings({
        n_clusters: +form.n_clusters,
        min_silhouette_threshold: +form.min_silhouette_threshold,
        recalculation_interval_days: +form.recalculation_interval_days,
        min_students_for_clustering: +form.min_students_for_clustering,
      });
      setSettings(data);
      setForm(data);
      flash('Настройки сохранены');
    } catch {
      flash('Ошибка при сохранении', 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (!settings) return <div style={s.loading}>Загрузка...</div>;

  return (
    <div>
      <h1 style={s.h1}>⚙️ Настройки алгоритмов</h1>
      <p style={s.sub}>Параметры модуля интеллектуального анализа и кластеризации студентов</p>

      {msg && (
        <div style={{ ...s.msg, background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#991b1b' : '#166534' }}>
          {msg.text}
        </div>
      )}

      <div style={s.card}>
        <h3 style={s.cardTitle}>🧠 Параметры кластеризации (GKA + метод Уорда)</h3>
        <form onSubmit={handleSave}>
          <div style={s.grid}>
            <Field
              label="Количество кластеров (k)"
              hint="Число поведенческих групп. Рекомендуется 3 (Проактивный, Средний, Апатичный)"
              type="number" min={2} max={6}
              value={form.n_clusters}
              onChange={set('n_clusters')}
            />
            <Field
              label="Минимальный силуэтный коэффициент"
              hint="Порог качества кластеризации (0–1). Ниже этого значения результат считается ненадёжным"
              type="number" min={0} max={1} step={0.05}
              value={form.min_silhouette_threshold}
              onChange={set('min_silhouette_threshold')}
            />
            <Field
              label="Интервал пересчёта кластеров (дней)"
              hint="Как часто рекомендуется запускать повторную кластеризацию"
              type="number" min={1} max={90}
              value={form.recalculation_interval_days}
              onChange={set('recalculation_interval_days')}
            />
            <Field
              label="Минимум студентов для анализа"
              hint="Минимальное количество студентов с метриками для запуска кластеризации"
              type="number" min={2} max={20}
              value={form.min_students_for_clustering}
              onChange={set('min_students_for_clustering')}
            />
          </div>

          <div style={s.infoBox}>
            <strong>Текущий алгоритм:</strong> гибридный GKA + метод Уорда.<br />
            GKA (генетический алгоритм) инициализирует оптимальные центроиды, метод Уорда
            проводит иерархическую кластеризацию. Лучший результат по силуэтному коэффициенту
            выбирается автоматически.
          </div>

          <div style={s.footer}>
            {settings.updated_at && (
              <span style={s.updated}>
                Последнее изменение: {new Date(settings.updated_at).toLocaleString('ru')}
              </span>
            )}
            <button type="submit" style={s.btn} disabled={saving}>
              {saving ? 'Сохранение...' : '💾 Сохранить настройки'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, value, onChange, ...inputProps }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input style={s.input} value={value} onChange={onChange} {...inputProps} />
      {hint && <div style={s.hint}>{hint}</div>}
    </div>
  );
}

const s = {
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  h1: { fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub: { color: '#64748b', marginBottom: 24 },
  msg: { padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  card: { background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 24px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 15 },
  hint: { fontSize: 12, color: '#94a3b8', lineHeight: 1.5 },
  infoBox: {
    background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 8,
    padding: '14px 16px', fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 24,
  },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  updated: { fontSize: 12, color: '#94a3b8' },
  btn: {
    padding: '11px 28px', background: '#6366f1', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
};
