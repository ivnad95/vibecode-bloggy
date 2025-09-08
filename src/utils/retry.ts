import { networkService, NetworkError } from './network';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  timeout?: number;
}

export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalTime: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx status codes
    if ((error as NetworkError).isNetworkError) {
      return (error as NetworkError).retryable;
    }
    
    // Retry on common network error messages
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('timeout') ||
           message.includes('connection') ||
           message.includes('fetch');
  },
  onRetry: () => {},
  timeout: 30000, // 30 seconds
};

export class RetryService {
  private static calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    const exponentialDelay = options.baseDelay * Math.pow(options.backoffFactor, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
    
    if (options.jitter) {
      // Add random jitter to prevent thundering herd
      const jitterRange = cappedDelay * 0.1;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, cappedDelay + jitter);
    }
    
    return cappedDelay;
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        // Check network connectivity before attempting
        if (!networkService.isOnline()) {
          throw networkService.createNetworkError('No internet connection available');
        }

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Operation timed out after ${opts.timeout}ms`));
          }, opts.timeout);
        });

        // Race between operation and timeout
        const data = await Promise.race([operation(), timeoutPromise]);
        
        return {
          data,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if this is the last attempt
        if (attempt === opts.maxAttempts) {
          break;
        }

        // Check if we should retry this error
        if (!opts.retryCondition(lastError)) {
          break;
        }

        // Call retry callback
        opts.onRetry(attempt, lastError);

        // Calculate delay and wait
        const delayMs = this.calculateDelay(attempt, opts);
        await this.delay(delayMs);
      }
    }

    // If we get here, all retries failed
    throw lastError;
  }

  public static async withExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    const result = await this.withRetry(operation, { maxAttempts });
    return result.data;
  }

  public static async withNetworkRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    const result = await this.withRetry(operation, {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 16000,
      onRetry,
      retryCondition: (error) => {
        // More aggressive retry for network errors
        const networkError = error as NetworkError;
        if (networkError.isNetworkError) {
          return networkError.retryable;
        }
        
        const message = error.message.toLowerCase();
        return message.includes('network') ||
               message.includes('timeout') ||
               message.includes('connection') ||
               message.includes('fetch') ||
               message.includes('econnreset') ||
               message.includes('enotfound');
      },
    });
    return result.data;
  }
}

// Convenience function for API calls
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const result = await RetryService.withRetry(apiCall, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    onRetry: (attempt, error) => {
      console.log(`API call failed (attempt ${attempt}):`, error.message);
    },
    ...options,
  });
  return result.data;
}

// Specific retry function for OpenAI API calls
export async function retryOpenAICall<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  return retryApiCall(apiCall, {
    maxAttempts: 4,
    baseDelay: 2000,
    maxDelay: 20000,
    retryCondition: (error) => {
      const message = error.message.toLowerCase();
      // Retry on rate limits, timeouts, and server errors
      return message.includes('rate limit') ||
             message.includes('timeout') ||
             message.includes('server error') ||
             message.includes('503') ||
             message.includes('502') ||
             message.includes('500') ||
             message.includes('429');
    },
    onRetry: (attempt, error) => {
      console.log(`OpenAI API retry (attempt ${attempt}):`, error.message);
    },
  });
}