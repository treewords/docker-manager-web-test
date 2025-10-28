import React, { useState } from 'react';
import { buildImage } from '../services/imageService';
import { X, Hammer } from 'lucide-react';

const BuildImageModal = ({ onClose, onSuccess }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const [tag, setTag] = useState('latest');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoUrl || !imageName) {
      setError('Both repository URL and image name are required.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      // We don't await this because we want to close the modal immediately
      buildImage(repoUrl, imageName, tag);
      onSuccess(imageName, tag);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start image build.');
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 mt-1 text-text-primary dark:text-dark-text-primary bg-background dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary";
  const labelClass = "block text-sm font-medium text-text-secondary dark:text-dark-text-secondary text-left";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300">
      <div className="w-full max-w-lg p-6 bg-white dark:bg-dark-surface rounded-lg shadow-xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Build Image from Git</h3>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="repo-url" className={labelClass}>Git Repository URL <span className="text-red-500">*</span></label>
            <input
              id="repo-url"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="e.g., https://github.com/user/repo.git"
              className={inputClass}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label htmlFor="image-name" className={labelClass}>Image Name <span className="text-red-500">*</span></label>
              <input
                id="image-name"
                type="text"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="e.g., my-app"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="tag" className={labelClass}>Tag</label>
              <input
                id="tag"
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g., latest"
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end pt-4 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-80 disabled:bg-opacity-50">
              <Hammer className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Building...' : 'Build'}
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

export default BuildImageModal;