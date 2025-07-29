"use client";
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useNetworkRecovery = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize online status safely
    try {
      setIsOnline(navigator.onLine);
    } catch {
      // Fallback if navigator.onLine is not available
      setIsOnline(true);
    }

    const handleOnline = () => {
      const wasOfflineBefore = !isOnline;
      setIsOnline(true);
      
      if (wasOfflineBefore || wasOffline || hasNetworkError) {
        // Show reconnected message
        setShowReconnected(true);
        
        // Hide network error page
        setShowNetworkError(false);
        setHasNetworkError(false);
        
        // Refetch all queries when coming back online
        queryClient.refetchQueries({
          type: 'all'
        });
        
        // Hide reconnected message after showing success
        setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
        }, 2000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
      setHasNetworkError(true);
    };

    // Listen for network status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, wasOffline, isOnline, hasNetworkError]);

  // Function to manually trigger network error state
  const triggerNetworkError = () => {
    try {
      if (!navigator.onLine) {
        setShowNetworkError(true);
        setHasNetworkError(true);
      }
    } catch {
      // Fallback - don't show error if we can't detect network status
    }
  };

  // Function to retry network requests
  const retryRequests = () => {
    try {
      if (navigator.onLine) {
        setShowNetworkError(false);
        setHasNetworkError(false);
        queryClient.refetchQueries({
          type: 'all'
        });
      }
    } catch {
      // Fallback - always try to refetch
      setShowNetworkError(false);
      setHasNetworkError(false);
      queryClient.refetchQueries({
        type: 'all'
      });
    }
  };

  return { 
    isOnline, 
    wasOffline, 
    showReconnected, 
    showNetworkError,
    hasNetworkError,
    triggerNetworkError,
    retryRequests
  };
};
