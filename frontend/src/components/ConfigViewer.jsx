import React, { useEffect } from 'react';
import hljs from 'highlight.js/lib/core';
import nginx from 'highlight.js/lib/languages/nginx';
import 'highlight.js/styles/github.css'; // Or your preferred theme

hljs.registerLanguage('nginx', nginx);

const ConfigViewer = ({ config, onClose }) => {
  useEffect(() => {
    hljs.highlightAll();
  }, [config]);

  const handleCopy = () => {
    navigator.clipboard.writeText(config);
    // You might want to add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Nginx Configuration</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
          <code className="language-nginx">
            {config}
          </code>
        </pre>
        <div className="flex justify-end mt-4">
          <button onClick={handleCopy} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">Copy</button>
          <button onClick={onClose} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ConfigViewer;
