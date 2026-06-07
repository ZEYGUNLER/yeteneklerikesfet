/**
 * Centralized route constants for the application.
 * Use these instead of hardcoded strings to avoid typos and make refactoring easier.
 */
export const ROUTES = {
  // SHARED
  ROOT: '/',
  SUMMARY: '/games/summary',

  // AUTH
  LOGIN: '/login',
  REGISTER: '/register',

  // CHILD
  PROFILE_PICKER: '/profiles/picker',
  GAMES: '/games',
  WORLD_MAP: '/games/map',
  GAME_PLAY: '/games/play',

  // PARENT
  DASHBOARD: '/dashboard',
  CHILDREN_LIST: '/children',
  CREATE_CHILD: '/children/create',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

/**
 * Route ownership categories for guard logic and analytics.
 */
export const ROUTE_OWNERSHIP = {
  [ROUTES.ROOT]: 'SHARED',
  [ROUTES.SUMMARY]: 'SHARED',
  [ROUTES.LOGIN]: 'AUTH',
  [ROUTES.REGISTER]: 'AUTH',
  [ROUTES.PROFILE_PICKER]: 'CHILD',
  [ROUTES.GAMES]: 'CHILD',
  [ROUTES.WORLD_MAP]: 'CHILD',
  [ROUTES.GAME_PLAY]: 'CHILD',
  [ROUTES.DASHBOARD]: 'PARENT',
  [ROUTES.CHILDREN_LIST]: 'PARENT',
  [ROUTES.CREATE_CHILD]: 'PARENT',
} as const;

export type RouteCategory = typeof ROUTE_OWNERSHIP[keyof typeof ROUTE_OWNERSHIP];
