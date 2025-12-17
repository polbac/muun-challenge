// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

// This file must be imported FIRST before any other imports
import tracer from 'dd-trace';

// Initialize tracer only if DD_API_KEY is set
if (process.env.DD_API_KEY) {
  tracer.init({
    service: process.env.DD_SERVICE || 'muun-challenge',
    env: process.env.DD_ENV || 'development',
    version: process.env.DD_VERSION || '1.0.0',
    logInjection: true,
    runtimeMetrics: true,
    profiling: true,
    // HTTP tracing
    plugins: true,
  });

  console.log('✅ Datadog APM initialized');
} else {
  console.log('ℹ️  Datadog APM disabled (DD_API_KEY not set)');
}

export default tracer;
