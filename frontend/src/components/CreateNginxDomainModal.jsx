import React, { useState } from 'react';
import { X } from 'lucide-react';
import { addNginxTask } from '../services/nginxService';
import { toast } from 'react-toastify';

const CreateNginxDomainModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    domain: '',
    proxyPass: '',
    enableSSL: true,
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.domain.trim() || !formData.proxyPass.trim()) {
      setError('Domain and Proxy Pass URL cannot be empty.');
      return;
    }
    try {
      await addNginxTask(formData);
      toast.success('Nginx task added successfully.');
      setFormData({ domain: '', proxyPass: '', enableSSL: true });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add Nginx task.');
      toast.error('Failed to add Nginx task.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="w-full max-w-md p-6 bg-white dark:bg-dark-surface rounded-lg shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Add New Domain</h3>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Domain</label>
            <input
              type="text"
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleInputChange}
              className="w-full mt-1 px-4 py-2 border rounded-md bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-600 focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
              placeholder="e.g., myapp.example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="proxyPass" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Proxy Pass URL</label>
            <input
              type="text"
              id="proxyPass"
              name="proxyPass"
              value={formData.proxyPass}
              onChange={handleInputChange}
              className="w-full mt-1 px-4 py-2 border rounded-md bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-600 focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
              placeholder="e.g., http://localhost:3000"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableSSL"
              name="enableSSL"
              checked={formData.enableSSL}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary focus:ring-primary dark:focus:ring-dark-primary"
            />
            <label htmlFor="enableSSL" className="ml-2 block text-sm text-text-secondary dark:text-dark-text-secondary">Enable SSL (Certbot)</label>
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
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80"
            >
              Add Domain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNginxDomainModal;
