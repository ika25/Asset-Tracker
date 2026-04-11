import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import {
  FaTachometerAlt,
  FaDesktop,
  FaMap,
  FaCloud,
  FaMicrochip,
  FaChevronDown,
  FaChevronRight,
  FaPlus,
  FaList,
} from 'react-icons/fa';

const Sidebar = () => {
  const [expandedMenu, setExpandedMenu] = useState(null);

  const menu = [
    { name: 'Dashboard', path: '/', icon: <FaTachometerAlt /> },
    {
      name: 'Machines',
      icon: <FaDesktop />,
      submenu: [
        { name: 'Add New Machine', path: '/devices?view=add', icon: <FaPlus /> },
        { name: 'All Machines', path: '/devices?view=list', icon: <FaList /> },
      ],
    },
    { name: 'Floor Map', path: '/floor', icon: <FaMap /> },
    { name: 'Software', path: '/software', icon: <FaCloud /> },
    { name: 'Hardware', path: '/hardware', icon: <FaMicrochip /> },
  ];

  const toggleMenu = (name) => {
    setExpandedMenu(expandedMenu === name ? null : name);
  };

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.logo}>IT Tracker</h2>

      {menu.map((item) => (
        <div key={item.name}>
          {/* Main Menu Item */}
          {item.submenu ? (
            <button
              style={styles.menuButton}
              onClick={() => toggleMenu(item.name)}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
              <span>
                {expandedMenu === item.name ? (
                  <FaChevronDown size={12} />
                ) : (
                  <FaChevronRight size={12} />
                )}
              </span>
            </button>
          ) : (
            <NavLink
              to={item.path}
              style={({ isActive }) => ({
                ...styles.item,
                ...(isActive ? styles.active : {}),
              })}
            >
              <span style={styles.icon}>{item.icon}</span>
              {item.name}
            </NavLink>
          )}

          {/* Submenu Items */}
          {item.submenu && expandedMenu === item.name && (
            <div style={styles.submenu}>
              {item.submenu.map((subitem) => (
                <NavLink
                  key={subitem.name}
                  to={subitem.path}
                  style={({ isActive }) => ({
                    ...styles.subitem,
                    ...(isActive ? styles.subitemActive : {}),
                  })}
                >
                  <span style={styles.icon}>{subitem.icon}</span>
                  {subitem.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
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
    height: '100vh',
    overflowY: 'auto',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '30px',
    marginTop: 0,
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: '16px',
    gap: '10px',
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
    display: 'flex',
    alignItems: 'center',
  },
  active: {
    background: 'rgba(255,255,255,0.2)',
    borderLeft: '4px solid white',
    paddingLeft: '11px',
  },
  submenu: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingLeft: '20px',
  },
  subitem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    textDecoration: 'none',
    color: 'white',
    fontSize: '14px',
  },
  subitemActive: {
    background: 'rgba(255,255,255,0.2)',
    borderLeft: '4px solid white',
    paddingLeft: '11px',
  },
};

export default Sidebar;