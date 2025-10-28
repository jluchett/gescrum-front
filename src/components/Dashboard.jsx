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

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    teamVelocity: 0,
    sprintProgress: 0
  });

  const [burndownData, setBurndownData] = useState({
    labels: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'],
    datasets: [
      {
        label: 'Story Points Restantes',
        data: [34, 28, 22, 18, 12, 8, 5],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Línea Ideal',
        data: [34, 29, 24, 19, 14, 9, 4],
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
        fill: false,
      }
    ]
  });

  const taskDistributionData = {
    labels: ['Completadas', 'En Progreso', 'Pendientes'],
    datasets: [
      {
        data: [12, 8, 14],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const criticalTasks = [
    { id: 1, title: 'US06 - Mensajes Programados', assignee: 'Juan', dueDate: '2024-06-18', status: 'in-progress' },
    { id: 2, title: 'US07 - Multimedia', assignee: 'María', dueDate: '2024-06-20', status: 'todo' },
    { id: 3, title: 'US08 - Botones Interactivos', assignee: 'Carlos', dueDate: '2024-06-22', status: 'todo' }
  ];

  const teamMembers = [
    { name: 'Juan', role: 'Developer', tasks: 3, capacity: 13 },
    { name: 'María', role: 'Developer', tasks: 2, capacity: 13 },
    { name: 'Carlos', role: 'Developer', tasks: 4, capacity: 13 }
  ];

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-value">65%</div>
          <div className="card-label">Completado General</div>
        </div>
        <div className="summary-card">
          <div className="card-value">Sprint 2</div>
          <div className="card-label">Activo</div>
        </div>
        <div className="summary-card">
          <div className="card-value">12/34</div>
          <div className="card-label">Tareas Completadas</div>
        </div>
        <div className="summary-card">
          <div className="card-value">5 Días</div>
          <div className="card-label">Restantes</div>
        </div>
      </div>

      {/* Charts and Metrics */}
      <div className="dashboard-content">
        <div className="chart-section">
          <div className="chart-container">
            <h3>📈 Burndown Chart</h3>
            <Bar data={burndownData} options={{ responsive: true }} />
          </div>
          <div className="chart-container">
            <h3>🎯 Distribución de Tareas</h3>
            <Doughnut data={taskDistributionData} options={{ responsive: true }} />
          </div>
        </div>

        {/* Critical Tasks and Team */}
        <div className="info-sections">
          <div className="critical-tasks">
            <h3>⚡ Tareas Críticas</h3>
            {criticalTasks.map(task => (
              <div key={task.id} className="task-item">
                <span className="task-title">{task.title}</span>
                <div className="task-meta">
                  <span className="assignee">{task.assignee}</span>
                  <span className={`status ${task.status}`}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="team-overview">
            <h3>👥 Estado del Equipo</h3>
            {teamMembers.map(member => (
              <div key={member.name} className="team-member">
                <div className="member-info">
                  <strong>{member.name}</strong>
                  <span>({member.role})</span>
                </div>
                <div className="member-stats">
                  <span>{member.tasks} tareas</span>
                  <span>{member.capacity} pts capacidad</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;