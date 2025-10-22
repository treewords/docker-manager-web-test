import React from 'react';
import { Edit, Trash2, FileText, BarChart2 } from 'lucide-react';

const TaskList = ({ tasks, onEdit, onDelete, onViewConfig, onViewMetrics }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-dark-surface">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Domain</th>
            <th className="py-2 px-4 border-b">Port</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Created At</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td className="py-2 px-4 border-b">{task.domain}</td>
              <td className="py-2 px-4 border-b">{task.port}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded-full text-white text-xs ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </td>
              <td className="py-2 px-4 border-b">{new Date(task.createdAt).toLocaleString()}</td>
              <td className="py-2 px-4 border-b">
                <button onClick={() => onEdit(task)} className="mr-2 text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                <button onClick={() => onDelete(task.id)} className="mr-2 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                <button onClick={() => onViewConfig(task.id)} className="mr-2 text-gray-500 hover:text-gray-700"><FileText size={18} /></button>
                <button onClick={() => onViewMetrics(task.id)} className="text-purple-500 hover:text-purple-700"><BarChart2 size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList;
