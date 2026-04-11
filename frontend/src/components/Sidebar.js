// Import React
import React, { useState } from 'react';

// Import icons
import {
  FaTachometerAlt,
  FaDesktop,
  FaCloud,
  FaMicrochip,
  FaLink,
  FaQuestionCircle,
} from 'react-icons/fa';

const Sidebar = () => {
  // =========================
  // Track active menu item
  // =========================
  const [active, setActive] = useState('Dashboard');

  // =========================
  // Menu items
  // =========================
  const menuItems = [
    { name: 'Dashboard', icon: <FaTachometerAlt /> },
    { name: 'Machines', icon: <FaDesktop /> },
    { name: 'Software', icon: <FaCloud /> },
    { name: 'Hardware', icon: <FaMicrochip /> },
    { name: 'Quick Links', icon: <FaLink /> },
    { name: 'Help', icon: <FaQuestionCircle /> },
  ];

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.logo}>IT Tracker</h2>

      {/* Menu */}
      {menuItems.map((item) => (
        <div
          key={item.name}
          style={{
            ...styles.item,
            ...(active === item.name ? styles.active : {}),
          }}
          onClick={() => setActive(item.name)}
        >
          <span style={styles.icon}>{item.icon}</span>
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
};

// =========================
// Styles
// =========================
const styles = {
  sidebar: {
    width: '220px',
    height: '100vh',
    background: 'linear-gradient(180deg, #3ba57d, #6cc3a0)',
    color: 'white',
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
  },

  logo: {
    textAlign: 'center',
    marginBottom: '30px',
  },

  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    cursor: 'pointer',
    transition: '0.2s',
  },

  icon: {
    marginRight: '10px',
  },

  active: {
    background: 'rgba(255,255,255,0.2)',
    borderLeft: '4px solid white',
  },
};

export default Sidebar;