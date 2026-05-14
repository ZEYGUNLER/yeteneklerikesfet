import { useState, useCallback, useRef } from 'react';

interface MetricState {
  score: number;
  attempts: number;
  correct: number;
  mistakes: number;
  consecutiveMistakes: number;
  maxConsecutiveMistakes: number;
  reactionTimes: number[];
  highestLevel: number;
}

export function useGameMetrics() {
  const [metrics, setMetrics] = useState<MetricState>({
    score: 0,
    attempts: 0,
    correct: 0,
    mistakes: 0,
    consecutiveMistakes: 0,
    maxConsecutiveMistakes: 0,
    reactionTimes: [],
    highestLevel: 1,
  });

  const lastEventTimeRef = useRef<number>(Date.now());

  const recordInteraction = useCallback((isCorrect: boolean, level?: number) => {
    const now = Date.now();
    const reactionTime = now - lastEventTimeRef.current;
    lastEventTimeRef.current = now;

    setMetrics((prev) => {
      const nextConsecutive = isCorrect ? 0 : prev.consecutiveMistakes + 1;
      return {
        ...prev,
        attempts: prev.attempts + 1,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        mistakes: isCorrect ? prev.mistakes : prev.mistakes + 1,
        consecutiveMistakes: nextConsecutive,
        maxConsecutiveMistakes: Math.max(prev.maxConsecutiveMistakes, nextConsecutive),
        score: isCorrect ? prev.score + 1 : prev.score,
        reactionTimes: [...prev.reactionTimes, reactionTime],
        highestLevel: level ? Math.max(prev.highestLevel, level) : prev.highestLevel,
      };
    });
  }, []);

  const updateLevel = useCallback((level: number) => {
    setMetrics((prev) => ({
      ...prev,
      highestLevel: Math.max(prev.highestLevel, level),
    }));
  }, []);

  const resetTimer = useCallback(() => {
    lastEventTimeRef.current = Date.now();
  }, []);

  const getFinalMetrics = useCallback(() => {
    const { reactionTimes, attempts, correct, mistakes, maxConsecutiveMistakes, highestLevel } = metrics;
    
    const accuracy = attempts > 0 ? correct / attempts : 0;
    
    const sortedReactions = [...reactionTimes].sort((a, b) => a - b);
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;
    
    const fastestReaction = sortedReactions.length > 0 ? sortedReactions[0] : 0;
    const slowestReaction = sortedReactions.length > 0 ? sortedReactions[sortedReactions.length - 1] : 0;
    
    // Simple consistency: Standard Deviation
    const variance = reactionTimes.length > 0
      ? reactionTimes.reduce((sq, n) => sq + Math.pow(n - avgReactionTime, 2), 0) / reactionTimes.length
      : 0;
    const stdDev = Math.sqrt(variance);

    return {
      score: metrics.score,
      accuracy,
      duration: 0, // Calculated by session hook
      metadata: {
        attempts,
        correct,
        mistakes,
        maxConsecutiveMistakes,
        highestLevel,
        avgReactionTime: Math.round(avgReactionTime),
        fastestReaction,
        slowestReaction,
        reactionConsistency: Math.round(stdDev),
        hesitationCount: reactionTimes.filter(t => t > 2000).length, // Reactions > 2s
        fatigueIndex: (reactionTimes.length > 10 && (reactionTimes.slice(0,5).reduce((a,b)=>a+b,0)) > 0)
          ? (reactionTimes.slice(-5).reduce((a,b)=>a+b,0)/5) / (reactionTimes.slice(0,5).reduce((a,b)=>a+b,0)/5)
          : 1, // Ratio of last 5 to first 5 reaction times
      }
    };
  }, [metrics]);

  return {
    metrics,
    recordInteraction,
    updateLevel,
    getFinalMetrics,
    resetTimer,
  };
}
