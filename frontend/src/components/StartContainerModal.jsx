import React, { useState, useEffect } from 'react';
import { X, PlayCircle, Loader2 } from 'lucide-react';
import { getContainers, startContainer } from '../services/containerService';

const StartContainerModal = ({ isOpen, onClose, onSuccess }) => {
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchStoppedContainers();
    }
  }, [isOpen]);

  const fetchStoppedContainers = async () => {
    setLoading(true);
    setError('');
    try {
      const allContainers = await getContainers();
      const stopped = allContainers.filter(c => c.state !== 'running');
      setContainers(stopped);
      if (stopped.length > 0) {
        setSelectedContainer(stopped[0].id);
      }
    } catch (err) {
      setError('Failed to fetch containers');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!selectedContainer) {
      setError('Please select a container');
      return;
    }
    setStarting(true);
    setError('');
    try {
      await startContainer(selectedContainer);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start container');
    } finally {
      setStarting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 mt-1 text-text-primary dark:text-dark-text-primary bg-background dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary";
  const labelClass = "block text-sm font-medium text-text-secondary dark:text-dark-text-secondary text-left";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300">
      <div className="w-full max-w-md p-6 bg-white dark:bg-dark-surface rounded-lg shadow-xl transform transition-all duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Start Container</h3>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : containers.length === 0 ? (
            <div className="py-8 text-center text-text-secondary dark:text-dark-text-secondary">
              <p>No stopped containers available.</p>
              <p className="text-sm mt-2">All containers are already running.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="container-select" className={labelClass}>
                Select Container <span className="text-red-500">*</span>
              </label>
              <select
                id="container-select"
                value={selectedContainer}
                onChange={(e) => setSelectedContainer(e.target.value)}
                className={inputClass}
              >
                {containers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.name} ({container.state})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end pt-4 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={starting || containers.length === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80 disabled:bg-opacity-50"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {starting ? 'Starting...' : 'Start'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartContainerModal;
