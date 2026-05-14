import { ROUTES, ROUTE_OWNERSHIP, type RoutePath } from './routes';

/**
 * Checks if a route belongs to the AUTH category.
 */
export const isAuthRoute = (path: string): boolean => {
  return ROUTE_OWNERSHIP[path as RoutePath] === 'AUTH';
};

/**
 * Checks if a route belongs to the CHILD category.
 */
export const isChildRoute = (path: string): boolean => {
  return ROUTE_OWNERSHIP[path as RoutePath] === 'CHILD';
};

/**
 * Checks if a route belongs to the PARENT category.
 */
export const isParentRoute = (path: string): boolean => {
  return ROUTE_OWNERSHIP[path as RoutePath] === 'PARENT';
};

/**
 * Checks if a route is protected (requires authentication).
 * Currently, all routes except AUTH and some SHARED routes are protected.
 */
export const isProtectedRoute = (path: string): boolean => {
  const category = ROUTE_OWNERSHIP[path as RoutePath];
  return category === 'CHILD' || category === 'PARENT';
};

/**
 * Cleans a route path for comparison.
 * Removes trailing slashes and query params.
 */
export const cleanPath = (path: string): string => {
  const base = path.split('?')[0];
  return base.endsWith('/') && base.length > 1 ? base.slice(0, -1) : base;
};
