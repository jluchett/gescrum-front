import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sprints API
export const sprintsAPI = {
  getAll: () => api.get('/sprints'),
  getActive: () => api.get('/sprints/active'),
  create: (sprintData) => api.post('/sprints', sprintData),
  update: (id, sprintData) => api.patch(`/sprints/${id}`, sprintData),
};

// Tasks API
export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  getBySprint: (sprintId) => api.get(`/tasks/sprint/${sprintId}`),
  create: (taskData) => api.post('/tasks', taskData),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  addComment: (id, commentData) => api.post(`/tasks/${id}/comments`, commentData),
};

// Team API
export const teamAPI = {
  getAll: () => api.get('/team'),
  create: (memberData) => api.post('/team', memberData),
};

export default api;