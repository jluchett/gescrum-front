import React, { useState, useEffect } from 'react';
import { sprintsAPI, tasksAPI } from '../services/api';
import TaskCreator from './TaskCreator';
import '../styles/SprintManagement.css';

const SprintManagement = () => {
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [sprintTasks, setSprintTasks] = useState([]);
  const [sprintMetrics, setSprintMetrics] = useState({});
  const [showNewSprintForm, setShowNewSprintForm] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
    plannedPoints: 0
  });

  // Estados para controlar qué categorías están expandidas
  const [expandedCategories, setExpandedCategories] = useState({
    active: false,
    planned: false,
    completed: false
  });

  useEffect(() => {
    loadSprints();
  }, []);

  useEffect(() => {
    if (selectedSprint) {
      loadSprintDetails(selectedSprint._id);
    }
  }, [selectedSprint]);

  const loadSprints = async () => {
    try {
      const response = await sprintsAPI.getAll();
      const sprintsData = response.data;
      setSprints(sprintsData);
      
      const active = sprintsData.find(sprint => sprint.status === 'active');
      setActiveSprint(active);
      
      const sprintToSelect = active || (sprintsData.length > 0 ? sprintsData[0] : null);
      setSelectedSprint(sprintToSelect);
    } catch (error) {
      console.error('Error loading sprints:', error);
    }
  };

  const loadSprintDetails = async (sprintId) => {
    try {
      const [tasksResponse] = await Promise.all([
        tasksAPI.getBySprint(sprintId)
      ]);

      const tasks = tasksResponse.data;
      setSprintTasks(tasks);

      const completedTasks = tasks.filter(task => task.status === 'done');
      const inProgressTasks = tasks.filter(task => 
        task.status === 'in-progress' || task.status === 'review' || task.status === 'testing'
      );
      
      const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      const completedPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      
      const sprint = sprints.find(s => s._id === sprintId);
      const plannedPoints = sprint?.plannedPoints || 0;
      
      const velocity = plannedPoints > 0 ? Math.round((completedPoints / plannedPoints) * 100) : 0;
      const daysRemaining = sprint ? getDaysRemaining(sprint.endDate) : 0;

      setSprintMetrics({
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        totalPoints,
        completedPoints,
        plannedPoints,
        velocity,
        daysRemaining,
        completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading sprint details:', error);
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

  const handleSprintSelect = async (sprint) => {
    setSelectedSprint(sprint);
    setShowSprintModal(true);
    await loadSprintDetails(sprint._id);
  };

  const handleCompleteSprint = async (sprintId) => {
    if (!confirm('¿Estás seguro de que quieres completar este sprint? Esto moverá las tareas no completadas al backlog.')) {
      return;
    }

    try {
      const incompleteTasks = sprintTasks.filter(task => task.status !== 'done');
      const updatePromises = incompleteTasks.map(task => 
        tasksAPI.updateStatus(task._id, 'backlog')
      );

      await Promise.all(updatePromises);
      
      await sprintsAPI.update(sprintId, { status: 'completed' });
      
      alert('✅ Sprint completado correctamente');
      setShowSprintModal(false);
      loadSprints();
    } catch (error) {
      console.error('Error completing sprint:', error);
      alert('❌ Error al completar el sprint');
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Función para obtener los sprints a mostrar por categoría (3 iniciales + resto si está expandido)
  const getSprintsToShow = (sprintsList, category) => {
    if (expandedCategories[category]) {
      return sprintsList;
    }
    return sprintsList.slice(0, 3);
  };

  const calculateSprintProgress = (sprint) => {
    if (!sprint.plannedPoints) return 0;
    return Math.round(((sprint.completedPoints || 0) / sprint.plannedPoints) * 100);
  };

  const getSprintStatusInfo = (sprint) => {
    const now = new Date();
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    
    if (sprint.status === 'completed') {
      return { status: 'Completado', className: 'completed', icon: '✅' };
    }
    if (sprint.status === 'active') {
      const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return { 
        status: `Activo - ${daysRemaining}d restantes`, 
        className: 'active',
        icon: '🚀'
      };
    }
    if (now < start) {
      const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return { 
        status: `Planificado - Inicia en ${daysUntil}d`, 
        className: 'planned',
        icon: '📅'
      };
    }
    return { status: 'Desconocido', className: 'unknown', icon: '❓' };
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getSprintDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Agrupar sprints por estado
  const activeSprints = sprints.filter(s => s.status === 'active');
  const plannedSprints = sprints.filter(s => s.status === 'planned');
  const completedSprints = sprints.filter(s => s.status === 'completed');

  return (
    <div className="sprint-management">
      {/* Header simplificado */}
      <div className="sprint-header">
        <div>
          <h2>🎯 Gestión de Sprints</h2>
          <p>Planifica y sigue el progreso de todos tus sprints</p>
        </div>
        
        <button 
          className="btn-primary"
          onClick={() => setShowNewSprintForm(!showNewSprintForm)}
        >
          {showNewSprintForm ? '← Volver' : '➕ Nuevo Sprint'}
        </button>
      </div>

      {/* Formulario para crear nuevo sprint */}
      {showNewSprintForm && (
        <div className="sprint-create-view">
          <div className="create-sprint-card">
            <h3>Crear Nuevo Sprint</h3>
            <form onSubmit={handleCreateSprint}>
              <div className="form-group">
                <label>Nombre del Sprint *</label>
                <input
                  type="text"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({...newSprint, name: e.target.value})}
                  required
                  placeholder="Ej: Sprint 3 - Funcionalidades Avanzadas"
                />
              </div>

              <div className="form-group">
                <label>Objetivo del Sprint *</label>
                <textarea
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({...newSprint, goal: e.target.value})}
                  required
                  placeholder="¿Qué se espera lograr en este sprint?"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint({...newSprint, startDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Fin *</label>
                  <input
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint({...newSprint, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Story Points Planificados</label>
                <input
                  type="number"
                  value={newSprint.plannedPoints}
                  onChange={(e) => setNewSprint({...newSprint, plannedPoints: parseInt(e.target.value)})}
                  min="0"
                  placeholder="0"
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

      {/* Vista unificada de todos los sprints */}
      {!showNewSprintForm && (
        <div className="sprints-unified-view">
          {/* Sprints Activos */}
          {activeSprints.length > 0 && (
            <div className="sprints-section">
              <div className="section-header">
                <h3>🚀 Sprints Activos ({activeSprints.length})</h3>
                {activeSprints.length > 3 && (
                  <button 
                    className="btn-toggle-category"
                    onClick={() => toggleCategory('active')}
                  >
                    {expandedCategories.active ? '▲ Mostrar menos' : '▼ Mostrar más'}
                  </button>
                )}
              </div>
              <div className="sprints-grid">
                {getSprintsToShow(activeSprints, 'active').map(sprint => (
                  <SprintCard 
                    key={sprint._id}
                    sprint={sprint}
                    onSelect={handleSprintSelect}
                    onComplete={handleCompleteSprint}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sprints Planificados */}
          {plannedSprints.length > 0 && (
            <div className="sprints-section">
              <div className="section-header">
                <h3>📅 Sprints Planificados ({plannedSprints.length})</h3>
                {plannedSprints.length > 3 && (
                  <button 
                    className="btn-toggle-category"
                    onClick={() => toggleCategory('planned')}
                  >
                    {expandedCategories.planned ? '▲ Mostrar menos' : '▼ Mostrar más'}
                  </button>
                )}
              </div>
              <div className="sprints-grid">
                {getSprintsToShow(plannedSprints, 'planned').map(sprint => (
                  <SprintCard 
                    key={sprint._id}
                    sprint={sprint}
                    onSelect={handleSprintSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sprints Completados */}
          {completedSprints.length > 0 && (
            <div className="sprints-section">
              <div className="section-header">
                <h3>✅ Sprints Completados ({completedSprints.length})</h3>
                {completedSprints.length > 3 && (
                  <button 
                    className="btn-toggle-category"
                    onClick={() => toggleCategory('completed')}
                  >
                    {expandedCategories.completed ? '▲ Mostrar menos' : '▼ Mostrar más'}
                  </button>
                )}
              </div>
              <div className="sprints-grid">
                {getSprintsToShow(completedSprints, 'completed').map(sprint => (
                  <SprintCard 
                    key={sprint._id}
                    sprint={sprint}
                    onSelect={handleSprintSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay sprints */}
          {sprints.length === 0 && !showNewSprintForm && (
            <div className="empty-sprints">
              <div className="empty-icon">🎯</div>
              <h4>No hay sprints creados</h4>
              <p>Crea tu primer sprint para comenzar a planificar tu proyecto</p>
              <button 
                className="btn-primary"
                onClick={() => setShowNewSprintForm(true)}
              >
                Crear Primer Sprint
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalles del Sprint */}
      {showSprintModal && selectedSprint && (
        <SprintModal 
          sprint={selectedSprint}
          tasks={sprintTasks}
          metrics={sprintMetrics}
          onClose={() => setShowSprintModal(false)}
          onComplete={handleCompleteSprint}
          onTaskCreated={loadSprints}
        />
      )}
    </div>
  );
};

// Componente de Tarjeta de Sprint Mejorado
const SprintCard = ({ sprint, onSelect, onComplete }) => {
  const statusInfo = getSprintStatusInfo(sprint);
  const progress = calculateSprintProgress(sprint);
  const duration = getSprintDuration(sprint.startDate, sprint.endDate);

  return (
    <div className="sprint-card" onClick={() => onSelect(sprint)}>
      <div className="sprint-card-header">
        <div className="sprint-icon">{statusInfo.icon}</div>
        <div className="sprint-basic-info">
          <h4 className="sprint-name">{sprint.name}</h4>
          <span className={`sprint-status ${statusInfo.className}`}>
            {statusInfo.status}
          </span>
        </div>
      </div>

      <p className="sprint-goal">{sprint.goal}</p>

      <div className="sprint-dates">
        <span className="date-range">
          {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
        </span>
        <span className="duration">({duration} días)</span>
      </div>

      <div className="sprint-progress">
        <div className="progress-header">
          <span className="progress-label">Progreso</span>
          <span className="progress-percentage">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-stats">
          <span>{sprint.completedPoints || 0}/{sprint.plannedPoints || 0} pts</span>
        </div>
      </div>

      {sprint.status === 'active' && onComplete && (
        <button 
          className="btn-complete-sprint"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(sprint._id);
          }}
        >
          ✅ Completar Sprint
        </button>
      )}

      <div className="sprint-card-footer">
        <span className="view-details">👁️ Ver detalles</span>
      </div>
    </div>
  );
};

// Componente Modal de Detalles del Sprint - Mejorado
const SprintModal = ({ sprint, tasks, metrics, onClose, onComplete, onTaskCreated }) => {
  const statusInfo = getSprintStatusInfo(sprint);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sprint-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <h2>{sprint.name}</h2>
            <span className={`sprint-status-badge ${statusInfo.className}`}>
              {statusInfo.icon} {statusInfo.status}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="modal-section">
            <h3>🎯 Objetivo del Sprint</h3>
            <p className="sprint-goal-text">{sprint.goal}</p>
          </div>

          <div className="modal-section">
            <h3>📅 Fechas</h3>
            <div className="dates-grid">
              <div className="date-item">
                <span className="date-label">Inicio:</span>
                <span className="date-value">{new Date(sprint.startDate).toLocaleDateString()}</span>
              </div>
              <div className="date-item">
                <span className="date-label">Fin:</span>
                <span className="date-value">{new Date(sprint.endDate).toLocaleDateString()}</span>
              </div>
              <div className="date-item">
                <span className="date-label">Duración:</span>
                <span className="date-value">{getSprintDuration(sprint.startDate, sprint.endDate)} días</span>
              </div>
            </div>
          </div>

          {/* Métricas del Sprint - Mejorado */}
          <div className="modal-section">
            <h3>📊 Métricas del Sprint</h3>
            <div className="metrics-grid-improved">
              <div className="metric-card-improved">
                <div className="metric-icon">⚡</div>
                <div className="metric-content">
                  <div className="metric-value">{metrics.velocity || 0}%</div>
                  <div className="metric-label">Velocidad</div>
                </div>
              </div>
              <div className="metric-card-improved">
                <div className="metric-icon">✅</div>
                <div className="metric-content">
                  <div className="metric-value">{metrics.completionRate || 0}%</div>
                  <div className="metric-label">Completadas</div>
                </div>
              </div>
              <div className="metric-card-improved">
                <div className="metric-icon">📅</div>
                <div className="metric-content">
                  <div className="metric-value">{metrics.daysRemaining || 0}</div>
                  <div className="metric-label">Días Restantes</div>
                </div>
              </div>
              <div className="metric-card-improved">
                <div className="metric-icon">🎯</div>
                <div className="metric-content">
                  <div className="metric-value">{metrics.completedPoints || 0}/{metrics.plannedPoints || 0}</div>
                  <div className="metric-label">Points Logrados</div>
                </div>
              </div>
            </div>
          </div>

          {/* Distribución de Tareas - Mejorado */}
          {metrics.totalTasks > 0 && (
            <div className="modal-section">
              <h3>📈 Distribución de Tareas</h3>
              <div className="distribution-grid-improved">
                <div className="distribution-card-improved done">
                  <div className="distribution-icon">✅</div>
                  <div className="distribution-content">
                    <div className="distribution-count">{metrics.completedTasks || 0}</div>
                    <div className="distribution-label">Completadas</div>
                    <div className="distribution-percentage">
                      {Math.round(((metrics.completedTasks || 0) / (metrics.totalTasks || 1)) * 100)}%
                    </div>
                  </div>
                </div>
                <div className="distribution-card-improved progress">
                  <div className="distribution-icon">🔄</div>
                  <div className="distribution-content">
                    <div className="distribution-count">{metrics.inProgressTasks || 0}</div>
                    <div className="distribution-label">En Progreso</div>
                    <div className="distribution-percentage">
                      {Math.round(((metrics.inProgressTasks || 0) / (metrics.totalTasks || 1)) * 100)}%
                    </div>
                  </div>
                </div>
                <div className="distribution-card-improved pending">
                  <div className="distribution-icon">⏳</div>
                  <div className="distribution-content">
                    <div className="distribution-count">
                      {(metrics.totalTasks || 0) - (metrics.completedTasks || 0) - (metrics.inProgressTasks || 0)}
                    </div>
                    <div className="distribution-label">Pendientes</div>
                    <div className="distribution-percentage">
                      {Math.round((((metrics.totalTasks || 0) - (metrics.completedTasks || 0) - (metrics.inProgressTasks || 0)) / (metrics.totalTasks || 1)) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tareas del Sprint */}
          <div className="modal-section">
            <h3>📝 Tareas del Sprint ({tasks.length})</h3>
            {tasks.length > 0 ? (
              <div className="tasks-table">
                <div className="table-header">
                  <span>Tarea</span>
                  <span>Estado</span>
                  <span>Puntos</span>
                  <span>Asignado</span>
                </div>
                {tasks.map(task => (
                  <div key={task._id} className="table-row">
                    <span className="task-title">{task.title}</span>
                    <span className={`task-status ${task.status}`}>
                      {task.status}
                    </span>
                    <span className="task-points">{task.storyPoints || 0}</span>
                    <span className="task-assignee">{task.assignee || 'Sin asignar'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-tasks">
                <p>No hay tareas en este sprint</p>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="modal-actions">
            <TaskCreator 
              onTaskCreated={() => {
                onTaskCreated();
                onClose();
              }}
              initialSprintId={sprint._id}
            />
            <button className="btn-secondary">
              📋 Ver en Kanban
            </button>
            {sprint.status === 'active' && (
              <button 
                className="btn-complete"
                onClick={() => onComplete(sprint._id)}
              >
                ✅ Completar Sprint
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares (sin cambios)
const getSprintStatusInfo = (sprint) => {
  const now = new Date();
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  
  if (sprint.status === 'completed') {
    return { status: 'Completado', className: 'completed', icon: '✅' };
  }
  if (sprint.status === 'active') {
    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return { 
      status: `Activo - ${daysRemaining}d restantes`, 
      className: 'active',
      icon: '🚀'
    };
  }
  if (now < start) {
    const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    return { 
      status: `Planificado - Inicia en ${daysUntil}d`, 
      className: 'planned',
      icon: '📅'
    };
  }
  return { status: 'Desconocido', className: 'unknown', icon: '❓' };
};

const calculateSprintProgress = (sprint) => {
  if (!sprint.plannedPoints) return 0;
  return Math.round(((sprint.completedPoints || 0) / sprint.plannedPoints) * 100);
};

const getSprintDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default SprintManagement;