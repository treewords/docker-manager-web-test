import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Home, Box, Database, GitMerge, Settings, HardDrive, ChevronsLeft, ChevronsRight, LogIn, LogOut, Server } from 'lucide-react';

const Sidebar = ({ deviceType }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [deviceType]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center p-4 rounded-lg transition-colors ${
      collapsed ? 'justify-center' : ''
    } ${
      isActive
        ? 'bg-primary dark:bg-dark-primary text-white'
        : 'text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
    }`;

  const iconClasses = `transition-all ${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`;

  return (
    <div className={`bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary h-screen flex flex-col shadow-lg transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        {!collapsed && <h1 className="text-2xl font-bold text-primary dark:text-dark-primary">Dashboard</h1>}
        <button onClick={toggleCollapse} className="text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary">
          {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        <NavLink to="/dashboard" className={navLinkClasses} title="Home">
          <Home className={iconClasses} /> {!collapsed && 'Home'}
        </NavLink>
        <NavLink to="/containers" className={navLinkClasses} title="Containers">
          <Box className={iconClasses} /> {!collapsed && 'Containers'}
        </NavLink>
        <NavLink to="/images" className={navLinkClasses} title="Images">
          <HardDrive className={iconClasses} /> {!collapsed && 'Images'}
        </NavLink>
        <NavLink to="/networks" className={navLinkClasses} title="Networks">
          <GitMerge className={iconClasses} /> {!collapsed && 'Networks'}
        </NavLink>
        <NavLink to="/volumes" className={navLinkClasses} title="Volumes">
          <Database className={iconClasses} /> {!collapsed && 'Volumes'}
        </NavLink>
        <NavLink to="/nginx" className={navLinkClasses} title="Nginx">
          <Server className={iconClasses} /> {!collapsed && 'Nginx'}
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <NavLink to="/settings" className={navLinkClasses} title="User Settings">
          <Settings className={iconClasses} /> {!collapsed && 'User Settings'}
        </NavLink>
        {token ? (
          <button onClick={handleLogout} className={`${navLinkClasses({ isActive: false })} w-full`} title="Logout">
            <LogOut className={iconClasses} /> {!collapsed && 'Log Out'}
          </button>
        ) : (
          <button onClick={handleLogin} className={`${navLinkClasses({ isActive: false })} w-full`} title="Login">
            <LogIn className={iconClasses} /> {!collapsed && 'Login'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
