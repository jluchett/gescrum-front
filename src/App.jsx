import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Dashboard from './components/Dashboard';
import SprintManagement from './components/SprintManagement';
import KanbanBoard from './components/KanbanBoard';
import TeamManagement from './components/TeamManagement';
import BacklogManagement from './components/BacklogManagement';
import Notifications from './components/Notifications';
import TaskTemplates from './components/TaskTemplates';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', component: <Dashboard /> },
    { id: 'sprints', label: '🎯 Sprints', component: <SprintManagement /> },
    { id: 'backlog', label: '📥 Backlog', component: <BacklogManagement /> },
    { id: 'kanban', label: '🎪 Kanban', component: <KanbanBoard /> },
    { id: 'team', label: '👥 Equipo', component: <TeamManagement /> }
  ];

  return (
    <DndProvider backend={HTML5Backend}>
       <div className="app">
        <header className="app-header">
          <div className="header-main">
            <h1>🚀 Scrum Dashboard - Telegram JSF</h1>
            <div className="header-actions">
              <TaskTemplates />
              <Notifications />
            </div>
          </div>
          
          <nav className="nav-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="app-main">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </main>
      </div>
    </DndProvider>
  );
}

export default App;