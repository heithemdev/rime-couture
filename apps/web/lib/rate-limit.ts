type Options = {
  uniqueTokenPerInterval?: number; // Max users to track in memory
  interval?: number; // Time window in ms
};

export default function rateLimit(options?: Options) {
  const tokenCache = new Map();
  const interval = options?.interval || 60000; // Default 1 minute
  const uniqueTokenPerInterval = options?.uniqueTokenPerInterval || 500;

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const now = Date.now();
        const tokenCount = tokenCache.get(token) || [0];
        
        // Reset if interval passed
        if (tokenCount[1] && now - tokenCount[1] > interval) {
          tokenCount[0] = 0;
          tokenCount[1] = now;
        }

        if (tokenCount[0] >= limit) {
          return reject(); // Rate limit exceeded
        }

        tokenCount[0] += 1;
        tokenCount[1] = now;
        tokenCache.set(token, tokenCount);

        // Cleanup if cache is too full (simple LRU-ish)
        if (tokenCache.size > uniqueTokenPerInterval) {
          const keys = tokenCache.keys();
          for (let i = 0; i < 100; i++) tokenCache.delete(keys.next().value);
        }

        resolve();
      }),
  };
}