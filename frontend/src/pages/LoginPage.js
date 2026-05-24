import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎓 EduPlatform</h1>
        <p style={styles.subtitle}>Веб-платформа для онлайн-обучения</p>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="student@example.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Пароль</label>
            <input
              type="password"
              style={styles.input}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p style={styles.registerLink}>
          Нет аккаунта?{' '}
          <Link to="/register" style={styles.link}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '48px 40px',
    width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  title: { margin: 0, fontSize: 28, color: '#1e293b', textAlign: 'center' },
  subtitle: { color: '#64748b', textAlign: 'center', marginBottom: 32 },
  field: { marginBottom: 20 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #d1d5db', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s'
  },
  error: { color: '#ef4444', fontSize: 14, marginBottom: 12 },
  btn: {
    width: '100%', padding: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 16,
    fontWeight: 600, cursor: 'pointer', marginTop: 8
  },
  registerLink: { textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 20, marginBottom: 0 },
  link: { color: '#6366f1', fontWeight: 600, textDecoration: 'none' },
};
