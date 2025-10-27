import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SprintManagement from './components/SprintManagement';
import KanbanBoard from './components/KanbanBoard';
import TeamManagement from './components/TeamManagement';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', component: <Dashboard /> },
    { id: 'sprints', label: '🎯 Sprints', component: <SprintManagement /> },
    { id: 'kanban', label: '🎪 Kanban', component: <KanbanBoard /> },
    { id: 'team', label: '👥 Equipo', component: <TeamManagement /> }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Scrum Dashboard - Telegram JSF</h1>
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
  );
}

export default App;