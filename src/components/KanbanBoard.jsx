import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { tasksAPI } from '../services/api';
import '../styles/KanbanBoard.css';

const ItemTypes = {
  TASK: 'task',
};

// Draggable Task Component
const TaskCard = ({ task, onStatusChange }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task._id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="task-header">
        <span className="task-points">{task.storyPoints || 0} pts</span>
        <span className={`task-priority ${task.priority}`}>
          {task.priority}
        </span>
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-footer">
        <span className="task-assignee">👤 {task.assignee || 'Sin asignar'}</span>
        {task.dueDate && (
          <span className="task-due">
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      {task.comments && task.comments.length > 0 && (
        <div className="task-comments">
          💬 {task.comments.length} comentarios
        </div>
      )}
    </div>
  );
};

// Drop Column Component
const Column = ({ status, tasks, onTaskDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item) => onTaskDrop(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const statusConfig = {
    'backlog': { title: '📥 Backlog', color: '#94a3b8' },
    'todo': { title: '📋 To Do', color: '#f59e0b' },
    'in-progress': { title: '⚡ In Progress', color: '#3b82f6' },
    'review': { title: '🔍 Review', color: '#8b5cf6' },
    'testing': { title: '🧪 Testing', color: '#ec4899' },
    'done': { title: '✅ Done', color: '#10b981' }
  };

  const config = statusConfig[status] || statusConfig.backlog;

  return (
    <div 
      ref={drop}
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
      style={{ borderTopColor: config.color }}
    >
      <div className="column-header">
        <h3>{config.title}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div className="tasks-list">
        {tasks.map(task => (
          <TaskCard 
            key={task._id} 
            task={task} 
            onStatusChange={onTaskDrop}
          />
        ))}
      </div>
    </div>
  );
};

const KanbanBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const statuses = ['backlog', 'todo', 'in-progress', 'review', 'testing', 'done'];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskDrop = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return <div className="loading">Cargando tareas...</div>;
  }

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <h2>🎪 Tablero Kanban</h2>
        <div className="board-stats">
          <span>Total: {tasks.length} tareas</span>
          <span>
            Completadas: {getTasksByStatus('done').length} / {tasks.length}
          </span>
        </div>
      </div>

      <div className="kanban-columns">
        {statuses.map(status => (
          <Column
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onTaskDrop={handleTaskDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;