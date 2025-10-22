import React, { useState, useEffect, useCallback } from 'react';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import ConfigViewer from './ConfigViewer';
import MetricsDashboard from './MetricsDashboard';
import useNginxAPI from '../hooks/useNginxAPI';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NginxTaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfigViewerOpen, setIsConfigViewerOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [configContent, setConfigContent] = useState('');
  const [metrics, setMetrics] = useState(null);
  const { loading, error, getTasks, deleteTask, getConfig, getMetrics, createTask, updateTask } = useNginxAPI();

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data.tasks);
    } catch (err) {
      // Error is already handled by the hook's toast message
    }
  }, [getTasks]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleCreate = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  const handleEdit = task => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = async taskId => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        toast.success('Task deleted successfully');
        fetchTasks();
      } catch (err) {
        // Error is already handled by the hook's toast message
      }
    }
  };

  const handleViewConfig = async taskId => {
    try {
      const config = await getConfig(taskId);
      setConfigContent(config);
      setIsConfigViewerOpen(true);
    } catch (err) {
      // Error is already handled by the hook's toast message
    }
  };

  const handleViewMetrics = async taskId => {
    try {
        const metricsData = await getMetrics(taskId);
        setMetrics(metricsData);
        setIsMetricsOpen(true);
    } catch (err) {
        // Error is already handled by the hook's toast message
    }
  };

  const handleFormSubmit = async taskData => {
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, taskData);
        toast.success('Task updated successfully');
      } else {
        await createTask(taskData);
        toast.success('Task created successfully');
      }
      setIsFormOpen(false);
      fetchTasks();
    } catch (err) {
      // Error is already handled by the hook's toast message
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Nginx Task Manager</h1>

      <div className="mb-4">
        <button onClick={handleCreate} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create New Task
        </button>
      </div>

      {loading && <p>Loading tasks...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <TaskList
          tasks={tasks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewConfig={handleViewConfig}
          onViewMetrics={handleViewMetrics}
        />
      )}

      {isFormOpen && (
        <TaskForm
          task={selectedTask}
          onSubmit={handleFormSubmit}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {isConfigViewerOpen && (
        <ConfigViewer
          config={configContent}
          onClose={() => setIsConfigViewerOpen(false)}
        />
      )}

      {isMetricsOpen && (
        <MetricsDashboard
          metrics={metrics}
          onClose={() => setIsMetricsOpen(false)}
        />
      )}
    </div>
  );
};

export default NginxTaskManager;
