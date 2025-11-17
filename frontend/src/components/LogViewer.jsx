import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import config from '../config';

const LogViewer = ({ containerId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Ensure this runs only once
    if (!terminalRef.current || xtermRef.current) return;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: '#1f2937', // gray-800
        foreground: '#d1d5db', // gray-300
      },
    });
    const fitAddon = new FitAddon();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    // --- WebSocket Connection ---
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        term.writeln('Authentication token not found. Cannot connect to log stream.');
        return;
    }

    const socket = io(config.API_BASE_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      term.writeln('\x1b[1;32mConnected to log stream...\x1b[0m');
      // Request logs for the specific container
      socket.emit('container:logs', { containerId });
    });

    socket.on('log', (log) => {
      // The log chunk from Docker might contain control characters or headers.
      // A simple regex to strip some of the docker stream headers, could be improved.
      const cleanedLog = log.replace(/^.{8}/, '');
      term.write(cleanedLog);
    });

    socket.on('log:error', (errorMessage) => {
      term.writeln(`\x1b[1;31mError: ${errorMessage}\x1b[0m`);
    });

    socket.on('log:end', (message) => {
        term.writeln(`\x1b[1;33m${message}\x1b[0m`);
    });

    socket.on('disconnect', () => {
      term.writeln('\x1b[1;31mDisconnected from log stream.\x1b[0m');
    });

    socket.on('connect_error', (err) => {
        term.writeln(`\x1b[1;31mConnection Error: ${err.message}\x1b[0m`);
    });


    // --- Cleanup on unmount ---
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (term) {
        term.dispose();
      }
      if(resizeObserver) {
        resizeObserver.disconnect();
      }
      xtermRef.current = null;
    };
  }, [containerId]); // Rerun effect if containerId changes

  return <div ref={terminalRef} className="w-full h-full" />;
};

export default LogViewer;