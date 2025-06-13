import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, XCircle, Database } from 'lucide-react';
import { BackendApiService } from '../services/backendApiService';

interface BackendStatusProps {
  onStatusChange?: (isConnected: boolean) => void;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ onStatusChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      const connected = await BackendApiService.checkHealth();
      setIsConnected(connected);
      
      if (connected) {
        const backendStats = await BackendApiService.getStats();
        setStats(backendStats);
      }
      
      onStatusChange?.(connected);
    } catch (error) {
      console.error('Backend status check failed:', error);
      setIsConnected(false);
      onStatusChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`bg-gray-800/90 backdrop-blur-sm rounded-lg border p-3 transition-all duration-300 ${
        isConnected ? 'border-green-500/50' : 'border-red-500/50'
      }`}>
        <div className="flex items-center gap-2 text-sm">
          <Server className="w-4 h-4" />
          <span className="text-white font-medium">Backend</span>
          
          {isChecking ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : isConnected ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          
          <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {isConnected && stats && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Database className="w-3 h-3" />
              <span>{stats.total_products?.toLocaleString() || 0} products</span>
            </div>
          </div>
        )}
        
        {!isConnected && !isChecking && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <button
              onClick={checkBackendStatus}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};