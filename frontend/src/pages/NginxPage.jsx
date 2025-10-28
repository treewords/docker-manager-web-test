import React, { useState, useEffect } from 'react';
import { getNginxTasks, updateNginxTaskStatusToDelete } from '../services/nginxService';
import { toast } from 'react-toastify';
import CreateNginxDomainModal from '../components/CreateNginxDomainModal';
import { PlusCircle } from 'lucide-react';

const NginxPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const tasksData = await getNginxTasks();
      setTasks(tasksData);
    } catch (error) {
      toast.error('Failed to fetch Nginx tasks.');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await updateNginxTaskStatusToDelete(taskId);
      toast.success('Nginx task marked for deletion.');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to mark Nginx task for deletion.');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Nginx Domain Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-dark-primary rounded-md hover:bg-opacity-80"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Domain
        </button>
      </header>

      <CreateNginxDomainModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
      />

      <div>
        <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-4">Nginx Tasks</h2>
        <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Proxy Pass</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">SSL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-text-primary dark:text-dark-text-primary">{task.domain}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-primary dark:text-dark-text-primary">{task.proxyPass}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-primary dark:text-dark-text-primary">{task.enableSSL ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-primary dark:text-dark-text-primary">{task.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NginxPage;
