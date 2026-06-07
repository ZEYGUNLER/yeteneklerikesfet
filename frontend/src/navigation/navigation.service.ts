import { router } from 'expo-router';
import { ROUTES } from './routes';

/**
 * Log navigation events in development mode for easier debugging.
 */
const logNavigation = (to: string, reason?: string) => {
  if (__DEV__) {
    console.log(`[Navigation] TO: ${to}${reason ? ` (REASON: ${reason})` : ''}`);
  }
};

/**
 * Centralized navigation service to handle all redirects and transitions.
 */
export const navigationService = {
  // --- AUTH FLOW ---
  goToLogin: (reason?: string) => {
    logNavigation(ROUTES.LOGIN, reason);
    router.replace(ROUTES.LOGIN);
  },
  goToRegister: () => {
    logNavigation(ROUTES.REGISTER);
    router.replace(ROUTES.REGISTER);
  },

  // --- CHILD FLOW ---
  goToProfilePicker: (reason?: string) => {
    logNavigation(ROUTES.PROFILE_PICKER, reason);
    router.replace(ROUTES.PROFILE_PICKER);
  },
  goToGames: () => {
    logNavigation(ROUTES.GAMES);
    router.replace(ROUTES.GAMES);
  },
  goToGamePlay: (gameId: string) => {
    logNavigation(`${ROUTES.GAME_PLAY}?gameId=${gameId}`);
    router.push({ pathname: ROUTES.GAME_PLAY, params: { gameId } });
  },
  goToGameSummary: (params: { 
    score: number; 
    duration?: number; 
    accuracy: number; 
    totalCorrect?: number;
    longestSequence?: number;
    starsEarned?: number;
    earnedXP?: number;
    leveledUp?: number;
    newAchievements?: string;
    newUnlocks?: string;
    // Attention-specific
    gameType?: string;
    attentionScore?: number;
    inhibitionScore?: number;
    avgReactionTime?: number;
    bestStreak?: number;
  }) => {
    logNavigation(ROUTES.SUMMARY);
    router.replace({ pathname: ROUTES.SUMMARY, params: params as any });
  },

  // --- PARENT FLOW ---
  goToDashboard: (reason?: string) => {
    logNavigation(ROUTES.DASHBOARD, reason);
    router.replace(ROUTES.DASHBOARD);
  },
  goToChildrenList: () => {
    logNavigation(ROUTES.CHILDREN_LIST);
    router.push(ROUTES.CHILDREN_LIST);
  },
  goToCreateChild: () => {
    logNavigation(ROUTES.CREATE_CHILD);
    router.push(ROUTES.CREATE_CHILD);
  },

  // --- GENERIC ---
  goBack: () => {
    if (__DEV__) console.log('[Navigation] BACK');
    router.back();
  },
  replace: (path: string, reason?: string) => {
    logNavigation(path, reason);
    router.replace(path as any);
  }
};
