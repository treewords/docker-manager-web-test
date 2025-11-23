import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

/**
 * Session timeout warning modal
 * Displays when user session is about to expire due to inactivity
 */
export function SessionWarningModal({ timeRemaining, onExtend, onLogout }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  };

  const isUrgent = timeRemaining <= 30;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      aria-describedby="session-warning-description"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <Clock className={`w-6 h-6 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <h3
            id="session-warning-title"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Session Expiring Soon
          </h3>
        </div>

        <p
          id="session-warning-description"
          className="text-gray-600 dark:text-gray-300 mb-6"
        >
          Your session will expire in{' '}
          <span className={`font-bold ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {formatTime(timeRemaining)}
          </span>{' '}
          due to inactivity. Would you like to stay logged in?
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.max(0, (timeRemaining / 120) * 100)}%` }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExtend}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            autoFocus
          >
            <RefreshCw className="w-4 h-4" />
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <LogOut className="w-4 h-4" />
            Logout Now
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          For security, sessions automatically expire after 15 minutes of inactivity.
        </p>
      </div>
    </div>
  );
}

export default SessionWarningModal;
