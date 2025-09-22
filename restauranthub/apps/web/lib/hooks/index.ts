// Core API hooks
export * from './useApi';

// Service-specific hooks
export * from './useRestaurants';
export * from './useJobs';

// Re-export commonly used types
export type {
  ApiResponse,
  PaginatedResponse,
  Restaurant,
  CreateRestaurantRequest,
  RestaurantFilters,
  Job,
  CreateJobRequest,
  JobFilters,
  JobApplication,
} from '../api';