import { useNavigate } from 'react-router-dom';
import {
  Container,
  Image,
  Network,
  HardDrive,
  Shield,
  Zap,
  Lock,
  Terminal,
  Eye,
  Gauge,
  ArrowRight,
  Github
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Container,
      title: 'Container Management',
      description: 'Start, stop, restart, and monitor your Docker containers with an intuitive interface.'
    },
    {
      icon: Image,
      title: 'Image Control',
      description: 'Pull, build, and manage Docker images. View details and remove unused images easily.'
    },
    {
      icon: Network,
      title: 'Network Configuration',
      description: 'Create and manage Docker networks. Configure connectivity between your containers.'
    },
    {
      icon: HardDrive,
      title: 'Volume Management',
      description: 'Handle persistent data with Docker volumes. Create, inspect, and remove volumes effortlessly.'
    },
    {
      icon: Terminal,
      title: 'Live Logs',
      description: 'Stream container logs in real-time with WebSocket support for instant monitoring.'
    },
    {
      icon: Gauge,
      title: 'Resource Monitoring',
      description: 'Track CPU, memory, and network usage across all your containers in real-time.'
    }
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'JWT authentication, AES-256 encryption, and rate limiting built-in.'
    },
    {
      icon: Lock,
      title: 'Hardened Deployment',
      description: 'Automated security setup with Fail2Ban, OSSEC, and file integrity monitoring.'
    },
    {
      icon: Eye,
      title: 'Audit Logging',
      description: 'Complete audit trail of all Docker operations and user actions.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Container className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">DockerMist</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/treewords/docker-manager-web-test"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Github className="w-6 h-6" />
              </a>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-6 py-2">
                <span className="text-blue-300 text-sm font-semibold flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Self-Hosted Docker Management
                </span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Manage Docker
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Like a Pro
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              A beautiful, intuitive dashboard for managing your Docker infrastructure.
              Built with enterprise-grade security and real-time monitoring.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/login')}
                className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50 flex items-center"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://github.com/treewords/docker-manager-web-test"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 border border-gray-700 flex items-center"
              >
                <Github className="mr-2 w-5 h-5" />
                View on GitHub
              </a>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
              <div className="bg-gray-800/80 px-6 py-3 border-b border-gray-700 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-lg p-6">
                    <Container className="w-8 h-8 text-blue-400 mb-2" />
                    <div className="text-3xl font-bold text-white mb-1">12</div>
                    <div className="text-gray-400">Active Containers</div>
                  </div>
                  <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-lg p-6">
                    <Image className="w-8 h-8 text-purple-400 mb-2" />
                    <div className="text-3xl font-bold text-white mb-1">28</div>
                    <div className="text-gray-400">Docker Images</div>
                  </div>
                  <div className="bg-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-lg p-6">
                    <Network className="w-8 h-8 text-green-400 mb-2" />
                    <div className="text-3xl font-bold text-white mb-1">5</div>
                    <div className="text-gray-400">Networks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage your Docker infrastructure efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500/50 rounded-xl p-6 transition-all hover:transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className="bg-blue-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                    <Icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-full px-6 py-2 mb-6">
              <Shield className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-300 font-semibold">Enterprise-Grade Security</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Built for Security
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your infrastructure deserves the best protection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center"
                >
                  <div className="bg-red-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Deploy DockerMist on your infrastructure today and take control of your containers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Access Dashboard
            </button>
            <a
              href="https://github.com/treewords/docker-manager-web-test#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 hover:bg-white/10"
            >
              Read Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/80 border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Container className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold text-white">DockerMist</span>
          </div>
          <p className="text-gray-400 mb-4">
            Self-hosted Docker management dashboard with enterprise-grade security
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="https://github.com/treewords/docker-manager-web-test"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/treewords/docker-manager-web-test#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Documentation
            </a>
            <a
              href="https://github.com/treewords/docker-manager-web-test/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              License
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
