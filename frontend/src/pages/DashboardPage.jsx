import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Image,
  Network,
  HardDrive,
  Activity,
  Server,
  Cloud,
  BarChart3,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  PlayCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldX
} from 'lucide-react';
import { getContainers } from '../services/containerService';
import { getImages } from '../services/imageService';
import { getNetworks } from '../services/networkService';
import { getVolumes, createVolume } from '../services/volumeService';
import { createNetwork } from '../services/networkService';
import { getSecurityStatus } from '../services/securityService';
import StartContainerModal from '../components/StartContainerModal';
import PullImageModal from '../components/PullImageModal';
import CreateNetworkModal from '../components/CreateNetworkModal';
import CreateVolumeModal from '../components/CreateVolumeModal';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Real data from API
  const [containerData, setContainerData] = useState({ total: 0, running: 0, healthy: true });
  const [imageData, setImageData] = useState({ total: 0, totalSize: 0, unused: 0 });
  const [networkData, setNetworkData] = useState({ total: 0, bridge: 0, custom: 0 });
  const [volumeData, setVolumeData] = useState({ total: 0, totalSize: 0 });

  // System stats
  const [systemStats, setSystemStats] = useState({
    cpuUsage: '0%',
    memoryUsage: '0/0 GB',
    uptime: 'N/A',
    apiLatency: '<100ms'
  });

  // Recent activity from real container events
  const [recentActivity, setRecentActivity] = useState([]);

  // Security status
  const [securityStatus, setSecurityStatus] = useState({
    status: 'loading',
    message: 'Checking security...',
    summary: { total: 0, secure: 0, privileged: 0, runningAsRoot: 0, publicPorts: 0 }
  });

  // Modal states
  const [showStartContainerModal, setShowStartContainerModal] = useState(false);
  const [showPullImageModal, setShowPullImageModal] = useState(false);
  const [showCreateNetworkModal, setShowCreateNetworkModal] = useState(false);
  const [showCreateVolumeModal, setShowCreateVolumeModal] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      const startTime = Date.now();

      const [containers, images, networks, volumes] = await Promise.all([
        getContainers().catch(() => []),
        getImages().catch(() => []),
        getNetworks().catch(() => []),
        getVolumes().catch(() => [])
      ]);

      const apiLatency = Date.now() - startTime;

      // Process containers
      const runningContainers = containers.filter(c => c.state === 'running');
      const allHealthy = runningContainers.every(c => !c.status?.includes('unhealthy'));
      setContainerData({
        total: containers.length,
        running: runningContainers.length,
        healthy: allHealthy
      });

      // Calculate CPU and Memory from running containers
      if (runningContainers.length > 0) {
        const avgCpu = runningContainers.reduce((sum, c) => sum + (parseFloat(c.cpuPercent) || 0), 0) / runningContainers.length;
        const totalMem = runningContainers.reduce((sum, c) => sum + (parseFloat(c.memoryUsage) || 0), 0);
        setSystemStats(prev => ({
          ...prev,
          cpuUsage: `${avgCpu.toFixed(1)}%`,
          memoryUsage: `${(totalMem / 1024 / 1024 / 1024).toFixed(1)} GB`,
          apiLatency: `${apiLatency}ms`
        }));
      }

      // Process images
      const totalImageSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
      const unusedImages = images.filter(img => !img.inUse).length;
      setImageData({
        total: images.length,
        totalSize: (totalImageSize / 1024 / 1024 / 1024).toFixed(1),
        unused: unusedImages
      });

      // Process networks
      const bridgeNetworks = networks.filter(n => n.driver === 'bridge').length;
      const customNetworks = networks.filter(n => n.driver !== 'bridge' && n.driver !== 'host' && n.driver !== 'null').length;
      setNetworkData({
        total: networks.length,
        bridge: bridgeNetworks,
        custom: customNetworks
      });

      // Process volumes
      const totalVolumeSize = volumes.reduce((sum, vol) => {
        const size = vol.UsageData?.Size || 0;
        return sum + size;
      }, 0);
      setVolumeData({
        total: volumes.length,
        totalSize: (totalVolumeSize / 1024 / 1024 / 1024).toFixed(1)
      });

      // Generate recent activity from containers
      const activities = [];
      containers.slice(0, 4).forEach(container => {
        const stateType = container.state === 'running' ? 'success' :
                         container.state === 'exited' ? 'warning' : 'info';
        const action = container.state === 'running' ? 'Container running' :
                      container.state === 'exited' ? 'Container stopped' :
                      `Container ${container.state}`;
        activities.push({
          action,
          name: container.name,
          time: container.status || 'Unknown',
          type: stateType
        });
      });
      setRecentActivity(activities.length > 0 ? activities : [
        { action: 'No recent activity', name: 'Start using Docker', time: 'Now', type: 'info' }
      ]);

      // Fetch security status
      try {
        const security = await getSecurityStatus();
        setSecurityStatus(security);
      } catch (secErr) {
        console.error('Error fetching security status:', secErr);
        setSecurityStatus({
          status: 'error',
          message: 'Unable to check security status',
          summary: { total: 0, secure: 0, privileged: 0, runningAsRoot: 0, publicPorts: 0 }
        });
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch data. Make sure the backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Quick action handlers
  const handleStartContainerSuccess = () => {
    setShowStartContainerModal(false);
    fetchAllData();
  };

  const handlePullImageSuccess = () => {
    setShowPullImageModal(false);
    fetchAllData();
  };

  const handleCreateNetwork = async (networkData) => {
    try {
      await createNetwork(networkData);
      setShowCreateNetworkModal(false);
      fetchAllData();
    } catch (err) {
      console.error('Error creating network:', err);
      throw err;
    }
  };

  const handleCreateVolume = async (volumeName) => {
    try {
      await createVolume(volumeName);
      setShowCreateVolumeModal(false);
      fetchAllData();
    } catch (err) {
      console.error('Error creating volume:', err);
      throw err;
    }
  };

  const stats = [
    {
      title: 'Running Containers',
      value: containerData.running.toString(),
      change: `${containerData.total} total`,
      changeType: 'positive',
      icon: Container,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      status: containerData.healthy ? 'All healthy' : 'Issues detected',
      statusIcon: containerData.healthy ? CheckCircle2 : AlertCircle
    },
    {
      title: 'Docker Images',
      value: imageData.total.toString(),
      change: `${imageData.totalSize} GB total`,
      changeType: 'neutral',
      icon: Image,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-400',
      status: `${imageData.unused} unused`,
      statusIcon: BarChart3
    },
    {
      title: 'Active Networks',
      value: networkData.total.toString(),
      change: `${networkData.bridge} bridge, ${networkData.custom} custom`,
      changeType: 'neutral',
      icon: Network,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-400',
      status: 'All configured',
      statusIcon: Cloud
    },
    {
      title: 'Volumes',
      value: volumeData.total.toString(),
      change: `${volumeData.totalSize} GB used`,
      changeType: 'neutral',
      icon: HardDrive,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/20',
      iconColor: 'text-orange-400',
      status: 'Active',
      statusIcon: TrendingUp
    }
  ];

  const quickStats = [
    { label: 'CPU Usage', value: systemStats.cpuUsage, icon: Activity },
    { label: 'Memory', value: systemStats.memoryUsage, icon: Server },
    { label: 'Uptime', value: systemStats.uptime, icon: Clock },
    { label: 'API Latency', value: systemStats.apiLatency, icon: Zap }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to <span className="gradient-text">DockerMist</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Monitor and manage your container infrastructure
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className={`flex items-center space-x-2 ${error ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'} border rounded-xl px-4 py-2`}>
              <Activity className={`w-5 h-5 ${error ? 'text-red-400' : 'text-green-400'}`} />
              <span className={`${error ? 'text-red-400' : 'text-green-400'} font-medium`}>
                {error ? 'Connection Error' : 'System Healthy'}
              </span>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const StatusIcon = stat.statusIcon;
          return (
            <div
              key={index}
              className={`group bg-gradient-to-br ${stat.bgGradient} dark:bg-gradient-to-br dark:${stat.bgGradient} backdrop-blur-sm border ${stat.borderColor} rounded-2xl p-6 hover:border-opacity-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-10 h-10 ${stat.iconColor}`} />
                <Activity className={`w-5 h-5 ${stat.iconColor} opacity-50`} />
              </div>
              <div className={`text-4xl font-bold text-gray-900 dark:text-white mb-2`}>{stat.value}</div>
              <div className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-3">{stat.title}</div>
              <div className="flex items-center justify-between text-xs">
                <div className={`flex items-center ${stat.changeType === 'positive' ? 'text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {stat.status}
                </div>
                <div className="text-slate-500 dark:text-slate-400">{stat.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <Icon className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-400' :
                  activity.type === 'warning' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{activity.name}</p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h3>
            <Zap className="w-5 h-5 text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowStartContainerModal(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:-translate-y-0.5"
            >
              <PlayCircle className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Start Container</span>
            </button>
            <button
              onClick={() => setShowPullImageModal(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:-translate-y-0.5"
            >
              <Image className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Pull Image</span>
            </button>
            <button
              onClick={() => setShowCreateNetworkModal(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-all hover:-translate-y-0.5"
            >
              <Network className="w-8 h-8 text-green-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create Network</span>
            </button>
            <button
              onClick={() => setShowCreateVolumeModal(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all hover:-translate-y-0.5"
            >
              <HardDrive className="w-8 h-8 text-orange-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create Volume</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      {(() => {
        const getSecurityStyles = () => {
          switch (securityStatus.status) {
            case 'critical':
              return {
                bg: 'from-red-500/10 via-red-500/10 to-orange-500/10',
                border: 'border-red-500/20',
                iconBg: 'bg-red-500/20',
                iconColor: 'text-red-400',
                Icon: ShieldX
              };
            case 'warning':
              return {
                bg: 'from-yellow-500/10 via-orange-500/10 to-yellow-500/10',
                border: 'border-yellow-500/20',
                iconBg: 'bg-yellow-500/20',
                iconColor: 'text-yellow-400',
                Icon: ShieldAlert
              };
            case 'secure':
              return {
                bg: 'from-green-500/10 via-emerald-500/10 to-cyan-500/10',
                border: 'border-green-500/20',
                iconBg: 'bg-green-500/20',
                iconColor: 'text-green-400',
                Icon: ShieldCheck
              };
            default:
              return {
                bg: 'from-blue-500/10 via-purple-500/10 to-cyan-500/10',
                border: 'border-blue-500/20',
                iconBg: 'bg-blue-500/20',
                iconColor: 'text-blue-400',
                Icon: Shield
              };
          }
        };

        const styles = getSecurityStyles();
        const StatusIcon = styles.Icon;
        const summary = securityStatus.summary || {};

        return (
          <div className={`mt-8 bg-gradient-to-r ${styles.bg} border ${styles.border} rounded-2xl p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${styles.iconBg}`}>
                  <StatusIcon className={`w-6 h-6 ${styles.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Security Status</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {securityStatus.message}
                  </p>
                  {summary.total > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                      <span className="text-green-400">{summary.secure} secure</span>
                      {summary.privileged > 0 && (
                        <span className="text-red-400">{summary.privileged} privileged</span>
                      )}
                      {summary.runningAsRoot > 0 && (
                        <span className="text-yellow-400">{summary.runningAsRoot} as root</span>
                      )}
                      {summary.publicPorts > 0 && (
                        <span className="text-orange-400">{summary.publicPorts} public ports</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <StatusIcon className={`w-8 h-8 ${styles.iconColor}`} />
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      <StartContainerModal
        isOpen={showStartContainerModal}
        onClose={() => setShowStartContainerModal(false)}
        onSuccess={handleStartContainerSuccess}
      />

      {showPullImageModal && (
        <PullImageModal
          onClose={() => setShowPullImageModal(false)}
          onSuccess={handlePullImageSuccess}
        />
      )}

      <CreateNetworkModal
        isOpen={showCreateNetworkModal}
        onClose={() => setShowCreateNetworkModal(false)}
        onCreate={handleCreateNetwork}
      />

      <CreateVolumeModal
        isOpen={showCreateVolumeModal}
        onClose={() => setShowCreateVolumeModal(false)}
        onCreate={handleCreateVolume}
      />
    </div>
  );
};

export default DashboardPage;
