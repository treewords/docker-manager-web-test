import React from 'react';
import {
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
  pauseContainer,
  unpauseContainer,
} from '../services/containerService';
import { Play, StopCircle, RefreshCw, Trash2, Pause } from 'lucide-react';

const ActionButtons = ({ containerId, containerState, onActionSuccess }) => {
  const handleAction = async (action) => {
    if (action === 'remove' && !window.confirm('Are you sure you want to remove this container?')) {
      return;
    }

    const actionMap = {
      start: () => startContainer(containerId),
      stop: () => stopContainer(containerId),
      restart: () => restartContainer(containerId),
      remove: () => removeContainer(containerId),
      pause: () => pauseContainer(containerId),
      unpause: () => unpauseContainer(containerId),
    };

    try {
      await actionMap[action]();
      onActionSuccess(); // Refresh the container list for all actions
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const isRunning = containerState === 'running';
  const isPaused = containerState === 'paused';

  const buttonClass = "p-2 rounded-full transition-colors duration-200";
  const iconClass = "text-text-secondary dark:text-dark-text-secondary";
  const hoverClass = "hover:bg-gray-200 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center space-x-1">
      {isRunning ? (
        <button
          onClick={() => handleAction('stop')}
          className={`${buttonClass} ${iconClass} ${hoverClass} hover:text-yellow-500`}
          title="Stop"
        >
          <StopCircle size={18} />
        </button>
      ) : (
        !isPaused && (
          <button
            onClick={() => handleAction('start')}
            className={`${buttonClass} ${iconClass} ${hoverClass} hover:text-green-500`}
            title="Start"
          >
            <Play size={18} />
          </button>
        )
      )}
      {isRunning && (
        <button
          onClick={() => handleAction('pause')}
          className={`${buttonClass} ${iconClass} ${hoverClass} hover:text-purple-500`}
          title="Pause"
        >
          <Pause size={18} />
        </button>
      )}
      {isPaused && (
        <button
          onClick={() => handleAction('unpause')}
          className={`${buttonClass} ${iconClass} ${hoverClass} hover:text-green-500`}
          title="Unpause"
        >
          <Play size={18} />
        </button>
      )}
      <button
        onClick={() => handleAction('restart')}
        className={`${buttonClass} ${iconClass} ${hoverClass} hover:text-blue-500`}
        title="Restart"
      >
        <RefreshCw size={18} />
      </button>
      <button
        onClick={() => handleAction('remove')}
        className={`${buttonClass} ${iconClass} ${hoverClass} hover:text-red-500`}
        title="Remove"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default ActionButtons;