// Extend the PerformanceEntry interface to include initiatorType
interface PerformanceResourceTimingExtended extends PerformanceEntry {
  initiatorType?: string;
}

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries: PerformanceEntry[];
  id: string;
  navigationType: string;
}

type ReportHandler = (metric: Metric) => void;

export const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Using dynamic import to avoid SSR issues with web-vitals
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      // Use the web-vitals functions with the correct names
      // Note: onFID is deprecated in newer versions, using onINP instead
      onCLS(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
      onINP?.(onPerfEntry);  // Optional chaining as it might not be available in all versions
    }).catch((error) => {
      console.error('Error loading web-vitals:', error);
    });
  }
};

export const logWebVitals = (metric: Metric) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  } else {
    // Send metrics to your analytics service in production
    // Example: trackAnalytics(metric.name, metric.value);
  }
};

export const trackNavigationTiming = (): void => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigation) {
      console.log('Navigation timing:', navigation);
      // Send to analytics
    }
  }
};

export const trackResourceTiming = (): void => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTimingExtended[];
    const criticalResources = resources.filter(
      (resource) => 
        resource.initiatorType === 'script' || 
        resource.initiatorType === 'css' ||
        resource.initiatorType === 'font'
    );
    
    console.log('Critical resources timing:', criticalResources);
    // Send to analytics
  }
};
