import React, { useState, useEffect } from 'react';
import { teamAPI, tasksAPI } from '../services/api';
import '../styles/TeamManagement.css';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'developer',
    email: '',
    capacity: 0
  });

  useEffect(() => {
    loadTeamMembers();
    loadTasks();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const response = await teamAPI.getAll();
      setTeamMembers(response.data);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      await teamAPI.create(newMember);
      setShowNewMemberForm(false);
      setNewMember({
        name: '',
        role: 'developer',
        email: '',
        capacity: 0
      });
      loadTeamMembers();
    } catch (error) {
      console.error('Error creating team member:', error);
    }
  };

  const getMemberTasks = (memberName) => {
    return tasks.filter(task => task.assignee === memberName);
  };

  const getMemberWorkload = (memberName) => {
    const memberTasks = getMemberTasks(memberName);
    const totalPoints = memberTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedPoints = memberTasks
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    
    return { totalPoints, completedPoints };
  };

  const getRoleColor = (role) => {
    const colors = {
      'scrum-master': '#8b5cf6',
      'developer': '#3b82f6',
      'qa': '#ec4899'
    };
    return colors[role] || '#94a3b8';
  };

  return (
    <div className="team-management">
      <div className="team-header">
        <h2>👥 Gestión del Equipo</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowNewMemberForm(true)}
        >
          + Nuevo Miembro
        </button>
      </div>

      {/* New Member Form */}
      {showNewMemberForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Añadir Miembro del Equipo</h3>
            <form onSubmit={handleCreateMember}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol:</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                >
                  <option value="developer">Desarrollador</option>
                  <option value="scrum-master">Scrum Master</option>
                  <option value="qa">QA Tester</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Capacidad (Story Points por sprint):</label>
                <input
                  type="number"
                  value={newMember.capacity}
                  onChange={(e) => setNewMember({...newMember, capacity: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Añadir Miembro
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowNewMemberForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Stats */}
      <div className="team-stats">
        <div className="stat-card">
          <div className="stat-value">{teamMembers.length}</div>
          <div className="stat-label">Miembros del Equipo</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {teamMembers.filter(m => m.role === 'developer').length}
          </div>
          <div className="stat-label">Desarrolladores</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">Tareas Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {tasks.filter(t => t.status === 'done').length}
          </div>
          <div className="stat-label">Tareas Completadas</div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="team-grid">
        {teamMembers.map(member => {
          const workload = getMemberWorkload(member.name);
          const memberTasks = getMemberTasks(member.name);
          const utilization = member.capacity > 0 ? 
            Math.round((workload.totalPoints / member.capacity) * 100) : 0;

          return (
            <div key={member._id} className="team-member-card">
              <div 
                className="member-role-badge"
                style={{ backgroundColor: getRoleColor(member.role) }}
              >
                {member.role === 'scrum-master' ? '🎯' : 
                 member.role === 'developer' ? '💻' : '🧪'}
                {member.role}
              </div>
              
              <div className="member-info">
                <h3>{member.name}</h3>
                <p className="member-email">{member.email}</p>
              </div>

              <div className="member-workload">
                <div className="workload-metric">
                  <span className="metric-value">{workload.totalPoints} / {member.capacity}</span>
                  <span className="metric-label">Story Points</span>
                </div>
                <div className="utilization">
                  <div className="utilization-bar">
                    <div 
                      className="utilization-fill"
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    ></div>
                  </div>
                  <span className="utilization-text">{utilization}% utilización</span>
                </div>
              </div>

              <div className="member-tasks">
                <h4>Tareas Asignadas ({memberTasks.length})</h4>
                <div className="tasks-list">
                  {memberTasks.slice(0, 3).map(task => (
                    <div key={task._id} className="task-item">
                      <span className="task-title">{task.title}</span>
                      <span className={`task-status ${task.status}`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                  {memberTasks.length > 3 && (
                    <div className="more-tasks">
                      +{memberTasks.length - 3} más tareas...
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamManagement;