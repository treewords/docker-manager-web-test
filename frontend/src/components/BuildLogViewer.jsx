import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import { X } from 'lucide-react';

const BuildLogViewer = ({ imageName, onClose }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [status, setStatus] = useState('Building...');

  useEffect(() => {
    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: `'Fira Mono', monospace`,
      fontSize: 14,
      theme: {
        background: '#1E1E1E',
        foreground: '#D4D4D4',
        cursor: '#D4D4D4',
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln(`\x1b[1;36mStarting build for image: ${imageName}\x1b[0m`);
    term.writeln('');

    // Establish WebSocket connection
    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      term.writeln('\x1b[32mWebSocket connected. Waiting for build logs...\x1b[0m');
    });

    // Listen for build logs
    socket.on('build:log', (data) => {
      if (data.imageName === imageName && data.message) {
        // Clean up message formatting
        const cleanedMessage = data.message.replace(/\\n/g, '\r\n').replace(/\\u001b/g, '\x1b');
        term.write(cleanedMessage);
      }
    });

    // Listen for build result
    socket.on('build:result', (data) => {
      if (data.imageName === imageName) {
        if (data.status === 'success') {
          term.writeln(`\r\n\x1b[1;32mBuild successful: ${data.message}\x1b[0m`);
          setStatus('Success');
        } else {
          term.writeln(`\r\n\x1b[1;31mBuild failed: ${data.message}\x1b[0m`);
          setStatus('Failed');
        }
        socket.disconnect();
      }
    });

    socket.on('disconnect', () => {
      term.writeln('\r\n\x1b[33mWebSocket disconnected.\x1b[0m');
    });

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [imageName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-full max-w-4xl h-[80vh] bg-[#1E1E1E] rounded-lg shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-3 bg-gray-800 text-white border-b border-gray-700">
          <h3 className="text-lg font-semibold">Build Logs: {imageName}</h3>
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 text-xs rounded ${status === 'Building...' ? 'bg-blue-500' : status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`}>
              {status}
            </span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>
        <div ref={terminalRef} className="flex-grow p-2" style={{ height: 'calc(100% - 60px)' }}></div>
      </div>
    </div>
  );
};

export default BuildLogViewer;