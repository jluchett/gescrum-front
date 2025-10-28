import React, { useState, useEffect } from 'react';
import { sprintsAPI, tasksAPI } from '../services/api';
import '../styles/SprintManagement.css';

const SprintManagement = () => {
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [sprintTasks, setSprintTasks] = useState([]);
  const [showNewSprintForm, setShowNewSprintForm] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
    plannedPoints: 0
  });

  useEffect(() => {
    loadSprints();
  }, []);

  useEffect(() => {
    if (activeSprint) {
      loadSprintTasks(activeSprint._id);
    }
  }, [activeSprint]);

  const loadSprints = async () => {
    try {
      const response = await sprintsAPI.getAll();
      setSprints(response.data);
      
      // Find active sprint
      const active = response.data.find(sprint => sprint.status === 'active');
      setActiveSprint(active || response.data[0]);
    } catch (error) {
      console.error('Error loading sprints:', error);
    }
  };

  const loadSprintTasks = async (sprintId) => {
    try {
      const response = await tasksAPI.getBySprint(sprintId);
      setSprintTasks(response.data);
    } catch (error) {
      console.error('Error loading sprint tasks:', error);
    }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    try {
      await sprintsAPI.create(newSprint);
      setShowNewSprintForm(false);
      setNewSprint({
        name: '',
        goal: '',
        startDate: '',
        endDate: '',
        plannedPoints: 0
      });
      loadSprints();
    } catch (error) {
      console.error('Error creating sprint:', error);
    }
  };

  const calculateSprintProgress = (sprint) => {
    if (!sprint.plannedPoints) return 0;
    return Math.round((sprint.completedPoints / sprint.plannedPoints) * 100);
  };

  const getSprintStatusInfo = (sprint) => {
    const now = new Date();
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    
    if (sprint.status === 'completed') {
      return { status: 'Completado', className: 'completed' };
    }
    if (sprint.status === 'active') {
      const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return { 
        status: `Activo - ${daysRemaining} días restantes`, 
        className: 'active' 
      };
    }
    if (now < start) {
      const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return { 
        status: `Planificado - Inicia en ${daysUntil} días`, 
        className: 'planned' 
      };
    }
    return { status: 'Desconocido', className: 'unknown' };
  };

  return (
    <div className="sprint-management">
      <div className="sprint-header">
        <h2>🎯 Gestión de Sprints</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowNewSprintForm(true)}
        >
          + Nuevo Sprint
        </button>
      </div>

      {/* New Sprint Form */}
      {showNewSprintForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Crear Nuevo Sprint</h3>
            <form onSubmit={handleCreateSprint}>
              <div className="form-group">
                <label>Nombre del Sprint:</label>
                <input
                  type="text"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({...newSprint, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Objetivo:</label>
                <textarea
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({...newSprint, goal: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio:</label>
                  <input
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint({...newSprint, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Fin:</label>
                  <input
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint({...newSprint, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Story Points Planificados:</label>
                <input
                  type="number"
                  value={newSprint.plannedPoints}
                  onChange={(e) => setNewSprint({...newSprint, plannedPoints: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Crear Sprint
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowNewSprintForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Sprint Focus */}
      {activeSprint && (
        <div className="active-sprint">
          <h3>Sprint Activo</h3>
          <div className="sprint-card featured">
            <div className="sprint-info">
              <h4>{activeSprint.name}</h4>
              <p>{activeSprint.goal}</p>
              <div className="sprint-dates">
                <span>📅 {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}</span>
              </div>
              <div className="sprint-metrics">
                <div className="metric">
                  <span className="metric-value">{activeSprint.completedPoints}/{activeSprint.plannedPoints}</span>
                  <span className="metric-label">Story Points</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{calculateSprintProgress(activeSprint)}%</span>
                  <span className="metric-label">Progreso</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{sprintTasks.length}</span>
                  <span className="metric-label">Tareas</span>
                </div>
              </div>
            </div>
            <div className="sprint-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${calculateSprintProgress(activeSprint)}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {getSprintStatusInfo(activeSprint).status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* All Sprints List */}
      <div className="sprints-list">
        <h3>Todos los Sprints</h3>
        <div className="sprints-grid">
          {sprints.map(sprint => (
            <div 
              key={sprint._id} 
              className={`sprint-card ${sprint.status}`}
              onClick={() => setActiveSprint(sprint)}
            >
              <div className="sprint-header">
                <h4>{sprint.name}</h4>
                <span className={`sprint-status ${getSprintStatusInfo(sprint).className}`}>
                  {sprint.status}
                </span>
              </div>
              <p className="sprint-goal">{sprint.goal}</p>
              <div className="sprint-dates">
                {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
              </div>
              <div className="sprint-progress-mini">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${calculateSprintProgress(sprint)}%` }}
                  ></div>
                </div>
                <span>{calculateSprintProgress(sprint)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SprintManagement;