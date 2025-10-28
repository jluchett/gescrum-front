import React, { useState, useEffect } from 'react';
import { tasksAPI, teamAPI, sprintsAPI } from '../services/api';
import '../styles/TaskCreator.css';

const TaskCreator = ({ onTaskCreated, initialSprintId = null, taskToEdit = null, onCancelEdit = null }) => {
  const [showForm, setShowForm] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    storyPoints: 0,
    priority: 'medium',
    sprintId: initialSprintId || '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  // Efecto para cargar datos de la tarea a editar
  useEffect(() => {
    if (taskToEdit) {
      setNewTask({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        assignee: taskToEdit.assignee || '',
        storyPoints: taskToEdit.storyPoints || 0,
        priority: taskToEdit.priority || 'medium',
        sprintId: taskToEdit.sprintId || initialSprintId || '',
        dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : ''
      });
      setShowForm(true);
    }
  }, [taskToEdit, initialSprintId]);

  const loadFormData = async () => {
    try {
      const [teamResponse, sprintsResponse] = await Promise.all([
        teamAPI.getAll(),
        sprintsAPI.getAll()
      ]);
      setTeamMembers(teamResponse.data);
      setSprints(sprintsResponse.data);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assignee: newTask.assignee,
        storyPoints: parseInt(newTask.storyPoints) || 0,
        priority: newTask.priority,
        status: newTask.sprintId ? 'todo' : 'backlog'
      };

      // Solo agregar sprintId si no está vacío
      if (newTask.sprintId) {
        taskData.sprintId = newTask.sprintId;
      }
      // Agregar dueDate si está presente
      if (newTask.dueDate) {
        taskData.dueDate = new Date(newTask.dueDate);
      }

      console.log('Enviando datos al backend:', taskData);

      const response = await tasksAPI.create(taskData);
      console.log('Tarea creada exitosamente:', response.data);
      
      // Reset form
      resetForm();
      setShowForm(false);
      if (onTaskCreated) onTaskCreated();

    } catch (error) {
      console.error('Error completo creating task:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      alert(`Error al crear tarea: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

    const handleUpdateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Preparar datos para actualizar
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assignee: newTask.assignee,
        storyPoints: parseInt(newTask.storyPoints) || 0,
        priority: newTask.priority,
        sprintId: newTask.sprintId || null
      };

      // Agregar dueDate si está presente
      if (newTask.dueDate) {
        taskData.dueDate = new Date(newTask.dueDate);
      } else {
        taskData.dueDate = null;
      }

      console.log('Actualizando tarea:', taskToEdit._id, taskData);

      // Llamada real al backend para actualizar
      const response = await tasksAPI.update(taskToEdit._id, taskData);
      console.log('Tarea actualizada:', response.data);
      
      // Reset form
      resetForm();
      setShowForm(false);
      if (onTaskCreated) onTaskCreated();
      
      alert('✅ Tarea actualizada correctamente');
      
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      alert(`Error al actualizar tarea: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      assignee: '',
      storyPoints: 0,
      priority: 'medium',
      sprintId: initialSprintId || '',
      dueDate: ''
    });
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    if (onCancelEdit) onCancelEdit();
  };

  const isEditing = Boolean(taskToEdit);

  return (
    <div className="task-creator">
      {!isEditing && (
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={loading}
        >
          {loading ? 'Creando...' : '+ Nueva Tarea'}
        </button>
      )}

      {(showForm || isEditing) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditing ? '✏️ Editar Tarea' : 'Crear Nueva Tarea'}</h3>
              <button 
                className="close-btn"
                onClick={handleCancel}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <form onSubmit={isEditing ? handleUpdateTask : handleCreateTask}>
              <div className="form-group">
                <label>Título de la Tarea *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                  placeholder="Ej: Implementar envío de mensajes programados"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Describe los detalles de la tarea..."
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Asignar a *</label>
                  <select
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccionar miembro</option>
                    {teamMembers.map(member => (
                      <option key={member._id} value={member.name}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Story Points</label>
                  <select
                    value={newTask.storyPoints}
                    onChange={(e) => setNewTask({...newTask, storyPoints: parseInt(e.target.value)})}
                    disabled={loading}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                    <option value={13}>13</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prioridad</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    disabled={loading}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sprint</label>
                  <select
                    value={newTask.sprintId}
                    onChange={(e) => setNewTask({...newTask, sprintId: e.target.value})}
                    disabled={loading}
                  >
                    <option value="">Backlog (Sin sprint)</option>
                    {sprints
                      .filter(sprint => sprint.status === 'active' || sprint.status === 'planned')
                      .map(sprint => (
                        <option key={sprint._id} value={sprint._id}>
                          {sprint.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div className="form-group">
                  {/* Espacio vacío para mantener el layout */}
                  <label style={{ visibility: 'hidden' }}>Espacio</label>
                  <div style={{ height: '42px' }}></div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : (isEditing ? 'Actualizar Tarea' : 'Crear Tarea')}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCreator;