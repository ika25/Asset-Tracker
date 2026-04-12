// Import React
import React from 'react';

// Router
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Sidebar
import Sidebar from './components/Sidebar';



// Pages
import Dashboard from './pages/Dashboard';
import FloorPage from './pages/FloorPage';
import DevicesPage from './pages/DevicesPage';
import SoftwarePage from './pages/SoftwarePage';
import HardwarePage from './pages/HardwarePage';

function App() {
  return (
    <Router>
      {/* Main layout */}
      <div style={styles.container}>
        
        {/* Sidebar always visible */}
        <Sidebar />

        {/* Page content */}
        <div style={styles.content}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/floor" element={<FloorPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/software" element={<SoftwarePage />} />
            <Route path="/hardware" element={<HardwarePage />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

// Layout styles
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
  },
  content: {
    flex: 1,
    padding: '20px',
    background: '#f5f6fa',
  },
};

export default App;
