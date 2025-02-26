import { useCallback, useRef } from 'react';
import { useQueryClient, QueryKey } from 'react-query';

const sleep = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs));

export const useRefetchQueries = (queryKey?: QueryKey, delayMs?: number) => {
  
  const queryClient = useQueryClient();

  // Ensure queriesToRefetchRef is storing the initial queryKey correctly
  const queriesToRefetchRef = useRef<QueryKey | undefined>(queryKey);

  return useCallback(async (queryKeyArg?: QueryKey) => {
    const queriesToRefetch = queryKeyArg || queriesToRefetchRef.current;

    if (delayMs) {
      await sleep(delayMs);
    }

    // Assuming you want to refetch based on a string or pattern
    if (typeof queriesToRefetch === 'string') {
      console.log("Refetch Qs", queryKey)
      // Directly refetch if it's a string
      await queryClient.refetchQueries(queriesToRefetch);
    } else if (Array.isArray(queriesToRefetch)) {
      console.log("RefetchqueriesToRefetch Q", queryKey)
      // Handle array of query keys, assuming they are strings for simplicity
      await Promise.all(
        queriesToRefetch.map(key => {
          if (typeof key === 'string') {
            // Use the string directly
            return queryClient.refetchQueries(key);
          }
          // Add more handling here if your keys can be more complex
          return Promise.resolve();
        })
      );
    }
    // Add handling for other types of QueryKey if needed
  }, [queryClient, delayMs]);
};
