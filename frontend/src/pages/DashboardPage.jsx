import React from 'react';

const DashboardPage = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-6">
      </header>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Welcome to Docker Manager Dashboard</h2>
        <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">Select an option from the sidebar to get started.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
