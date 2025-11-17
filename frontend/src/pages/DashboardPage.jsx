import React from 'react';
import {
  Container,
  Image,
  Network,
  HardDrive,
  Activity,
  Layers,
  Server,
  Cloud,
  BarChart3,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

const DashboardPage = () => {
  // Mock data - in production, this would come from API
  const stats = [
    {
      title: 'Running Containers',
      value: '24',
      change: '+3 today',
      changeType: 'positive',
      icon: Container,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      status: 'All healthy',
      statusIcon: CheckCircle2
    },
    {
      title: 'Docker Images',
      value: '156',
      change: '12.4 GB total',
      changeType: 'neutral',
      icon: Image,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-400',
      status: '8 unused',
      statusIcon: BarChart3
    },
    {
      title: 'Active Networks',
      value: '8',
      change: '3 bridge, 5 custom',
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
      value: '42',
      change: '84.2 GB used',
      changeType: 'neutral',
      icon: HardDrive,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/20',
      iconColor: 'text-orange-400',
      status: '15% capacity',
      statusIcon: TrendingUp
    }
  ];

  const quickStats = [
    { label: 'CPU Usage', value: '45%', icon: Activity },
    { label: 'Memory', value: '8.2/16 GB', icon: Server },
    { label: 'Uptime', value: '14d 6h', icon: Clock },
    { label: 'API Latency', value: '<100ms', icon: Zap }
  ];

  const recentActivity = [
    { action: 'Container started', name: 'nginx-web-01', time: '2 minutes ago', type: 'success' },
    { action: 'Image pulled', name: 'node:18-alpine', time: '15 minutes ago', type: 'info' },
    { action: 'Network created', name: 'app-network', time: '1 hour ago', type: 'info' },
    { action: 'Container stopped', name: 'redis-cache', time: '2 hours ago', type: 'warning' }
  ];

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
          <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">System Healthy</span>
          </div>
        </div>
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
            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:-translate-y-0.5">
              <PlayCircle className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Start Container</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:-translate-y-0.5">
              <Image className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Pull Image</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-all hover:-translate-y-0.5">
              <Network className="w-8 h-8 text-green-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create Network</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all hover:-translate-y-0.5">
              <HardDrive className="w-8 h-8 text-orange-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create Volume</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="mt-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Security Status</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">All security features active • No vulnerabilities detected</p>
            </div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
