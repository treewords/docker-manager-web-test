import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNetworks, createNetwork, removeNetwork } from '../services/networkService';
import CreateNetworkModal from '../components/CreateNetworkModal';
import { PlusCircle, Trash2 } from 'lucide-react';

const NetworksPage = () => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNetworks = async () => {
    try {
      setLoading(true);
      const data = await getNetworks();
      setNetworks(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch networks. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  const handleCreateNetwork = async (networkData) => {
    try {
      await createNetwork(networkData);
      setIsModalOpen(false);
      fetchNetworks(); // Refresh the list
    } catch (error) {
      setError('Failed to create network.');
    }
  };

  const handleRemoveNetwork = async (networkId) => {
    if (window.confirm('Are you sure you want to remove this network?')) {
      try {
        await removeNetwork(networkId);
        fetchNetworks(); // Refresh the list
      } catch (error) {
        setError('Failed to remove network.');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-text-secondary dark:text-dark-text-secondary">Loading networks...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Networks</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Network
        </button>
      </header>
      <CreateNetworkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateNetwork}
      />
      <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Scope</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
            {networks.map((network) => (
              <tr key={network.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary dark:text-dark-primary">
                  <Link to={`/networks/${network.id}`} className="hover:underline">
                    {network.id.substring(0, 12)}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{network.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{network.driver}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{network.scope}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{formatDate(network.created)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleRemoveNetwork(network.id)}
                    className="p-2 text-text-secondary dark:text-dark-text-secondary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500"
                    title="Remove Network"
                  >
                    <Trash2 className="w-5 h-5" />
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

export default NetworksPage;