import React, { useContext } from 'react';
import Sidebar from './Sidebar';
import { DeviceContext } from '../contexts/DeviceContext';

const MainLayout = ({ children }) => {
  const { deviceType } = useContext(DeviceContext);

  const mainContentClass = `flex-grow w-full ${
    deviceType === 'mobile' ? 'p-4' : 'p-8'
  }`;

  return (
    <div className="flex min-h-screen bg-background dark:bg-dark-background">
      <Sidebar deviceType={deviceType} />
      <main className={mainContentClass}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;