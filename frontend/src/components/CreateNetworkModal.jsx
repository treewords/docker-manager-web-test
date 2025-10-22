import React, { useState } from 'react';
import { X } from 'lucide-react';

const CreateNetworkModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [driver, setDriver] = useState('bridge');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert('Network name is required.');
      return;
    }
    onCreate({ name, driver });
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
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Create New Network</h3>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="network-name" className={labelClass}>Network Name <span className="text-red-500">*</span></label>
            <input id="network-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., my-app-network" className={inputClass} required />
          </div>
          <div>
            <label htmlFor="network-driver" className={labelClass}>Driver</label>
            <select id="network-driver" value={driver} onChange={(e) => setDriver(e.target.value)} className={inputClass}>
              <option value="bridge">bridge</option>
              <option value="overlay">overlay</option>
              <option value="macvlan">macvlan</option>
              <option value="host">host</option>
              <option value="none">none</option>
            </select>
          </div>
          <div className="flex justify-end pt-4 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNetworkModal;