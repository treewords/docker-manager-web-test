import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Secure session management hook with inactivity timeout
 * Provides automatic logout after inactivity period with warning modal
 */
export function useSecureSession(config = {}) {
  const {
    inactivityTimeout = 15 * 60 * 1000, // 15 minutes default
    warningTime = 2 * 60 * 1000, // 2 minutes before logout
    onLogout = () => {},
    onWarning = () => {},
    enabled = true
  } = config;

  const [isActive, setIsActive] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(inactivityTimeout);

  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const intervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    clearAllTimers();
    setShowWarning(false);
    setTimeRemaining(warningTime);
    setIsActive(true);
    lastActivityRef.current = Date.now();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      onWarning();

      // Start countdown
      let remaining = warningTime;
      setTimeRemaining(remaining);

      intervalRef.current = setInterval(() => {
        remaining -= 1000;
        setTimeRemaining(Math.max(0, remaining));

        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 1000);
    }, inactivityTimeout - warningTime);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      clearAllTimers();
      onLogout();
    }, inactivityTimeout);
  }, [enabled, inactivityTimeout, warningTime, onLogout, onWarning, clearAllTimers]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const endSession = useCallback(() => {
    clearAllTimers();
    setIsActive(false);
    setShowWarning(false);
    onLogout();
  }, [clearAllTimers, onLogout]);

  useEffect(() => {
    if (!enabled) return;

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    // Throttle activity detection to avoid excessive timer resets
    let throttleTimeout = null;
    const throttledReset = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 1000);

      // Only reset if not showing warning (user must click extend button)
      if (!showWarning) {
        resetTimer();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledReset);
      });
      clearAllTimers();
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [enabled, resetTimer, clearAllTimers, showWarning]);

  // Handle visibility change - reset timer when tab becomes visible
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if session should have expired while hidden
        const inactiveTime = Date.now() - lastActivityRef.current;
        if (inactiveTime >= inactivityTimeout) {
          setIsActive(false);
          onLogout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, inactivityTimeout, onLogout]);

  return {
    isActive,
    showWarning,
    timeRemaining: Math.ceil(timeRemaining / 1000), // Return seconds
    extendSession,
    endSession,
    resetTimer
  };
}

export default useSecureSession;
