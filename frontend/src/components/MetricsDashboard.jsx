import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const MetricsDashboard = ({ metrics, onClose }) => {
  if (!metrics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-4xl">
          <h2 className="text-xl font-bold mb-4">Metrics Dashboard</h2>
          <p>No metrics data available.</p>
          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const { totalRequests, avgResponseTime, errorRate, statusCodes, topEndpoints } = metrics;

  const statusData = Object.entries(statusCodes).map(([name, value]) => ({ name, value }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-4">Metrics Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
            <h3 className="text-lg font-semibold">Total Requests</h3>
            <p className="text-2xl">{totalRequests}</p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
            <h3 className="text-lg font-semibold">Avg. Response Time</h3>
            <p className="text-2xl">{avgResponseTime.toFixed(4)}s</p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
            <h3 className="text-lg font-semibold">Error Rate</h3>
            <p className="text-2xl">{(errorRate * 100).toFixed(2)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-center">Status Codes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-center">Top Endpoints</h3>
             <ul className="list-disc pl-5">
                {topEndpoints.map((endpoint, index) => (
                    <li key={index} className="mb-1">
                        <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{endpoint.endpoint}</span> - {endpoint.count} requests
                    </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Close</button>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
