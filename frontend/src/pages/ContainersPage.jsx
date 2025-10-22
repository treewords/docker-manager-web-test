import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ContainerTable from '../components/ContainerTable';
import CreateContainerModal from '../components/CreateContainerModal';
import LogViewerModal from '../components/LogViewerModal';
import { PlusCircle, RefreshCw, Search } from 'lucide-react';

const ContainersPage = () => {
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContainers = async () => {
    try {
      const response = await api.get('/containers');
      setContainers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch containers.');
      console.error(err);
    } finally {
      // This ensures the initial loading indicator is turned off and never shown again.
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleViewLogs = (containerId) => {
    setSelectedContainerId(containerId);
    setIsLogModalOpen(true);
  };

  const filteredContainers = searchTerm
    ? containers.filter((container) =>
        container.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : containers;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Containers</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary dark:text-dark-text-secondary w-5 h-5" />
            <input
              type="text"
              name="search-containers"
              placeholder="Search containers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-600 focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary"
            />
          </div>
          <button
            onClick={() => fetchContainers()}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-dark-primary rounded-md hover:bg-opacity-80"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-secondary dark:bg-dark-secondary rounded-md hover:bg-opacity-80"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create
          </button>
        </div>
      </header>

      {isLoading && <p className="text-text-secondary dark:text-dark-text-secondary">Loading containers...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && (
        <ContainerTable
          containers={filteredContainers}
          refreshContainers={fetchContainers}
          onViewLogs={handleViewLogs}
        />
      )}

      {isCreateModalOpen && (
        <CreateContainerModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchContainers();
          }}
        />
      )}

      {isLogModalOpen && (
        <LogViewerModal
          containerId={selectedContainerId}
          onClose={() => setIsLogModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ContainersPage;