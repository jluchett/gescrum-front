import React, { useState, useEffect } from 'react';
import { tasksAPI, sprintsAPI } from '../services/api';
import TaskCreator from './TaskCreator';
import '../styles/BacklogManagement.css';

const BacklogManagement = () => {
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadBacklogData();
  }, []);

  const loadBacklogData = async () => {
    try {
      const [tasksResponse, sprintsResponse] = await Promise.all([
        tasksAPI.getAll(),
        sprintsAPI.getAll()
      ]);

      const backlogTasks = tasksResponse.data.filter(task => 
        task.status === 'backlog' || !task.sprintId
      );
      
      setBacklogTasks(backlogTasks);
      setSprints(sprintsResponse.data.filter(sprint => 
        sprint.status === 'active' || sprint.status === 'planned'
      ));
    } catch (error) {
      console.error('Error loading backlog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }

    try {
      // En un caso real, aquí llamarías a tasksAPI.delete(taskId)
      const respuesta = await tasksAPI.delete(taskId);
      
      console.log('Tarea eliminada:', respuesta.data);

      // Actualizar estado local
      setBacklogTasks(prev => prev.filter(task => task._id !== taskId));
      
      // Si la tarea estaba seleccionada, quitarla de la selección
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
      alert('✅ Tarea eliminada correctamente');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('❌ Error al eliminar la tarea');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedTasks.length} tareas?`)) {
      return;
    }

    try {
      // Eliminar cada tarea seleccionada
      const deletePromises = selectedTasks.map(taskId => 
        tasksAPI.delete(taskId)
      );

      await Promise.all(deletePromises);
      
      // Actualizar estado local
      setBacklogTasks(prev => 
        prev.filter(task => !selectedTasks.includes(task._id))
      );
      
      // Limpiar selección
      setSelectedTasks([]);
      
      alert(`✅ ${selectedTasks.length} tareas eliminadas correctamente`);
    } catch (error) {
      console.error('Error deleting tasks:', error);
      
      // Mostrar cuáles tareas fallaron
      const errorTasks = selectedTasks.filter((taskId, index) => {
        return error.results?.[index]?.status === 'rejected';
      });
      
      if (errorTasks.length > 0) {
        alert(`❌ Error al eliminar ${errorTasks.length} tareas. Las demás se eliminaron correctamente.`);
      } else {
        alert('❌ Error al eliminar las tareas');
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleTaskUpdated = () => {
    setEditingTask(null);
    loadBacklogData(); // Recargar los datos
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === backlogTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(backlogTasks.map(task => task._id));
    }
  };

  const getPriorityBadge = (priority) => {
    const config = {
      high: { label: 'Alta', class: 'high' },
      medium: { label: 'Media', class: 'medium' },
      low: { label: 'Baja', class: 'low' }
    };
    
    const { label, class: className } = config[priority] || config.medium;
    return <span className={`priority-badge ${className}`}>{label}</span>;
  };

  if (loading) {
    return <div className="loading">Cargando backlog...</div>;
  }

  // Función para verificar si una tarea está vencida
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  return (
    <div className="backlog-management">
      <div className="backlog-header">
        <div>
          <h2>📥 Product Backlog</h2>
          <p>Gestiona las tareas pendientes de asignar a sprints</p>
        </div>
        
        <div className="backlog-actions">
          {selectedTasks.length > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">
                {selectedTasks.length} tareas seleccionadas
              </span>
              
              <div className="bulk-buttons">
                <button 
                  className="btn-danger"
                  onClick={handleBulkDelete}
                >
                  🗑️ Eliminar Seleccionadas
                </button>
              </div>
            </div>
          )}
          
          <TaskCreator onTaskCreated={loadBacklogData} />
        </div>
      </div>

      {/* Backlog Statistics */}
      <div className="backlog-stats">
        <div className="stat-card">
          <div className="stat-value">{backlogTasks.length}</div>
          <div className="stat-label">Tareas en Backlog</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {backlogTasks.filter(t => t.priority === 'high').length}
          </div>
          <div className="stat-label">Prioridad Alta</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {backlogTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)}
          </div>
          <div className="stat-label">Story Points Totales</div>
        </div>
      </div>

      {/* Backlog Tasks Table */}
      <div className="backlog-table-container">
        {backlogTasks.length > 0 ? (
          <table className="backlog-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === backlogTasks.length && backlogTasks.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Tarea</th>
                <th>Asignado</th>
                <th>Story Points</th>
                <th>Prioridad</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {backlogTasks.map(task => (
                <tr key={task._id} className="backlog-task-row">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task._id)}
                      onChange={() => handleTaskSelect(task._id)}
                    />
                  </td>
                  
                  <td>
                    <div className="task-info">
                      <div className="task-title">{task.title}</div>
                      {task.description && (
                        <div className="task-description">{task.description}</div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <span className="assignee">{task.assignee || 'Sin asignar'}</span>
                  </td>
                  
                  <td>
                    <span className="story-points">{task.storyPoints || 0}</span>
                  </td>
                  
                  <td>
                    {getPriorityBadge(task.priority)}
                  </td>

                  <td>
                    {task.dueDate ? (
                      <span className={`due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                        {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue(task.dueDate) && ' ⚠️'}
                      </span>
                    ) : (
                      <span className="no-due-date">Sin fecha</span>
                    )}
                  </td>
                  
                  <td>
                    <div className="task-actions">
                      <button 
                        className="btn-primary btn-small"
                        onClick={() => handleEditTask(task)}
                        title="Editar tarea"
                      >
                        ✏️Editar
                      </button>
                      
                      <button 
                        className="btn-danger btn-small"
                        onClick={() => handleDeleteTask(task._id)}
                        title="Eliminar tarea"
                      >
                        🗑️Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-backlog">
            <div className="empty-icon">📥</div>
            <h3>No hay tareas en el backlog</h3>
            <p>Crea nuevas tareas para comenzar a planificar tu proyecto</p>
            <TaskCreator onTaskCreated={loadBacklogData} />
          </div>
        )}
      </div>

      {/* Modal de edición reutilizando TaskCreator */}
      {editingTask && (
        <TaskCreator 
          taskToEdit={editingTask}
          onTaskCreated={handleTaskUpdated}
          onCancelEdit={handleCancelEdit}
        />
      )}
    </div>
  );
};

export default BacklogManagement;