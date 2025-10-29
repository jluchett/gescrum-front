import React, { useState } from 'react';
import { tasksAPI } from '../services/api';
import '../styles/TaskTemplates.css';

const TaskTemplates = ({ onTemplateApplied }) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const taskTemplates = [
    {
      name: "🐛 Reporte de Bug",
      template: {
        title: "Investigar y corregir bug en ",
        description: "**Descripción del problema:**\n\n**Pasos para reproducir:**\n1. \n2. \n3. \n\n**Comportamiento esperado:**\n\n**Comportamiento actual:**",
        storyPoints: 3,
        priority: "high"
      }
    },
    {
      name: "✨ Nueva Funcionalidad",
      template: {
        title: "Implementar funcionalidad de ",
        description: "**Objetivo:**\n\n**Requisitos:**\n- [ ] \n- [ ] \n- [ ] \n\n**Criterios de aceptación:**\n- [ ] \n- [ ]",
        storyPoints: 5,
        priority: "medium"
      }
    },
    {
      name: "🎨 Mejora de UI/UX",
      template: {
        title: "Mejorar interfaz de ",
        description: "**Área a mejorar:**\n\n**Problemas actuales:**\n- \n- \n\n**Propuesta de mejora:**\n\n**Recursos de diseño:**",
        storyPoints: 2,
        priority: "medium"
      }
    },
    {
      name: "📚 Tarea de Documentación",
      template: {
        title: "Documentar proceso de ",
        description: "**Sección a documentar:**\n\n**Contenido requerido:**\n- Introducción\n- Procedimiento\n- Ejemplos\n- Referencias",
        storyPoints: 1,
        priority: "low"
      }
    },
    {
      name: "🧪 Prueba de Calidad",
      template: {
        title: "Ejecutar pruebas de para ",
        description: "**Ámbito de pruebas:**\n\n**Casos de prueba:**\n- [ ] \n- [ ] \n- [ ] \n\n**Entorno de testing:**\n\n**Criterios de éxito:**",
        storyPoints: 2,
        priority: "medium"
      }
    }
  ];

  const applyTemplate = async (template) => {
    try {
      const taskData = {
        ...template,
        status: 'backlog',
        assignee: '' // Dejar sin asignar inicialmente
      };

      const response = await tasksAPI.create(taskData);
      
      setShowTemplates(false);
      if (onTemplateApplied) {
        onTemplateApplied(response.data);
      }
      
      alert('✅ Plantilla aplicada correctamente');
    } catch (error) {
      console.error('Error applying template:', error);
      alert('❌ Error al aplicar la plantilla');
    }
  };

  return (
    <div className="task-templates">
      <button 
        className="btn-secondary"
        onClick={() => setShowTemplates(!showTemplates)}
      >
        📋 Plantillas
      </button>

      {showTemplates && (
        <div className="templates-panel">
          <div className="templates-header">
            <h3>Plantillas de Tareas</h3>
            <button 
              className="close-btn"
              onClick={() => setShowTemplates(false)}
            >
              ×
            </button>
          </div>

          <div className="templates-grid">
            {taskTemplates.map((template, index) => (
              <div 
                key={index}
                className="template-card"
                onClick={() => applyTemplate(template.template)}
              >
                <div className="template-header">
                  <h4>{template.name}</h4>
                  <span className="template-points">
                    {template.template.storyPoints} pts
                  </span>
                </div>
                <div className="template-preview">
                  {template.template.title}
                </div>
                <div className="template-priority">
                  Prioridad: <span className={`priority-${template.template.priority}`}>
                    {template.template.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTemplates;