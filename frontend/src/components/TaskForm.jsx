import React, { useState, useEffect } from 'react';

const TaskForm = ({ task, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    domain: '',
    port: '',
    cors_origins: [],
    upstreams: [],
    ssl: { enabled: false, email: '' },
  });

  useEffect(() => {
    if (task) {
      setFormData({
        domain: task.domain || '',
        port: task.port || '',
        cors_origins: task.cors_origins || [],
        upstreams: task.upstreams || [],
        ssl: task.ssl || { enabled: false, email: '' },
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('ssl.')) {
      const sslField = name.split('.')[1];
      setFormData(prev => ({ ...prev, ssl: { ...prev.ssl, [sslField]: type === 'checkbox' ? checked : value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleArrayChange = (e, index, field) => {
    const { value } = e.target;
    const list = [...formData[field]];
    list[index] = value;
    setFormData(prev => ({ ...prev, [field]: list }));
  };

  const handleUpstreamChange = (e, index, upstreamField) => {
    const { value } = e.target;
    const list = [...formData.upstreams];
    list[index][upstreamField] = value;
    setFormData(prev => ({...prev, upstreams: list}));
  }

  const addArrayItem = (field) => {
    const newItem = field === 'upstreams' ? { host: '', port: '' } : '';
    setFormData(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
  };

  const removeArrayItem = (index, field) => {
    const list = [...formData[field]];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, [field]: list }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      port: parseInt(formData.port, 10),
      // Filter out empty strings from arrays
      cors_origins: formData.cors_origins.filter(Boolean),
      upstreams: formData.upstreams.filter(u => u.host && u.port),
    };
    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">{task ? 'Edit Task' : 'Create Task'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Form fields will go here */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Domain</label>
            <input type="text" name="domain" value={formData.domain} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Port</label>
            <input type="number" name="port" value={formData.port} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          {/* CORS Origins */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">CORS Origins</label>
            {formData.cors_origins.map((origin, index) => (
              <div key={index} className="flex items-center mb-2">
                <input type="url" value={origin} onChange={(e) => handleArrayChange(e, index, 'cors_origins')} className="w-full p-2 border rounded" />
                <button type="button" onClick={() => removeArrayItem(index, 'cors_origins')} className="ml-2 text-red-500">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('cors_origins')} className="text-blue-500">Add Origin</button>
          </div>
          {/* Upstreams */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Upstream Servers</label>
            {formData.upstreams.map((upstream, index) => (
              <div key={index} className="flex items-center mb-2 space-x-2">
                <input type="text" placeholder="Host IP" value={upstream.host} onChange={(e) => handleUpstreamChange(e, index, 'host')} className="w-1/2 p-2 border rounded" />
                <input type="number" placeholder="Port" value={upstream.port} onChange={(e) => handleUpstreamChange(e, index, 'port')} className="w-1/2 p-2 border rounded" />
                <button type="button" onClick={() => removeArrayItem(index, 'upstreams')} className="text-red-500">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('upstreams')} className="text-blue-500">Add Upstream</button>
          </div>
          {/* SSL */}
          <div className="mb-4">
            <label className="flex items-center">
              <input type="checkbox" name="ssl.enabled" checked={formData.ssl.enabled} onChange={handleChange} className="mr-2" />
              Enable SSL (Let's Encrypt)
            </label>
            {formData.ssl.enabled && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Email for SSL</label>
                <input type="email" name="ssl.email" value={formData.ssl.email} onChange={handleChange} className="w-full p-2 border rounded" placeholder="you@example.com" />
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
