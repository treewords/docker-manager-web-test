import React, { useContext } from 'react';
import Sidebar from './Sidebar';
import { DeviceContext } from '../contexts/DeviceContext';

const MainLayout = ({ children }) => {
  const { deviceType } = useContext(DeviceContext);

  const mainContentClass = `flex-grow w-full ${
    deviceType === 'mobile' ? 'p-4' : 'p-8'
  } relative`;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Animated Gradient Orbs - only visible in dark mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none dark:block hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Background - only visible in dark mode */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-10 dark:block hidden pointer-events-none"></div>

      <Sidebar deviceType={deviceType} />
      <main className={mainContentClass}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;