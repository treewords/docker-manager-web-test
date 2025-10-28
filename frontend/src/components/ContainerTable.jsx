import React from 'react';
import ActionButtons from './ActionButtons';
import { Eye } from 'lucide-react';

const ContainerTable = ({ containers, refreshContainers, onViewLogs }) => {
  const getStatusColor = (state) => {
    switch (state) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'exited':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-dark-surface rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-text-secondary dark:text-dark-text-secondary uppercase">Name</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-text-secondary dark:text-dark-text-secondary uppercase">Image</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-text-secondary dark:text-dark-text-secondary uppercase">Status</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-text-secondary dark:text-dark-text-secondary uppercase">CPU %</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-text-secondary dark:text-dark-text-secondary uppercase">Memory</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-text-secondary dark:text-dark-text-secondary uppercase">Ports</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-text-secondary dark:text-dark-text-secondary uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
          {containers.map((container) => (
            <tr key={container.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{container.name}</div>
                <div className="text-sm text-text-secondary dark:text-dark-text-secondary">{container.id}</div>
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{container.image}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(container.state)}`}>
                  {container.state}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{container.CpuUsage}</td>
              <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{container.MemUsage}</td>
              <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
                {container.ports.map(p => `${p.IP ? p.IP + ':' : ''}${p.PublicPort}->${p.PrivatePort}/${p.Type}`).join(', ')}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onViewLogs(container.id)}
                    className="p-2 text-text-secondary dark:text-dark-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-dark-primary"
                    title="View Logs"
                  >
                    <Eye size={18} />
                  </button>
                  <ActionButtons containerId={container.id} containerState={container.state} onActionSuccess={refreshContainers} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContainerTable;