import React from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { logger } from './logger';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: NetInfoStateType;
  isWifiEnabled?: boolean;
  strength?: number;
}

export interface NetworkError extends Error {
  isNetworkError: boolean;
  retryable: boolean;
  statusCode?: number;
}

class NetworkService {
  private listeners: ((state: NetworkState) => void)[] = [];
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
    type: NetInfoStateType.unknown,
  };

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Subscribe to network state changes
    NetInfo.addEventListener((state: NetInfoState) => {
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isWifiEnabled: state.isWifiEnabled,
      };

      this.currentState = networkState;
      this.notifyListeners(networkState);
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isWifiEnabled: state.isWifiEnabled,
      };
      this.currentState = networkState;
      this.notifyListeners(networkState);
    });
  }

  public getCurrentState(): NetworkState {
    return this.currentState;
  }

  public isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  public addListener(callback: (state: NetworkState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(state: NetworkState) {
    this.listeners.forEach(listener => listener(state));
  }

  public async checkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return (state.isConnected ?? false) && (state.isInternetReachable ?? false);
    } catch (error) {
      logger.warn('Failed to check connectivity:', error);
      return false;
    }
  }

  public showNoConnectionAlert() {
    Alert.alert(
      'No Internet Connection',
      'Please check your internet connection and try again.',
      [
        { text: 'OK', style: 'default' },
        { text: 'Retry', onPress: () => this.checkConnectivity() }
      ]
    );
  }

  public createNetworkError(message: string, originalError?: Error, statusCode?: number): NetworkError {
    const error = new Error(message) as NetworkError;
    error.isNetworkError = true;
    error.retryable = this.isRetryableError(statusCode, originalError);
    error.statusCode = statusCode;
    error.stack = originalError?.stack;
    return error;
  }

  private isRetryableError(statusCode?: number, originalError?: Error): boolean {
    // Network timeout or connection errors are retryable
    if (originalError?.message.includes('timeout') || 
        originalError?.message.includes('ECONNRESET') ||
        originalError?.message.includes('ENOTFOUND')) {
      return true;
    }

    // HTTP status codes that are retryable
    if (statusCode) {
      return statusCode >= 500 || statusCode === 408 || statusCode === 429;
    }

    return false;
  }

  public getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.isOnline()) return 'offline';
    
    const { type } = this.currentState;
    
    switch (type) {
      case NetInfoStateType.wifi:
        return 'excellent';
      case NetInfoStateType.cellular:
        return 'good';
      case NetInfoStateType.ethernet:
        return 'excellent';
      default:
        return 'poor';
    }
  }
}

// Export singleton instance
export const networkService = new NetworkService();

// React hook for network state
export function useNetworkState() {
  const [networkState, setNetworkState] = React.useState<NetworkState>(networkService.getCurrentState());

  React.useEffect(() => {
    const unsubscribe = networkService.addListener(setNetworkState);
    return unsubscribe;
  }, []);

  return {
    ...networkState,
    isOnline: networkService.isOnline(),
    quality: networkService.getConnectionQuality(),
  };
}