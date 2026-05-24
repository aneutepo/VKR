import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Автоматически добавляем JWT-токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Автоматически обновляем токен при истечении (401)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/token/', { email, password }),
  me: () => api.get('/users/me/'),
  updateProfile: (data) => api.patch('/users/me/', data),
  changePassword: (data) => api.post('/users/me/change-password/', data),
  register: (data) => api.post('/users/register/', data),
};

// Users (Admin)
export const usersAPI = {
  list: (params) => api.get('/users/', { params }),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  students: () => api.get('/users/students/'),
  resetPassword: (id) => api.post(`/users/${id}/reset-password/`),
};

// Courses
export const coursesAPI = {
  list: () => api.get('/courses/'),
  get: (id) => api.get(`/courses/${id}/`),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.patch(`/courses/${id}/`, data),
  delete: (id) => api.delete(`/courses/${id}/`),
  myCourses: () => api.get('/courses/my/'),
  modules: (courseId) => api.get(`/courses/${courseId}/modules/`),
  createModule: (courseId, data) => api.post(`/courses/${courseId}/modules/`, data),
  updateModule: (id, data) => api.patch(`/courses/modules/${id}/`, data),
  deleteModule: (id) => api.delete(`/courses/modules/${id}/`),
  enrollments: (params) => api.get('/courses/enrollments/', { params }),
  enroll: (data) => api.post('/courses/enrollments/', data),
  myCompletions: () => api.get('/courses/completions/'),
  completeModule: (moduleId) => api.post(`/courses/modules/${moduleId}/complete/`),
};

// Notifications
export const notificationsAPI = {
  list: () => api.get('/notifications/'),
  unreadCount: () => api.get('/notifications/unread-count/'),
  markRead: (id) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
};

// Activity
export const activityAPI = {
  logEvent: (data) => api.post('/activity/log/', data),
  metrics: (params) => api.get('/activity/metrics/', { params }),
  myMetrics: () => api.get('/activity/my-metrics/'),
};

// Analytics
export const analyticsAPI = {
  runClustering: (courseId, nClusters = 3) =>
    api.post('/analytics/cluster/', { course_id: courseId, n_clusters: nClusters }),
  latest: (courseId) => api.get('/analytics/latest/', { params: { course_id: courseId } }),
  history: (courseId) => api.get('/analytics/history/', { params: { course_id: courseId } }),
  distribution: (courseId) =>
    api.get('/analytics/distribution/', { params: { course_id: courseId } }),
  getSettings: () => api.get('/analytics/settings/'),
  updateSettings: (data) => api.patch('/analytics/settings/', data),
  exportUrl: (courseId) => `${API_URL}/analytics/export/?course_id=${courseId}`,
};

// Testing
export const testingAPI = {
  tests: (moduleId) => api.get('/testing/tests/', { params: { module: moduleId } }),
  getTest: (id) => api.get(`/testing/tests/${id}/`),
  createTest: (data) => api.post('/testing/tests/', data),
  updateTest: (id, data) => api.patch(`/testing/tests/${id}/`, data),
  deleteTest: (id) => api.delete(`/testing/tests/${id}/`),

  questions: (testId) => api.get(`/testing/tests/${testId}/questions/`),
  createQuestion: (testId, data) => api.post(`/testing/tests/${testId}/questions/`, data),
  updateQuestion: (id, data) => api.patch(`/testing/questions/${id}/`, data),
  deleteQuestion: (id) => api.delete(`/testing/questions/${id}/`),

  answers: (questionId) => api.get(`/testing/questions/${questionId}/answers/`),
  createAnswer: (questionId, data) => api.post(`/testing/questions/${questionId}/answers/`, data),
  updateAnswer: (id, data) => api.patch(`/testing/answers/${id}/`, data),
  deleteAnswer: (id) => api.delete(`/testing/answers/${id}/`),

  submitTest: (testId, answers) => api.post(`/testing/tests/${testId}/submit/`, { answers }),
  myResults: () => api.get('/testing/results/'),
  courseResults: (courseId) => api.get('/testing/course-results/', { params: { course_id: courseId } }),
};