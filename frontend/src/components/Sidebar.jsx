import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Home, Box, Database, GitMerge, Settings, HardDrive, ChevronsLeft, ChevronsRight, LogIn, LogOut, Container } from 'lucide-react';

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
    `flex items-center p-3 rounded-xl transition-all duration-200 group relative ${
      collapsed ? 'justify-center' : ''
    } ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`;

  const iconClasses = `transition-all ${collapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3'}`;

  return (
    <div className={`bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/50 text-white h-screen flex flex-col shadow-2xl transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo/Header */}
      <div className="p-4 border-b border-slate-800/50 flex justify-between items-center">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Container className="w-7 h-7 text-blue-500" />
              <div className="absolute -inset-1 bg-blue-500/20 blur-md rounded-full -z-10"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">DockerMist</h1>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        <NavLink to="/dashboard" className={navLinkClasses} title="Home">
          <Home className={iconClasses} /> {!collapsed && <span className="font-medium">Home</span>}
        </NavLink>
        <NavLink to="/containers" className={navLinkClasses} title="Containers">
          <Box className={iconClasses} /> {!collapsed && <span className="font-medium">Containers</span>}
        </NavLink>
        <NavLink to="/images" className={navLinkClasses} title="Images">
          <HardDrive className={iconClasses} /> {!collapsed && <span className="font-medium">Images</span>}
        </NavLink>
        <NavLink to="/networks" className={navLinkClasses} title="Networks">
          <GitMerge className={iconClasses} /> {!collapsed && <span className="font-medium">Networks</span>}
        </NavLink>
        <NavLink to="/volumes" className={navLinkClasses} title="Volumes">
          <Database className={iconClasses} /> {!collapsed && <span className="font-medium">Volumes</span>}
        </NavLink>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-800/50 space-y-1.5">
        <NavLink to="/settings" className={navLinkClasses} title="User Settings">
          <Settings className={iconClasses} /> {!collapsed && <span className="font-medium">Settings</span>}
        </NavLink>
        {token ? (
          <button
            onClick={handleLogout}
            className={`${navLinkClasses({ isActive: false })} w-full`}
            title="Logout"
          >
            <LogOut className={iconClasses} /> {!collapsed && <span className="font-medium">Log Out</span>}
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className={`${navLinkClasses({ isActive: false })} w-full`}
            title="Login"
          >
            <LogIn className={iconClasses} /> {!collapsed && <span className="font-medium">Login</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
