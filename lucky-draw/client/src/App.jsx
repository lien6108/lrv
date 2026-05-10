import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import ParticipantRoom from './components/ParticipantRoom';
import PresentPage from './components/PresentPage';
import { Gift, MonitorPlay } from 'lucide-react';

function App() {
  return (
    <Router>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Gift color="var(--primary-color)" /> 線上抽獎系統
        </h2>
      </div>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<ParticipantRoom />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/present" element={<PresentPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
