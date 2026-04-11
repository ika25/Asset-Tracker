import React from 'react';
import { NavLink } from 'react-router-dom';

import {
  FaTachometerAlt,
  FaDesktop,
  FaMap,
  FaCloud,
  FaMicrochip,
} from 'react-icons/fa';

const Sidebar = () => {
  const menu = [
    { name: 'Dashboard', path: '/', icon: <FaTachometerAlt /> },
    { name: 'Floor Map', path: '/floor', icon: <FaMap /> },
    { name: 'Devices', path: '/devices', icon: <FaDesktop /> },
    { name: 'Software', path: '/software', icon: <FaCloud /> },
    { name: 'Hardware', path: '/hardware', icon: <FaMicrochip /> },
  ];

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.logo}>IT Tracker</h2>

      {menu.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive ? styles.active : {}),
          })}
        >
          <span style={styles.icon}>{item.icon}</span>
          {item.name}
        </NavLink>
      ))}
    </div>
  );
};

const styles = {
  sidebar: {
    width: '220px',
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
    textDecoration: 'none',
    color: 'white',
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