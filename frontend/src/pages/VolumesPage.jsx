import React, { useState, useEffect } from 'react';
import { getVolumes, createVolume, removeVolume } from '../services/volumeService';
import CreateVolumeModal from '../components/CreateVolumeModal';
import { Trash2, PlusCircle } from 'lucide-react';

const VolumesPage = () => {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchVolumes = async () => {
    try {
      setLoading(true);
      const data = await getVolumes();
      setVolumes(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch volumes. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  const handleCreateVolume = async (volumeName) => {
    try {
      await createVolume(volumeName);
      fetchVolumes(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to create volume.');
      // Re-throw to be caught in the modal
      throw err;
    }
  };

  const handleRemoveVolume = async (volumeName) => {
    if (window.confirm(`Are you sure you want to remove the volume '${volumeName}'?`)) {
      try {
        await removeVolume(volumeName);
        fetchVolumes(); // Refresh the list
      } catch (err) {
        setError(err.message || `Failed to remove volume '${volumeName}'.`);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-text-secondary dark:text-dark-text-secondary">Loading volumes...</div>;
  }

  if (error && !isModalOpen) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Volumes</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Volume
        </button>
      </header>

      <CreateVolumeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateVolume}
      />

      <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Mountpoint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
            {volumes.map((volume) => (
              <tr key={volume.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary dark:text-dark-text-primary">{volume.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{volume.driver}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{volume.mountpoint}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{formatDate(volume.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleRemoveVolume(volume.name)}
                    className="p-2 text-text-secondary dark:text-dark-text-secondary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500"
                    title="Remove Volume"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VolumesPage;