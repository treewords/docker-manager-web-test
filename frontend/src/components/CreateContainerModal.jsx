import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getVolumes } from '../services/volumeService';
import { X, Plus, Trash2 } from 'lucide-react';

const CreateContainerModal = ({ onClose, onSuccess }) => {
  const [image, setImage] = useState('');
  const [name, setName] = useState('');
  const [ports, setPorts] = useState(['']);
  const [envVars, setEnvVars] = useState(['']);
  const [volumeMounts, setVolumeMounts] = useState([{ volume: '', path: '' }]);
  const [availableVolumes, setAvailableVolumes] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchVolumes = async () => {
      try {
        const volumes = await getVolumes();
        setAvailableVolumes(volumes);
      } catch (err) {
        console.error("Failed to fetch volumes", err);
        // Do not set a user-facing error here as it might be confusing
      }
    };
    fetchVolumes();
  }, []);

  const handleAddField = (setter, fields, defaultVal = '') => {
    setter([...fields, defaultVal]);
  };

  const handleRemoveField = (setter, fields, index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setter(newFields);
  };

  const handleFieldChange = (setter, fields, index, value, fieldName) => {
    const newFields = [...fields];
    if (typeof newFields[index] === 'object') {
      newFields[index][fieldName] = value;
    } else {
      newFields[index] = value;
    }
    setter(newFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Image name is required.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const payload = {
      image,
      name: name || undefined,
      ports: ports.filter(p => p && /^\d+:\d+$/.test(p)),
      env: envVars.filter(e => e && /^.+=.+$/.test(e)),
      volumes: volumeMounts
        .filter(v => v.volume && v.path)
        .map(v => `${v.volume}:${v.path}`),
    };

    try {
      await api.post('/containers/create', payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create container.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 mt-1 text-text-primary dark:text-dark-text-primary bg-background dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary";
  const labelClass = "block text-sm font-medium text-text-secondary dark:text-dark-text-secondary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300">
      <div className="w-full max-w-lg p-6 bg-white dark:bg-dark-surface rounded-lg shadow-xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Create New Container</h3>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label htmlFor="image-name" className={labelClass}>Image <span className="text-red-500">*</span></label>
            <input id="image-name" type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="e.g., nginx:latest" className={inputClass} required />
          </div>
          <div>
            <label htmlFor="container-name" className={labelClass}>Container Name (Optional)</label>
            <input id="container-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., my-web-server" className={inputClass} />
          </div>

          {/* Port Mappings */}
          <div>
            <label className={labelClass}>Port Mappings (host:container)</label>
            {ports.map((port, index) => (
              <div key={index} className="flex items-center mt-1 space-x-2">
                <input type="text" value={port} onChange={(e) => handleFieldChange(setPorts, ports, index, e.target.value)} placeholder="e.g., 8080:80" className={`${inputClass} flex-grow`} />
                <button type="button" onClick={() => handleRemoveField(setPorts, ports, index)} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => handleAddField(setPorts, ports)} className="flex items-center mt-2 text-sm text-primary dark:text-dark-primary hover:opacity-80">
              <Plus size={16} className="mr-1" /> Add Port
            </button>
          </div>

          {/* Environment Variables */}
          <div>
            <label className={labelClass}>Environment Variables (KEY=VALUE)</label>
            {envVars.map((env, index) => (
              <div key={index} className="flex items-center mt-1 space-x-2">
                <input type="text" value={env} onChange={(e) => handleFieldChange(setEnvVars, envVars, index, e.target.value)} placeholder="e.g., DB_HOST=database" className={`${inputClass} flex-grow`} />
                <button type="button" onClick={() => handleRemoveField(setEnvVars, envVars, index)} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => handleAddField(setEnvVars, envVars)} className="flex items-center mt-2 text-sm text-primary dark:text-dark-primary hover:opacity-80">
              <Plus size={16} className="mr-1" /> Add Variable
            </button>
          </div>

          {/* Volume Mounts */}
          <div>
            <label className={labelClass}>Volume Mounts (volume:path)</label>
            {volumeMounts.map((mount, index) => (
              <div key={index} className="flex items-center mt-1 space-x-2">
                <select value={mount.volume} onChange={(e) => handleFieldChange(setVolumeMounts, volumeMounts, index, e.target.value, 'volume')} className={`${inputClass} flex-grow`}>
                  <option value="" disabled>Select a volume</option>
                  {availableVolumes.map(vol => <option key={vol.name} value={vol.name}>{vol.name}</option>)}
                </select>
                <input type="text" value={mount.path} onChange={(e) => handleFieldChange(setVolumeMounts, volumeMounts, index, e.target.value, 'path')} placeholder="/path/in/container" className={`${inputClass} flex-grow`} />
                <button type="button" onClick={() => handleRemoveField(setVolumeMounts, volumeMounts, index)} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => handleAddField(setVolumeMounts, volumeMounts, { volume: '', path: '' })} className="flex items-center mt-2 text-sm text-primary dark:text-dark-primary hover:opacity-80">
              <Plus size={16} className="mr-1" /> Add Volume Mount
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end pt-4 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80 disabled:bg-opacity-50">
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CreateContainerModal;