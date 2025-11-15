import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { inspectNetwork, connectContainerToNetwork, disconnectContainerFromNetwork } from '../services/networkService';
import { getContainers } from '../services/containerService'; // Assuming this service exists

const NetworkDetailsPage = () => {
  const { id } = useParams();
  const [network, setNetwork] = useState(null);
  const [containers, setContainers] = useState([]);
  const [allContainers, setAllContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContainer, setSelectedContainer] = useState('');

  const fetchNetworkDetails = useCallback(async () => {
    try {
      setLoading(true);
      const networkData = await inspectNetwork(id);
      setNetwork(networkData);

      const connectedContainerIds = Object.keys(networkData.Containers);
      const containersData = await getContainers();

      const connectedContainers = containersData.filter(c =>
        connectedContainerIds.some(fullId => fullId.startsWith(c.id))
      );
      setContainers(connectedContainers);

      const unconnectedContainers = containersData.filter(c =>
        !connectedContainerIds.some(fullId => fullId.startsWith(c.id))
      );
      setAllContainers(unconnectedContainers);

      if (unconnectedContainers.length > 0) {
        setSelectedContainer(unconnectedContainers[0].id);
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch network details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNetworkDetails();
  }, [fetchNetworkDetails]);

  const handleConnectContainer = async () => {
    if (!selectedContainer) return;
    try {
      await connectContainerToNetwork(id, selectedContainer);
      fetchNetworkDetails(); // Refresh details
    } catch (err) {
      setError('Failed to connect container.');
    }
  };

  const handleDisconnectContainer = async (containerId) => {
    try {
      await disconnectContainerFromNetwork(id, containerId);
      fetchNetworkDetails(); // Refresh details
    } catch (err) {
      setError('Failed to disconnect container.');
    }
  };

  const inputClass = "w-full px-3 py-2 mt-1 text-text-primary dark:text-dark-text-primary bg-background dark:bg-dark-background border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary";

  if (loading) {
    return <div className="text-text-secondary dark:text-dark-text-secondary">Loading network details...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!network) {
    return <div className="text-text-secondary dark:text-dark-text-secondary">Network not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-text-primary dark:text-dark-text-primary">
        Network: <span className="text-primary dark:text-dark-primary">{network.Name}</span>
      </h1>

      <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700 text-text-primary dark:text-dark-text-primary">Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="text-text-secondary dark:text-dark-text-secondary"><strong>ID:</strong> <span className="font-mono">{network.Id}</span></p>
            <p className="text-text-secondary dark:text-dark-text-secondary"><strong>Driver:</strong> {network.Driver}</p>
            <p className="text-text-secondary dark:text-dark-text-secondary"><strong>Scope:</strong> {network.Scope}</p>
            <p className="text-text-secondary dark:text-dark-text-secondary"><strong>Created:</strong> {new Date(network.Created).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-text-primary dark:text-dark-text-primary">Connected Containers</h2>
        {containers.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {containers.map(container => (
              <li key={container.id} className="py-3 flex justify-between items-center">
                <span className="text-text-primary dark:text-dark-text-primary font-medium">{container.name} <span className="text-sm font-mono text-text-secondary dark:text-dark-text-secondary">({container.id.substring(0,12)})</span></span>
                <button
                  onClick={() => handleDisconnectContainer(container.id)}
                  className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary dark:text-dark-text-secondary">No containers are connected to this network.</p>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-2 text-text-primary dark:text-dark-text-primary">Connect a Container</h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedContainer}
              onChange={(e) => setSelectedContainer(e.target.value)}
              className={`${inputClass} max-w-xs`}
              disabled={allContainers.length === 0}
            >
              {allContainers.length > 0 ? (
                allContainers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              ) : (
                <option>No other containers available</option>
              )}
            </select>
            <button
              onClick={handleConnectContainer}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-80 disabled:bg-opacity-50"
              disabled={!selectedContainer}
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDetailsPage;