import React, { useState, useEffect } from 'react';
import { getImages, removeImage } from '../services/imageService';
import PullImageModal from '../components/PullImageModal';
import BuildImageModal from '../components/BuildImageModal';
import BuildLogViewer from '../components/BuildLogViewer';
import { Download, Hammer, Trash2 } from 'lucide-react';

const ImagesPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPullModalOpen, setPullModalOpen] = useState(false);
  const [isBuildModalOpen, setBuildModalOpen] = useState(false);
  const [buildingImage, setBuildingImage] = useState(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await getImages();
      setImages(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch images. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleRemoveImage = async (imageId) => {
    if (window.confirm('Are you sure you want to remove this image? This action cannot be undone.')) {
      try {
        await removeImage(imageId);
        alert(`Image ${imageId} removed successfully.`);
        fetchImages(); // Refresh the list
      } catch (err) {
        alert(`Failed to remove image: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleBuildSuccess = (imageName, tag) => {
    setBuildModalOpen(false);
    const fullImageName = tag ? `${imageName}:${tag}` : imageName;
    setBuildingImage(fullImageName);
  };

  const handleBuildLogClose = () => {
    setBuildingImage(null);
    fetchImages(); // Refresh image list after build
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return <div className="text-text-secondary dark:text-dark-text-secondary">Loading images...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Images</h1>
        <div className="flex space-x-2">
          <button onClick={() => setPullModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80">
            <Download className="w-4 h-4 mr-2" />
            Pull Image
          </button>
          <button onClick={() => setBuildModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-80">
            <Hammer className="w-4 h-4 mr-2" />
            Build Image
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Tags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
            {images.map((image) => (
              <tr key={image.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary dark:text-dark-text-primary">{image.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{image.tags && image.tags.join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{formatSize(image.size)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{formatDate(image.created)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="p-2 text-text-secondary dark:text-dark-text-secondary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500"
                    title="Remove Image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPullModalOpen && (
        <PullImageModal
          onClose={() => setPullModalOpen(false)}
          onSuccess={() => {
            setPullModalOpen(false);
            fetchImages();
            alert('Image pull started successfully.');
          }}
        />
      )}

      {isBuildModalOpen && (
        <BuildImageModal
          onClose={() => setBuildModalOpen(false)}
          onSuccess={handleBuildSuccess}
        />
      )}

      {buildingImage && (
        <BuildLogViewer
          imageName={buildingImage}
          onClose={handleBuildLogClose}
        />
      )}
    </div>
  );
};

export default ImagesPage;