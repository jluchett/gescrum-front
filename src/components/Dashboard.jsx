import React, { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { sprintsAPI, tasksAPI, teamAPI } from '../services/api';
import '../styles/Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Mover las funciones auxiliares fuera del componente
const calculateDaysPassed = (startDate) => {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateBurndownData = (sprint) => {
  // Simulación de datos de burndown (en un caso real vendría del backend)
  const totalPoints = sprint.plannedPoints;
  const remainingPoints = sprint.plannedPoints - sprint.completedPoints;
  const daysPassed = calculateDaysPassed(sprint.startDate);
  const totalDays = calculateTotalDays(sprint.startDate, sprint.endDate);
  
  const data = [];
  for (let i = 0; i <= 6; i++) {
    if (i <= daysPassed) {
      const progress = (i / totalDays) * totalPoints;
      data.push(Math.max(totalPoints - progress, remainingPoints));
    } else {
      data.push(null);
    }
  }
  return data;
};

const calculateIdealBurndown = (sprint) => {
  const totalPoints = sprint.plannedPoints;
  const totalDays = calculateTotalDays(sprint.startDate, sprint.endDate);
  
  return Array.from({ length: 7 }, (_, i) => {
    return Math.max(totalPoints - (totalPoints / totalDays) * i, 0);
  });
};

const getDaysRemaining = (endDate) => {
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    teamVelocity: 0,
    sprintProgress: 0
  });

  const [activeSprint, setActiveSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sprintsResponse, tasksResponse, teamResponse] = await Promise.all([
        sprintsAPI.getActive(),
        tasksAPI.getAll(),
        teamAPI.getAll()
      ]);

      setActiveSprint(sprintsResponse.data);
      setTasks(tasksResponse.data);
      setTeamMembers(teamResponse.data);
      
      calculateMetrics(sprintsResponse.data, tasksResponse.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (sprint, allTasks) => {
    const completedTasks = allTasks.filter(task => task.status === 'done').length;
    const inProgressTasks = allTasks.filter(task => 
      task.status === 'in-progress' || task.status === 'review' || task.status === 'testing'
    ).length;
    const pendingTasks = allTasks.filter(task => 
      task.status === 'todo' || task.status === 'backlog'
    ).length;

    const sprintProgress = sprint && sprint.plannedPoints > 0 ? 
      Math.round((sprint.completedPoints / sprint.plannedPoints) * 100) : 0;

    const totalStoryPoints = allTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedStoryPoints = allTasks
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const teamVelocity = teamMembers.reduce((sum, member) => sum + (member.capacity || 0), 0);

    setMetrics({
      totalTasks: allTasks.length,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      teamVelocity,
      sprintProgress,
      completedStoryPoints,
      totalStoryPoints
    });
  };

  // Burndown Chart Data
  const getBurndownData = () => {
    return {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [
        {
          label: 'Story Points Restantes',
          data: activeSprint ? calculateBurndownData(activeSprint) : [0, 0, 0, 0, 0, 0, 0],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Línea Ideal',
          data: activeSprint ? calculateIdealBurndown(activeSprint) : [0, 0, 0, 0, 0, 0, 0],
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          borderWidth: 1,
          fill: false,
          pointRadius: 0
        }
      ]
    };
  };

  // Task Distribution Chart
  const getTaskDistributionData = () => {
    return {
      labels: ['✅ Completadas', '⚡ En Progreso', '📋 Pendientes'],
      datasets: [
        {
          data: [metrics.completedTasks, metrics.inProgressTasks, metrics.pendingTasks],
          backgroundColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(249, 115, 22)'
          ],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 15
        }
      ]
    };
  };

  // Team Capacity Chart
  const getTeamCapacityData = () => {
    return {
      labels: teamMembers.map(member => member.name),
      datasets: [
        {
          label: 'Capacidad del Equipo',
          data: teamMembers.map(member => member.capacity),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 2
        }
      ]
    };
  };

  const criticalTasks = tasks
    .filter(task => task.priority === 'high' && task.status !== 'done')
    .slice(0, 5);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando datos del dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header with Project Info */}
      <div className="dashboard-header">
        <h1>🚀 Telegram JSF - Dashboard</h1>
        {activeSprint && (
          <div className="sprint-info-banner">
            <div className="sprint-name">{activeSprint.name}</div>
            <div className="sprint-dates">
              {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
            </div>
            <div className="sprint-days-left">
              {getDaysRemaining(activeSprint.endDate)} días restantes
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card primary">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{metrics.sprintProgress}%</div>
            <div className="card-label">Progreso del Sprint</div>
          </div>
        </div>

        <div className="summary-card success">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-value">{metrics.completedTasks}/{metrics.totalTasks}</div>
            <div className="card-label">Tareas Completadas</div>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <div className="card-value">{metrics.inProgressTasks}</div>
            <div className="card-label">En Progreso</div>
          </div>
        </div>

        <div className="summary-card info">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <div className="card-value">{metrics.teamVelocity}</div>
            <div className="card-label">Velocidad del Equipo</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-content">
        <div className="charts-section">
          <div className="chart-container large">
            <div className="chart-header">
              <h3>📈 Burndown Chart del Sprint</h3>
              {activeSprint && (
                <div className="chart-subtitle">
                  {activeSprint.completedPoints}/{activeSprint.plannedPoints} Story Points completados
                </div>
              )}
            </div>
            <Bar 
              data={getBurndownData()} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Story Points'
                    }
                  }
                }
              }} 
            />
          </div>

          <div className="charts-row">
            <div className="chart-container">
              <div className="chart-header">
                <h3>🎯 Distribución de Tareas</h3>
              </div>
              <Doughnut 
                data={getTaskDistributionData()} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }} 
              />
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <h3>👥 Capacidad del Equipo</h3>
              </div>
              <Bar 
                data={getTeamCapacityData()} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Story Points'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Sidebar with Critical Info */}
        <div className="dashboard-sidebar">
          <div className="sidebar-section critical-tasks">
            <h3>⚡ Tareas Críticas</h3>
            <div className="tasks-list">
              {criticalTasks.length > 0 ? (
                criticalTasks.map(task => (
                  <div key={task._id} className="critical-task-item">
                    <div className="task-main">
                      <span className="task-title">{task.title}</span>
                      <span className="task-points">{task.storyPoints} pts</span>
                    </div>
                    <div className="task-meta">
                      <span className="assignee">👤 {task.assignee}</span>
                      <span className={`status ${task.status}`}>
                        {task.status === 'in-progress' ? '⚡' : 
                         task.status === 'review' ? '🔍' : 
                         task.status === 'testing' ? '🧪' : '📋'}
                        {task.status}
                      </span>
                    </div>
                    {task.dueDate && (
                      <div className="task-due">
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-critical-tasks">
                  🎉 No hay tareas críticas pendientes
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-section team-overview">
            <h3>👥 Estado del Equipo</h3>
            <div className="team-list">
              {teamMembers.map(member => {
                const memberTasks = tasks.filter(task => task.assignee === member.name);
                const completedTasks = memberTasks.filter(task => task.status === 'done').length;
                
                return (
                  <div key={member._id} className="team-member-item">
                    <div className="member-avatar">
                      {member.role === 'scrum-master' ? '🎯' : 
                       member.role === 'developer' ? '💻' : '🧪'}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.name}</div>
                      <div className="member-role">{member.role}</div>
                    </div>
                    <div className="member-stats">
                      <div className="member-tasks">
                        {completedTasks}/{memberTasks.length} tareas
                      </div>
                      <div className="member-capacity">
                        {member.capacity} pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {activeSprint && (
            <div className="sidebar-section sprint-metrics">
              <h3>🎯 Métricas del Sprint</h3>
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-value">{activeSprint.completedPoints}</div>
                  <div className="metric-label">Points Completados</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{activeSprint.plannedPoints}</div>
                  <div className="metric-label">Points Planificados</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">
                    {Math.round((activeSprint.completedPoints / activeSprint.plannedPoints) * 100)}%
                  </div>
                  <div className="metric-label">Eficiencia</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{getDaysRemaining(activeSprint.endDate)}</div>
                  <div className="metric-label">Días Restantes</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;