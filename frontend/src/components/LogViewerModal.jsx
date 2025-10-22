import React from 'react';
import { X } from 'lucide-react';
import LogViewer from './LogViewer';

const LogViewerModal = ({ containerId, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300">
      <div className="w-full max-w-4xl h-3/4 flex flex-col bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary rounded-lg shadow-xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold">
            Logs for <span className="font-mono text-primary dark:text-dark-primary">{containerId.substring(0, 12)}</span>
          </h3>
          <button onClick={onClose} className="p-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={22} />
          </button>
        </header>
        <main className="flex-grow p-4 overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-b-lg">
          <LogViewer containerId={containerId} />
        </main>
      </div>
      <style jsx>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LogViewerModal;