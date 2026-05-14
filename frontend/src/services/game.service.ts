import { api } from './api';

export type GameDefinition = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const GAMES: GameDefinition[] = [
  {
    id: 'memory',
    title: 'Hafıza Bahçesi',
    description: 'Şekilleri hatırla ve doğru sırayla dokun!',
    icon: '🧠',
  },
  {
    id: 'attention',
    title: 'Dikkat Görevi',
    description: 'Sadece "GİT" uyarısında dokun, diğerlerini bekle!',
    icon: '🎯',
  },
  {
    id: 'logic',
    title: 'Hız Meydan Okuması',
    description: 'Hedeflere olabildiğince hızlı dokun!',
    icon: '⚡',
  },
];

export type StartGameSessionRequest = {
  childId: string;
  gameId: string;
};

export type StartGameSessionResponse = {
  sessionId: string;
  childId: string;
  gameId: string;
  startedAt: string;
};

export type EndGameSessionRequest = {
  sessionId: string;
  score: number;
  duration: number;
  accuracy: number;
  metadata?: Record<string, any>;
};

export type EndGameSessionResponse = {
  success: true;
  sessionId: string;
};

export const gameService = {
  async start(payload: StartGameSessionRequest) {
    const { data } = await api.post<StartGameSessionResponse>(
      '/game-sessions/start',
      payload,
    );
    return data;
  },
  async end(payload: EndGameSessionRequest) {
    const { data } = await api.post<EndGameSessionResponse>('/game-sessions/end', payload);
    return data;
  },
};

