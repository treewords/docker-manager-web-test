import React, { useState } from 'react';
import { X } from 'lucide-react';

const CreateVolumeModal = ({ isOpen, onClose, onCreate }) => {
  const [volumeName, setVolumeName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!volumeName.trim()) {
      setError('Volume name cannot be empty.');
      return;
    }
    try {
      await onCreate(volumeName);
      setVolumeName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create volume.');
    }
  };

  if (!isOpen) {
    return null;
  }

  const inputClass = "w-full px-3 py-2 mt-1 text-text-primary dark:text-dark-text-primary bg-background dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary";
  const labelClass = "block text-sm font-medium text-text-secondary dark:text-dark-text-secondary text-left";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300">
      <div className="w-full max-w-md p-6 bg-white dark:bg-dark-surface rounded-lg shadow-xl transform transition-all duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Create New Volume</h3>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="volume-name" className={labelClass}>Volume Name <span className="text-red-500">*</span></label>
            <input
              id="volume-name"
              type="text"
              placeholder="e.g., my-data-volume"
              value={volumeName}
              onChange={(e) => setVolumeName(e.target.value)}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end pt-4 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80"
            >
              Create Volume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVolumeModal;