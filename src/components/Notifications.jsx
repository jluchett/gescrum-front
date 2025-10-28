import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import '../styles/Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    checkNotifications();
    // Verificar cada hora
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkNotifications = async () => {
    try {
      const response = await tasksAPI.getAll();
      const tasks = response.data;
      
      const today = new Date();
      const upcomingNotifications = [];

      tasks.forEach(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue === 0) {
            upcomingNotifications.push({
              type: 'due-today',
              message: `⏰ "${task.title}" vence hoy`,
              taskId: task._id,
              priority: 'high'
            });
          } else if (daysUntilDue === 1) {
            upcomingNotifications.push({
              type: 'due-tomorrow',
              message: `📅 "${task.title}" vence mañana`,
              taskId: task._id,
              priority: 'medium'
            });
          } else if (daysUntilDue < 0) {
            upcomingNotifications.push({
              type: 'overdue',
              message: `🚨 "${task.title}" está vencida`,
              taskId: task._id,
              priority: 'urgent'
            });
          }
        }
      });

      setNotifications(upcomingNotifications);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const dismissNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const urgentCount = notifications.filter(n => n.priority === 'urgent').length;
  const totalCount = notifications.length;

  return (
    <div className="notifications-container">
      <button 
        className="notifications-btn"
        onClick={() => setShowPanel(!showPanel)}
      >
        🔔 Notificaciones
        {totalCount > 0 && (
          <span className="notification-badge">
            {urgentCount > 0 ? urgentCount : totalCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notificaciones</h3>
            <button 
              className="close-btn"
              onClick={() => setShowPanel(false)}
            >
              ×
            </button>
          </div>

          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div 
                  key={index} 
                  className={`notification-item ${notification.priority}`}
                >
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <button 
                    className="dismiss-btn"
                    onClick={() => dismissNotification(index)}
                    title="Descartar"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                🎉 No hay notificaciones pendientes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;