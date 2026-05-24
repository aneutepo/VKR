import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await authAPI.register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const data = err.response?.data || {};
      if (typeof data === 'object') setErrors(data);
      else setErrors({ non_field_errors: ['Ошибка сервера. Попробуйте ещё раз.'] });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={s.container}>
        <div style={s.card}>
          <div style={s.successIcon}>✅</div>
          <h2 style={s.successTitle}>Регистрация прошла успешно!</h2>
          <p style={s.successText}>Перенаправляем на страницу входа...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <span style={s.logo}>🎓</span>
          <h1 style={s.title}>EduPlatform</h1>
        </div>
        <h2 style={s.subtitle}>Создайте аккаунт</h2>

        <form onSubmit={handleSubmit}>
          <div style={s.row}>
            <Field label="Имя" error={errors.first_name?.[0]}>
              <input style={s.input} value={form.first_name} onChange={set('first_name')}
                placeholder="Иван" required />
            </Field>
            <Field label="Фамилия" error={errors.last_name?.[0]}>
              <input style={s.input} value={form.last_name} onChange={set('last_name')}
                placeholder="Иванов" required />
            </Field>
          </div>
          <Field label="Email" error={errors.email?.[0]}>
            <input style={s.input} type="email" value={form.email} onChange={set('email')}
              placeholder="ivan@example.com" required />
          </Field>
          <Field label="Пароль" error={errors.password?.[0]}>
            <input style={s.input} type="password" value={form.password} onChange={set('password')}
              placeholder="Минимум 8 символов" required minLength={8} />
          </Field>
          <Field label="Подтверждение пароля" error={errors.password_confirm?.[0]}>
            <input style={s.input} type="password" value={form.password_confirm} onChange={set('password_confirm')}
              placeholder="Повторите пароль" required />
          </Field>

          {errors.non_field_errors && (
            <p style={s.error}>{errors.non_field_errors[0]}</p>
          )}

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p style={s.loginLink}>
          Уже есть аккаунт? <Link to="/login" style={s.link}>Войти</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}

const s = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '24px 16px',
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '40px 36px',
    width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  logoWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 },
  logo: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 },
  subtitle: { textAlign: 'center', fontSize: 15, color: '#64748b', margin: '4px 0 24px', fontWeight: 400 },
  row: { display: 'flex', gap: 12 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  error: { color: '#ef4444', fontSize: 13, margin: '0 0 12px' },
  btn: {
    width: '100%', padding: '12px', marginTop: 8,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 15,
    fontWeight: 600, cursor: 'pointer',
  },
  loginLink: { textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 20, marginBottom: 0 },
  link: { color: '#6366f1', fontWeight: 600, textDecoration: 'none' },
  successIcon: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  successTitle: { textAlign: 'center', color: '#166534', fontSize: 20, fontWeight: 700, margin: '0 0 8px' },
  successText: { textAlign: 'center', color: '#64748b', margin: 0 },
};
