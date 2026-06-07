import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, ActivityIndicator } from 'react-native';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameMetrics } from '@/hooks/useGameMetrics';
import { useGameplayReady } from '@/hooks/useGameplayReady';
import { GameLayout } from '@/components/games/GameLayout';
import { GameButton } from '@/components/games/GameActionCard';
import { navigationService } from '@/navigation/navigation.service';
import { InteractionOnboarding } from '@/components/common/InteractionOnboarding';
import { getMapForRound } from '@/config/treasureMaps.config';
import { calculateOptimalPathLength } from '@/utils/graph.utils';

const TOTAL_ROUNDS = 8;
const TOTAL_WORLDS = 3;

type FSMState = 'starting' | 'plan_mode' | 'execute_path' | 'path_success' | 'path_failed' | 'world_transition' | 'summary';

export function MemoryGameScreen() {
  const { status, error, finishGame } = useGameSession({ gameId: 'planning' });
  const { recordInteraction, getFinalMetrics } = useGameMetrics();
  const { isReady, showOnboarding, dismissOnboarding } = useGameplayReady(status);

  // ── Progression State ────────────────────────────────────────────────────────
  const [world, setWorld] = useState<number>(1);
  const [round, setRound] = useState<number>(1);
  const [gameState, setGameState] = useState<FSMState>('starting');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<any>(null);

  // ── Path & Layout State ──────────────────────────────────────────────────────
  const [plannedPath, setPlannedPath] = useState<string[]>(['A']);
  const [currentNodeId, setCurrentNodeId] = useState<string>('A');
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [containerLayout, setContainerLayout] = useState<{ width: number; height: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const charPosAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;

  // ── Analytics Metrics Refs ───────────────────────────────────────────────────
  const optimalPathLengthRef = useRef(0);
  const actualPathLengthRef = useRef(0);
  const deadEndsVisitedRef = useRef(0);
  const replanningEventsRef = useRef(0);
  const impulsiveStartsRef = useRef(0);
  const planningStartTimeRef = useRef(Date.now());
  const decisionTimesRef = useRef<number[]>([]);

  // ── Timer Registry ───────────────────────────────────────────────────────────
  const timerRegistry = useRef<Set<NodeJS.Timeout>>(new Set());

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timerRegistry.current.delete(timer);
      callback();
    }, delay);
    timerRegistry.current.add(timer);
    return timer;
  }, []);

  const clearAllTimers = useCallback(() => {
    timerRegistry.current.forEach(clearTimeout);
    timerRegistry.current.clear();
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [bounceAnim]);

  useEffect(() => {
    if (gameState === 'path_success') {
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      successScaleAnim.setValue(0);
    }
  }, [gameState, successScaleAnim]);

  // Set base position when container layout is resolved
  useEffect(() => {
    if (containerLayout) {
      const map = getMapForRound(world, round);
      const startNode = map.nodes.find(n => n.id === 'A');
      if (startNode) {
        charPosAnim.setValue({
          x: (startNode.x / 100) * containerLayout.width,
          y: (startNode.y / 100) * containerLayout.height,
        });
      }
    }
  }, [containerLayout, world, round, charPosAnim]);

  const prepareMap = useCallback((w: number, r: number) => {
    setWorld(w);
    setRound(r);
    setPlannedPath(['A']);
    setCurrentNodeId('A');
    setHasKey(false);
    setErrorMessage(null);
    setGameState('plan_mode');
    planningStartTimeRef.current = Date.now();

    const map = getMapForRound(w, r);
    const optimalLength = calculateOptimalPathLength(map.nodes, 'A');
    if (optimalLength !== null) {
      optimalPathLengthRef.current += optimalLength;
    } else {
      optimalPathLengthRef.current += 1;
    }
  }, []);

  useEffect(() => {
    if (isReady && gameState === 'starting') {
      setGameState('world_transition');
      safeSetTimeout(() => prepareMap(1, 1), 2500);
    }
  }, [isReady, gameState, prepareMap, safeSetTimeout]);

  const handleLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerLayout({ width, height });
  };

  const handleNodePress = (nodeId: string) => {
    if (gameState !== 'plan_mode') return;

    const idx = plannedPath.indexOf(nodeId);
    if (idx !== -1 && idx > 0) {
      setPlannedPath(plannedPath.slice(0, idx + 1));
      setErrorMessage(null);
      return;
    }

    const map = getMapForRound(world, round);
    const lastNodeId = plannedPath[plannedPath.length - 1];
    const lastNode = map.nodes.find(n => n.id === lastNodeId);

    if (lastNode && lastNode.connections.includes(nodeId)) {
      setPlannedPath([...plannedPath, nodeId]);
      setErrorMessage(null);
    } else {
      setErrorMessage('Yalnızca çizgilerle bağlı olan komşu duraklara gidebilirsin!');
    }
  };

  const executePath = async () => {
    if (plannedPath.length <= 1) {
      setErrorMessage('Önce gitmek istediğin durakları seçmelisin!');
      return;
    }

    const map = getMapForRound(world, round);
    const lastNodeId = plannedPath[plannedPath.length - 1];

    const treasureNode = map.nodes.find(n => n.type === 'treasure');
    if (lastNodeId !== treasureNode?.id) {
      impulsiveStartsRef.current++;
      setErrorMessage('Haritayı tamamlamadan yola çıkamazsın! Rota çizmeye devam et.');
      return;
    }

    const decisionTime = Date.now() - planningStartTimeRef.current;
    decisionTimesRef.current.push(decisionTime);

    setGameState('execute_path');
    setErrorMessage(null);

    let keyCollected = hasKey;
    let pathPassed = true;
    let stopIndex = plannedPath.length - 1;

    for (let i = 1; i < plannedPath.length; i++) {
      const nextId = plannedPath[i];
      const nextNode = map.nodes.find(n => n.id === nextId)!;

      if (containerLayout) {
        const targetX = (nextNode.x / 100) * containerLayout.width;
        const targetY = (nextNode.y / 100) * containerLayout.height;

        await new Promise<void>(resolve => {
          Animated.timing(charPosAnim, {
            toValue: { x: targetX, y: targetY },
            duration: 500, // Slightly faster walk
            useNativeDriver: false,
          }).start(() => resolve());
        });
      }

      setCurrentNodeId(nextId);
      actualPathLengthRef.current++;

      if (nextNode.type === 'key') {
        keyCollected = true;
        setHasKey(true);
      }

      if (nextNode.type === 'gate' && !keyCollected) {
        pathPassed = false;
        stopIndex = i - 1;
        setErrorMessage('🚪 Bu kapı kilitli! Önce anahtarı (🔑) almalısın.');
        break;
      }

      if (nextNode.type === 'risky') {
        pathPassed = false;
        stopIndex = i - 1;
        deadEndsVisitedRef.current++;
        setErrorMessage(`${nextNode.emoji} Dikkat et! Burası çok tehlikeli, başka bir rota çizmelisin.`);
        break;
      }

      if (nextNode.type === 'deadend') {
        pathPassed = false;
        stopIndex = i - 1;
        deadEndsVisitedRef.current++;
        setErrorMessage('🪨 Yol kapalı! Geri dönüp farklı bir rota çizmelisin.');
        break;
      }
    }

    if (pathPassed) {
      setGameState('path_success');
      recordInteraction(true);
      
      // Auto advance quickly (1.5 seconds)
      safeSetTimeout(() => {
        advanceLevel();
      }, 1500);
    } else {
      setGameState('path_failed');
      replanningEventsRef.current++;
      recordInteraction(false);

      const safePath = plannedPath.slice(0, stopIndex + 1);
      setPlannedPath(safePath);
      setCurrentNodeId(safePath[safePath.length - 1]);
    }
  };

  const handleFinishGame = async () => {
    setIsSaving(true);
    const final = getFinalMetrics();

    const avgDecision = decisionTimesRef.current.length > 0
      ? Math.round(decisionTimesRef.current.reduce((a, b) => a + b, 0) / decisionTimesRef.current.length)
      : 0;

    const actual = actualPathLengthRef.current;
    const optimal = optimalPathLengthRef.current;
    const routeEfficiency = actual > 0 ? parseFloat((optimal / actual).toFixed(2)) : 1.0;
    const optimalPathRatio = Math.min(1.0, routeEfficiency);
    const replanningQuality = deadEndsVisitedRef.current > 0 ? Math.max(0, 1 - (deadEndsVisitedRef.current * 0.15)) : 1.0;
    const planningTimeMs = decisionTimesRef.current[0] || 2000;
    const hints = 0;
    const completionRate = 1.0;

    const planningScore = Math.max(0, Math.min(100, Math.round(routeEfficiency * 100 - (deadEndsVisitedRef.current * 10) - (impulsiveStartsRef.current * 5))));
    const starsEarned = planningScore >= 85 ? 3 : planningScore >= 65 ? 2 : planningScore >= 45 ? 1 : 0;

    try {
      const summaryPayload = await finishGame({
        score: final.score,
        accuracy: final.accuracy,
        metadata: {
          ...final.metadata,
          planning: {
            version: 1,
            routeEfficiency,
            optimalPathRatio,
            replanningQuality,
            planningTimeMs,
            deadEnds: deadEndsVisitedRef.current,
            hints,
            completionRate
          },
          starsEarned,
          gameType: 'planning',
        },
      }, true);

      setSaveResult(summaryPayload);
    } catch (e) {
      console.error('[MemoryGameScreen] Error saving game session:', e);
    } finally {
      setIsSaving(false);
      setGameState('summary');
    }
  };

  const advanceLevel = () => {
    if (round < TOTAL_ROUNDS) {
      prepareMap(world, round + 1);
    } else if (world < TOTAL_WORLDS) {
      setGameState('world_transition');
      safeSetTimeout(() => {
        prepareMap(world + 1, 1);
      }, 2500);
    } else {
      void handleFinishGame();
    }
  };

  const renderLines = () => {
    if (!containerLayout) return null;
    const map = getMapForRound(world, round);
    const elements: any[] = [];
    const drawn = new Set<string>();

    map.nodes.forEach(node => {
      node.connections.forEach(connId => {
        const other = map.nodes.find(n => n.id === connId);
        if (!other) return;

        const lineKey = [node.id, connId].sort().join('-');
        if (drawn.has(lineKey)) return;
        drawn.add(lineKey);

        const x1 = (node.x / 100) * containerLayout.width;
        const y1 = (node.y / 100) * containerLayout.height;
        const x2 = (other.x / 100) * containerLayout.width;
        const y2 = (other.y / 100) * containerLayout.height;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        let isPathLine = false;
        for (let i = 1; i < plannedPath.length; i++) {
          const p1 = plannedPath[i - 1];
          const p2 = plannedPath[i];
          if ((p1 === node.id && p2 === connId) || (p1 === connId && p2 === node.id)) {
            isPathLine = true;
            break;
          }
        }

        elements.push(
          <View
            key={lineKey}
            style={[
              styles.connectionLine,
              {
                left: x1,
                top: y1,
                width: length,
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: -1.5 },
                ],
                transformOrigin: 'left center',
              },
              isPathLine && styles.activePathLine,
            ]}
          >
            {isPathLine && (
              <View style={[styles.footprintOverlay, { width: length }]} />
            )}
          </View>
        );
      });
    });

    return elements;
  };

  const renderWorldCard = () => {
    let title, subtitle, bg;
    if (world === 1) {
      title = "🏝️ Kayıp Ada"; subtitle = "Maceraya Başlıyorsun!"; bg = "#FEF3C7";
    } else if (world === 2) {
      title = "🗝️ Unutulmuş Tapınak"; subtitle = "Anahtar ve Kapılar Diyarı"; bg = "#E0E7FF";
    } else {
      title = "🐉 Ejderhanın Hazinesi"; subtitle = "Tehlikeli Tuzaklara Dikkat!"; bg = "#FFEDD5";
    }

    return (
      <View style={[styles.worldCardContainer, { backgroundColor: bg }]}>
        <Text style={styles.worldCardTitle}>{title}</Text>
        <Text style={styles.worldCardSubtitle}>{subtitle}</Text>
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 24 }} />
      </View>
    );
  };

  if (status === 'error') {
    return (
      <GameLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Bir sorun oluştu</Text>
          <Text style={styles.errorText}>{error || 'Oyun başlatılamadı.'}</Text>
          <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
            onPress={() => navigationService.goToGames()}>
            <Text style={styles.retryBtnText}>Oyunlara Dön</Text>
          </Pressable>
        </View>
      </GameLayout>
    );
  }

  if (isSaving) {
    return (
      <GameLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Kaşif puanı hesaplanıyor...</Text>
          <Text style={styles.loadingSubtext}>Seyir defteri hazırlanıyor...</Text>
        </View>
      </GameLayout>
    );
  }

  if (gameState === 'summary') {
    const finalStats = getFinalMetrics();
    const actual = actualPathLengthRef.current;
    const optimal = optimalPathLengthRef.current;
    const routeEfficiency = actual > 0 ? parseFloat((optimal / actual).toFixed(2)) : 1.0;
    const planningScore = Math.max(0, Math.min(100, Math.round(routeEfficiency * 100 - (deadEndsVisitedRef.current * 10) - (impulsiveStartsRef.current * 5))));
    const stars = planningScore >= 85 ? 3 : planningScore >= 65 ? 2 : planningScore >= 45 ? 1 : 0;

    return (
      <GameLayout>
        <View style={styles.cardContainer}>
          <Text style={styles.cardHeader}>🗺️ Seyir Defteri 🗺️</Text>
          <Text style={styles.cardTitle}>Kaşif Skoru</Text>

          <View style={styles.starsContainer}>
            <Text style={styles.starsText}>
              {stars >= 1 ? '⭐' : '☆'} {stars >= 2 ? '⭐' : '☆'} {stars >= 3 ? '⭐' : '☆'}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🧠</Text>
              <Text style={styles.statLabel}>Toplam Skor</Text>
              <Text style={[styles.statValue, { color: '#D97706' }]}>%{planningScore}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⚡</Text>
              <Text style={styles.statLabel}>Verimlilik</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>%{Math.round(routeEfficiency * 100)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🪨</Text>
              <Text style={styles.statLabel}>Yanlış Duraklar</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{deadEndsVisitedRef.current}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🚨</Text>
              <Text style={styles.statLabel}>Aceleci Başlangıç</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{impulsiveStartsRef.current}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <GameButton
              title="Macerayı Bitir"
              variant="primary"
              onPress={() => {
                if (saveResult) {
                  navigationService.goToGameSummary(saveResult);
                } else {
                  navigationService.goToGameSummary({
                    score: finalStats.score,
                    duration: 0,
                    accuracy: finalStats.accuracy,
                    totalCorrect: 0,
                    gameType: 'planning',
                  });
                }
              }}
            />
          </View>
        </View>
      </GameLayout>
    );
  }

  const currentMap = getMapForRound(world, round);

  return (
    <GameLayout>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.worldName}>{currentMap.name}</Text>
          <Text style={styles.worldSubtitle}>{currentMap.subtitle}</Text>
        </View>
        <Text style={styles.roundCounter}>Harita {round}/{TOTAL_ROUNDS}</Text>
      </View>

      {/* ── Hint Bar ── */}
      <View style={styles.hintBar}>
        <Text style={styles.hintText}>{currentMap.hint}</Text>
      </View>

      {/* ── World Transition ── */}
      {gameState === 'world_transition' ? (
        renderWorldCard()
      ) : (
        /* ── Node Map Area ── */
        <View style={styles.mapWrapper}>
          <View style={styles.parchmentBackground}>
            <View style={styles.mapCanvas} onLayout={handleLayout}>
              {containerLayout && renderLines()}

              {/* Render Nodes */}
              {containerLayout && currentMap.nodes.map(node => {
                const left = (node.x / 100) * containerLayout.width;
                const top = (node.y / 100) * containerLayout.height;

                const isSelected = plannedPath.includes(node.id);
                const isCurrent = currentNodeId === node.id;
                const lastNodeId = plannedPath[plannedPath.length - 1];
                const lastNode = currentMap.nodes.find(n => n.id === lastNodeId);
                const isNeighbor = gameState === 'plan_mode' && lastNode?.connections.includes(node.id);
                
                // PERFORMANCE FIX: Only animate nodes that are currently active or can be stepped on
                const shouldAnimate = isCurrent || isNeighbor;

                return (
                  <Pressable
                    key={node.id}
                    onPress={() => handleNodePress(node.id)}
                    disabled={gameState !== 'plan_mode'}
                    style={[
                      styles.nodeContainer,
                      { left: left - 24, top: top - 24 },
                      isSelected && styles.selectedNode,
                      isCurrent && styles.currentNode,
                    ]}
                  >
                    <Animated.Text style={[
                      styles.nodeEmoji, 
                      shouldAnimate && { transform: [{ translateY: Animated.multiply(bounceAnim, -4) }] }
                    ]}>
                      {node.emoji}
                    </Animated.Text>
                    <Text style={styles.nodeLabel}>{node.label}</Text>
                  </Pressable>
                );
              })}

              {/* Character Pin overlay */}
              {containerLayout && (
                <Animated.View
                  style={[
                    styles.characterPin,
                    {
                      transform: [
                        { translateX: charPosAnim.x },
                        { translateY: charPosAnim.y },
                        { translateX: -16 },
                        { translateY: -16 },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.characterPinEmoji}>🧒</Text>
                </Animated.View>
              )}

              {/* Success Celebration Overlay (1.5s) */}
              {gameState === 'path_success' && (
                <View style={StyleSheet.absoluteFill}>
                  <View style={styles.successOverlayBg} />
                  <Animated.View style={[styles.successBadge, { transform: [{ scale: successScaleAnim }] }]}>
                    <Text style={styles.successBadgeEmoji}>⭐</Text>
                    <Text style={styles.successBadgeText}>Akıllı Kaşif!</Text>
                    <Text style={styles.successBadgeSubtext}>Harika Strateji</Text>
                  </Animated.View>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ── Key Status Overlay ── */}
      {hasKey && gameState !== 'world_transition' && (
        <View style={styles.keyBadge}>
          <Text style={styles.keyBadgeText}>🔑 Anahtar Toplandı!</Text>
        </View>
      )}

      {/* ── Error / Alert Bar ── */}
      {errorMessage && (
        <View style={styles.errorAlert}>
          <Text style={styles.errorAlertText}>{errorMessage}</Text>
        </View>
      )}

      {/* ── Control Panel ── */}
      {gameState !== 'world_transition' && (
        <View style={styles.controls}>
          {gameState === 'plan_mode' ? (
            <Pressable
              onPress={executePath}
              style={({ pressed }) => [
                styles.goButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.goButtonText}>Yola Çık!</Text>
            </Pressable>
          ) : gameState === 'path_failed' ? (
            <Pressable
              onPress={() => {
                setGameState('plan_mode');
                setErrorMessage(null);
              }}
              style={({ pressed }) => [
                styles.editButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.editButtonText}>Rotayı Düzenle</Text>
            </Pressable>
          ) : gameState === 'path_success' ? (
             <View style={styles.executingBadgeSuccess}>
               <Text style={styles.executingBadgeSuccessText}>Hazine Bulundu! 🎁</Text>
             </View>
          ) : (
            <View style={styles.executingBadge}>
              <Text style={styles.executingBadgeText}>Rotayı Takip Ediyor...</Text>
            </View>
          )}

          <Pressable
            onPress={() => navigationService.goToGames()}
            disabled={gameState === 'execute_path' || gameState === 'path_success'}
            style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.exitBtnText}>Oyunlara Dön</Text>
          </Pressable>
        </View>
      )}

      {showOnboarding && (
        <InteractionOnboarding type="trace" onComplete={dismissOnboarding} />
      )}
    </GameLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  worldName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#78350F', // Dark amber/parchment tone
  },
  worldSubtitle: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  roundCounter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hintBar: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  hintText: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
    textAlign: 'center',
  },
  worldCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginVertical: 16,
    borderWidth: 4,
    borderColor: '#FCD34D',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  worldCardTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#78350F',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  worldCardSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  mapWrapper: {
    flex: 1,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#D97706', // High contrast parchment border
  },
  parchmentBackground: {
    flex: 1,
    backgroundColor: '#FFF8E7', // Clean, high contrast parchment base
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    margin: 16,
  },
  connectionLine: {
    position: 'absolute',
    height: 4, // Slightly thicker for readability
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1', // Subtle grey dash
    borderStyle: 'dashed',
    transformOrigin: 'left center',
  },
  activePathLine: {
    borderBottomColor: '#D97706', // Strong orange expedition dash
    borderBottomWidth: 4,
    zIndex: 1,
  },
  footprintOverlay: {
    height: '100%',
    backgroundColor: '#92400E', // Footprint color representation
    opacity: 0.3,
  },
  nodeContainer: {
    position: 'absolute',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', // Solid contrast background
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FBBF24',
    shadowColor: '#000', // Stronger shadow for graph readability
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 2,
  },
  selectedNode: {
    backgroundColor: '#FDE68A',
    borderColor: '#D97706',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  currentNode: {
    borderColor: '#92400E',
    borderWidth: 3,
    backgroundColor: '#FEF08A',
  },
  nodeEmoji: {
    fontSize: 24,
  },
  nodeLabel: {
    position: 'absolute',
    bottom: -24,
    fontSize: 11,
    fontWeight: '800',
    color: '#78350F', // Darker for readability
    textAlign: 'center',
    width: 90,
    backgroundColor: '#FFFBEBCC', // Semi-transparent backing for text readability
    borderRadius: 4,
    overflow: 'hidden',
  },
  characterPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  characterPinEmoji: {
    fontSize: 18,
  },
  keyBadge: {
    backgroundColor: '#FEF08A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#EAB308',
  },
  keyBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#854D0E',
  },
  errorAlert: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 12,
    alignItems: 'center',
  },
  errorAlertText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '700',
    textAlign: 'center',
  },
  controls: {
    gap: 10,
    paddingBottom: 8,
  },
  goButton: {
    backgroundColor: '#D97706', 
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  goButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
  },
  editButton: {
    backgroundColor: '#0369A1',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
  },
  executingBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  executingBadgeText: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 18,
  },
  executingBadgeSuccess: {
    backgroundColor: '#D9F99D',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A3E635',
  },
  executingBadgeSuccessText: {
    color: '#4D7C0F',
    fontWeight: '900',
    fontSize: 18,
  },
  exitBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  exitBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  successOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF40',
    zIndex: 20,
    borderRadius: 20,
  },
  successBadge: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#F59E0B',
    zIndex: 21,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  successBadgeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  successBadgeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#92400E',
  },
  successBadgeSubtext: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
    textAlign: 'center',
  },
  starsContainer: {
    marginVertical: 16,
  },
  starsText: {
    fontSize: 36,
    letterSpacing: 12,
  },
  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginVertical: 16,
  },
  statCard: {
    width: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  statEmoji: {
    fontSize: 28,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardFooter: {
    width: '100%',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    gap: 16,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400E',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#B45309',
  },
});
