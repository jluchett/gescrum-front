import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos timeout
});

// Interceptor para logging de requests
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.response?.status} ${error.config?.url}:`, error.response?.data);
    return Promise.reject(error);
  }
);


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
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, commentData) => api.post(`/tasks/${id}/comments`, commentData),
};

// Team API
export const teamAPI = {
  getAll: () => api.get('/team'),
  create: (memberData) => api.post('/team', memberData),
};

export default api;