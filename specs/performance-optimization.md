# Spec: Performance Optimization and Monitoring

## Purpose

Define performance standards, optimization strategies, and monitoring approach to achieve sub-3 second load times and excellent Core Web Vitals.

## Current State Assessment

- **Performance Score**: 70/100 - Good foundation with optimization opportunities
- **Bundle Size**: ~600KB+ (opportunity for reduction)
- **Loading Performance**: No comprehensive monitoring
- **Core Web Vitals**: Not measured
- **Caching Strategy**: Basic, could be enhanced

## Performance Targets

### Core Web Vitals (Lighthouse)

- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8 seconds
- **Speed Index**: < 3.4 seconds

### Bundle Size Targets

- **Initial Bundle**: < 300KB gzipped
- **Total Bundle**: < 500KB gzipped
- **Vendor Bundle**: < 200KB gzipped
- **CSS Bundle**: < 50KB gzipped

### Loading Performance

- **Time to Interactive**: < 3.5 seconds
- **Time to First Byte**: < 600ms
- **Server Response Time**: < 200ms
- **Database Query Time**: < 100ms

## Optimization Strategy

### Phase 1: Bundle Optimization (Priority: High)

#### Code Splitting Implementation

```javascript
// client/src/App.tsx
import React, { Suspense, lazy } from 'react';

// Lazy load major page components
const Celebrate = lazy(() => import('./pages/Celebrate/Celebrate'));
const Splash = lazy(() => import('./pages/Splash/Splash'));
const Account = lazy(() => import('./pages/Account/Account'));

// Lazy load heavy components
const PolCarousel = lazy(() => import('./components/interactive/PolCarousel'));
const DonationLimitsModal = lazy(
  () => import('./components/modals/DonationLimits')
);

// Route-based code splitting
const routes = {
  '/': lazy(() => import('./pages/Splash')),
  '/celebrate': lazy(() => import('./pages/Celebrate')),
  '/account': lazy(() => import('./pages/Account')),
};
```

#### Webpack Configuration Optimization

```javascript
// client/craco.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Enable tree shaking
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };

      // Add bundle analyzer in development
      if (process.env.ANALYZE) {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin());
      }

      return webpackConfig;
    },
  },
};
```

#### Dynamic Imports for Heavy Dependencies

```javascript
// client/src/utils/heavyUtils.js
export const loadHeavyLibrary = async () => {
  const { default: heavyLibrary } = await import('heavy-library');
  return heavyLibrary;
};

// client/src/components/Charts/ChartComponent.tsx
const ChartComponent = () => {
  const [Chart, setChart] = useState(null);

  useEffect(() => {
    import('react-chartjs-2').then(({ Line }) => {
      setChart(() => Line);
    });
  }, []);

  if (!Chart) return <div>Loading chart...</div>;
  return <Chart data={data} />;
};
```

### Phase 2: Image and Asset Optimization

#### Image Optimization Strategy

```javascript
// client/src/components/Image/OptimizedImage.tsx
import React from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  loading = 'lazy'
}) => {
  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={loading}
      decoding="async"
      onLoad={(e) => {
        // Add loading animation removal
        e.currentTarget.classList.add('loaded');
      }}
    />
  );
};

export default OptimizedImage;
```

#### WebP Conversion and Responsive Images

```bash
# Convert images to WebP format
npm install --save-dev imagemin imagemin-webp

# Add to package.json scripts
"optimize-images": "imagemin client/src/assets/* --out-dir=client/src/assets/optimized --plugin=webp"
```

#### Asset Preloading Strategy

```html
<!-- client/public/index.html -->
<head>
  <!-- Preload critical resources -->
  <link
    rel="preload"
    href="/static/css/critical.css"
    as="style"
  />
  <link
    rel="preload"
    href="/static/js/main.js"
    as="script"
  />

  <!-- Preload fonts -->
  <link
    rel="preload"
    href="/fonts/oswald.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />

  <!-- DNS prefetch for external domains -->
  <link
    rel="dns-prefetch"
    href="//api.stripe.com"
  />
  <link
    rel="dns-prefetch"
    href="//www.google-analytics.com"
  />
</head>
```

### Phase 3: Caching and Service Worker

#### Service Worker Implementation

```javascript
// client/public/sw.js
const CACHE_NAME = 'powerback-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/media/logo.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});
```

#### API Response Caching

```javascript
// client/src/api/API.ts
class CachedAPI {
  private cache = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async get(endpoint: string, useCache = true) {
    if (useCache && this.cache.has(endpoint)) {
      const cached = this.cache.get(endpoint);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const response = await axios.get(endpoint);

    if (useCache) {
      this.cache.set(endpoint, {
        data: response,
        timestamp: Date.now()
      });
    }

    return response;
  }
}
```

### Phase 4: Database and Backend Optimization

#### Database Query Optimization

```javascript
// services/electionCycleService.js
const getEffectiveLimits = async (tier, donations, polId, state) => {
  // Add database indexes for common queries
  const donationQuery = {
    userId: donations.userId,
    status: { $in: ['pending', 'resolved'] },
    createdAt: { $gte: new Date('2026-01-01') },
  };

  // Use aggregation pipeline for complex calculations
  const donationSum = await Donation.aggregate([
    { $match: donationQuery },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return {
    effectiveLimit: getLimitForTier(tier),
    remainingLimit: Math.max(
      0,
      getLimitForTier(tier) - (donationSum[0]?.total || 0)
    ),
    resetDate: getResetDate(tier, state),
  };
};
```

#### API Response Optimization

```javascript
// routes/api/users.js
router.get('/data/:userId', async (req, res) => {
  // Use projection to limit returned fields
  const userData = await User.findById(req.params.userId)
    .select('username email compliance settings -_id')
    .lean(); // Return plain JavaScript object

  // Compress response
  res.set('Content-Encoding', 'gzip');
  res.json(userData);
});
```

## Performance Monitoring

### Core Web Vitals Monitoring

```javascript
// client/src/utils/performance.js
export const measureCoreWebVitals = () => {
  // LCP
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // FID
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      console.log('FID:', entry.processingStart - entry.startTime);
    });
  }).observe({ entryTypes: ['first-input'] });

  // CLS
  new PerformanceObserver((entryList) => {
    let clsValue = 0;
    for (const entry of entryList.getEntries()) {
      clsValue += entry.value;
    }
    console.log('CLS:', clsValue);
  }).observe({ entryTypes: ['layout-shift'] });
};
```

### Bundle Size Monitoring

```javascript
// scripts/analyze-bundle.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const fs = require('fs');
const path = require('path');

const analyzeBundle = () => {
  const bundlePath = path.join(__dirname, '../client/build/static/js');
  const files = fs.readdirSync(bundlePath);

  const bundleSizes = files
    .filter((file) => file.endsWith('.js'))
    .map((file) => {
      const filePath = path.join(bundlePath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024),
      };
    });

  console.table(bundleSizes);

  const totalSize = bundleSizes.reduce((sum, file) => sum + file.size, 0);
  console.log(`Total bundle size: ${Math.round(totalSize / 1024)}KB`);

  if (totalSize > 500 * 1024) {
    throw new Error('Bundle size exceeds 500KB limit');
  }
};
```

### Performance Budgets

```javascript
// .performance-budget.json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "300kb",
      "maximumError": "500kb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "50kb",
      "maximumError": "100kb"
    }
  ]
}
```

## Optimization Checklist

### Bundle Optimization

- [ ] Implement code splitting for routes
- [ ] Lazy load heavy components
- [ ] Optimize webpack configuration
- [ ] Remove unused dependencies
- [ ] Implement tree shaking
- [ ] Add bundle analyzer

### Image Optimization

- [ ] Convert images to WebP format
- [ ] Implement responsive images
- [ ] Add lazy loading for images
- [ ] Optimize image sizes
- [ ] Use appropriate image formats

### Caching Strategy

- [ ] Implement service worker
- [ ] Add API response caching
- [ ] Configure CDN caching
- [ ] Implement browser caching
- [ ] Add cache invalidation strategy

### Backend Optimization

- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Implement response compression
- [ ] Add API response caching
- [ ] Optimize server response times

### Monitoring Setup

- [ ] Implement Core Web Vitals monitoring
- [ ] Add bundle size monitoring
- [ ] Set up performance budgets
- [ ] Add error tracking
- [ ] Implement user experience monitoring

## Acceptance Criteria

### Performance Targets

- Lighthouse score > 90 for all metrics
- Bundle size < 500KB gzipped
- LCP < 2.5 seconds
- FID < 100ms
- CLS < 0.1

### Monitoring Requirements

- Real-time performance monitoring
- Automated performance testing
- Performance budget enforcement
- Error tracking and alerting
- User experience metrics

### Optimization Validation

- Bundle analysis reports
- Performance regression testing
- Cross-browser compatibility
- Mobile performance validation
- Accessibility performance verification

## Links

- Rules: 07-frontend-patterns, 14-testing-and-quality
- Code: `client/craco.config.js`, `client/src/utils/performance.js`
- Related: specs/quality-assessment.md, specs/testing-strategy.md
