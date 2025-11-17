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
  Github,
  CheckCircle2,
  Activity,
  Layers,
  Server,
  Cloud,
  BarChart3,
  Users,
  Clock,
  Code2
} from 'lucide-react';

export default function LandingPage() {

  const features = [
    {
      icon: Container,
      title: 'Complete Container Lifecycle',
      description: 'Comprehensive control over your Docker containers—start, stop, restart, pause, and remove with a single click. Monitor resource usage and health status in real-time.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Image,
      title: 'Advanced Image Management',
      description: 'Pull images from registries, build custom images, and manage your entire image catalog. Inspect layers, tags, and metadata with detailed visualization.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Network,
      title: 'Network Orchestration',
      description: 'Design and configure complex network topologies. Create isolated networks, manage DNS resolution, and control container connectivity with precision.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: HardDrive,
      title: 'Persistent Volume Control',
      description: 'Effortlessly manage data persistence with Docker volumes. Create, mount, backup, and inspect volumes across your entire infrastructure.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Terminal,
      title: 'Real-Time Log Streaming',
      description: 'WebSocket-powered live log streaming with advanced filtering and search. Debug containers instantly with full terminal output visibility.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Gauge,
      title: 'Performance Analytics',
      description: 'Track CPU, memory, network I/O, and disk usage across all containers. Historical data visualization and resource utilization alerts.',
      gradient: 'from-yellow-500 to-orange-500'
    }
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: 'Military-Grade Encryption',
      description: 'AES-256 encryption for all sensitive data. JWT tokens with secure refresh mechanisms and automatic session management.'
    },
    {
      icon: Lock,
      title: 'Multi-Layer Defense',
      description: 'Integrated Fail2Ban protection, OSSEC intrusion detection, and AIDE file integrity monitoring for comprehensive security.'
    },
    {
      icon: Eye,
      title: 'Complete Audit Trail',
      description: 'Every action is logged with user attribution, timestamps, and full context for compliance and forensic analysis.'
    }
  ];

  const stats = [
    { label: 'API Response Time', value: '<100ms', icon: Zap },
    { label: 'Security Layers', value: '7+', icon: Shield },
    { label: 'Real-Time Updates', value: 'WebSocket', icon: Activity },
    { label: 'Deployment Time', value: '< 5 min', icon: Clock }
  ];

  const techStack = [
    { name: 'React 18', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Socket.io', category: 'Real-Time' },
    { name: 'Docker API', category: 'Integration' },
    { name: 'JWT Auth', category: 'Security' },
    { name: 'SQLite', category: 'Database' }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Container className="w-9 h-9 text-blue-500" />
                <div className="absolute -inset-1 bg-blue-500/20 blur-md rounded-full -z-10"></div>
              </div>
              <div>
                <span className="text-2xl font-bold text-white tracking-tight">DockerMist</span>
                <div className="text-xs text-slate-400 -mt-1">Enterprise Container Platform</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="https://github.com/treewords/docker-manager-web-test#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Documentation
              </a>
              <a
                href="https://github.com/treewords/docker-manager-web-test"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center space-x-2"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm font-medium">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20"></div>

        {/* Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-full px-5 py-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Self-Hosted • Open Source • Enterprise Ready
                </span>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 tracking-tight">
              Docker Management
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Redefined
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-400 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              A self-hosted platform that transforms Docker infrastructure management with
              <span className="text-white font-medium"> enterprise-grade security</span>,
              <span className="text-white font-medium"> real-time monitoring</span>, and an
              <span className="text-white font-medium"> intuitive interface</span> designed for production environments.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a
                href="https://github.com/treewords/docker-manager-web-test#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center"
              >
                <span>View Documentation</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://github.com/treewords/docker-manager-web-test"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-800/50 hover:bg-slate-800 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 border border-slate-700 hover:border-slate-600 hover:-translate-y-0.5 flex items-center"
              >
                <Github className="mr-2 w-5 h-5" />
                <span>View on GitHub</span>
              </a>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-20">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                    <Icon className="w-5 h-5 text-blue-400 mb-2 mx-auto" />
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl blur-2xl opacity-20"></div>
              <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                {/* Window Controls */}
                <div className="bg-slate-900/95 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="text-sm text-slate-500 font-mono">docker-manager:3000</div>
                  <div className="w-16"></div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="group bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <Container className="w-10 h-10 text-blue-400" />
                        <Activity className="w-5 h-5 text-blue-400/50" />
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">24</div>
                      <div className="text-slate-400 text-sm font-medium">Running Containers</div>
                      <div className="mt-3 flex items-center text-xs text-green-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        All healthy
                      </div>
                    </div>

                    <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <Image className="w-10 h-10 text-purple-400" />
                        <Layers className="w-5 h-5 text-purple-400/50" />
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">156</div>
                      <div className="text-slate-400 text-sm font-medium">Docker Images</div>
                      <div className="mt-3 flex items-center text-xs text-slate-400">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        12.4 GB total
                      </div>
                    </div>

                    <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <Network className="w-10 h-10 text-green-400" />
                        <Server className="w-5 h-5 text-green-400/50" />
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">8</div>
                      <div className="text-slate-400 text-sm font-medium">Active Networks</div>
                      <div className="mt-3 flex items-center text-xs text-slate-400">
                        <Cloud className="w-3 h-3 mr-1" />
                        3 bridge, 5 custom
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Platform Capabilities</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Built for Production
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto font-light">
              Enterprise-grade features designed to handle mission-critical Docker workloads at any scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-slate-700 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}>
                    <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Security First</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Fortified by Design
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto font-light">
              Zero-trust architecture with multiple security layers protecting your infrastructure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="relative bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-2xl"></div>
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                      <Icon className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security Features List */}
          <div className="mt-16 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Additional Security Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Rate Limiting & DDoS Protection',
                'CORS & CSP Headers',
                'SQL Injection Prevention',
                'XSS Protection',
                'Automated Security Updates',
                'Intrusion Detection (OSSEC)',
                'File Integrity Monitoring (AIDE)',
                'Brute Force Protection (Fail2Ban)',
                'Secure Session Management'
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              Modern Technology Stack
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Built with industry-leading technologies for performance, reliability, and developer experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 hover:border-blue-500/30 rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {tech.name}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{tech.category}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 opacity-10"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Deploy in Minutes</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Docker Workflow?
            </span>
          </h2>

          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto font-light">
            Join organizations using DockerMist to streamline container operations and enhance security posture
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://github.com/treewords/docker-manager-web-test#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 flex items-center justify-center"
            >
              <span>Read Documentation</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://github.com/treewords/docker-manager-web-test"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/50 hover:bg-slate-800 backdrop-blur-sm text-white px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300 border border-slate-700 hover:border-slate-600 hover:-translate-y-0.5 flex items-center justify-center"
            >
              <Github className="mr-2 w-5 h-5" />
              <span>Explore Source Code</span>
            </a>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Open Source</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Self-Hosted</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>No Vendor Lock-in</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Container className="w-8 h-8 text-blue-500" />
                <div className="absolute -inset-1 bg-blue-500/20 blur-md rounded-full -z-10"></div>
              </div>
              <div>
                <span className="text-xl font-bold text-white">DockerMist</span>
                <div className="text-xs text-slate-500">Enterprise Container Platform</div>
              </div>
            </div>

            <div className="flex items-center space-x-8">
              <a
                href="https://github.com/treewords/docker-manager-web-test"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                GitHub
              </a>
              <a
                href="https://github.com/treewords/docker-manager-web-test#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Documentation
              </a>
              <a
                href="https://github.com/treewords/docker-manager-web-test/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                License
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-900 text-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} DockerMist. Built with security and performance in mind.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
