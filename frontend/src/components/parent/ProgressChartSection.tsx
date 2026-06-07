import React, { useMemo } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { DashboardCard } from './DashboardCard';
import type { ProgressPoint } from '../../types/dashboard.types';

interface ProgressChartSectionProps {
  data: ProgressPoint[];
  loading: boolean;
}

const CHART_HEIGHT = 180;
const PADDING_H = 40;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;

function clamp(v: number) { return Math.max(0, Math.min(100, v)); }

export const ProgressChartSection = ({ data, loading }: ProgressChartSectionProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.min(windowWidth - 64, 700);
  const plotWidth = chartWidth - PADDING_H * 2;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const last5 = useMemo(() => data.slice(-5), [data]);

  // Overall skill score = weighted avg of memory(40%), attention(30%), logic(30%)
  const points = useMemo(() =>
    last5.map(p => ({
      date: p.date,
      memory: clamp(p.memory),
      attention: clamp(p.attention),
      logic: clamp(p.logic),
      overall: Math.round(clamp(p.memory) * 0.4 + clamp(p.attention) * 0.3 + clamp(p.logic) * 0.3),
    })),
    [last5]
  );

  const formatLabel = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '?';
    // If all points are on the same day → show HH:MM
    const allSameDay = points.every(p => p.date.split('T')[0] === points[0]?.date.split('T')[0]);
    if (allSameDay) {
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  // SVG coordinate helpers
  const toX = (i: number, total: number) => {
    if (total <= 1) return plotWidth / 2;
    return (i / (total - 1)) * plotWidth;
  };
  const toY = (val: number, min: number, max: number) => {
    const range = max - min || 1;
    return plotHeight - ((val - min) / range) * plotHeight;
  };

  const SERIES = [
    { key: 'memory' as const,    label: 'Hafıza',  color: '#6366F1' },
    { key: 'attention' as const, label: 'Dikkat',  color: '#10B981' },
    { key: 'logic' as const,     label: 'Mantık',  color: '#F59E0B' },
  ];

  const allValues = points.flatMap(p => [p.memory, p.attention, p.logic]);
  const dataMin = Math.max(0, Math.floor(Math.min(...allValues, 0) / 10) * 10);
  const dataMax = Math.min(100, Math.ceil(Math.max(...allValues, 10) / 10) * 10 + 5);

  // Build SVG polyline path
  const buildPath = (key: 'memory' | 'attention' | 'logic') => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, points.length).toFixed(1)} ${toY(p[key], dataMin, dataMax).toFixed(1)}`)
      .join(' ');
  };

  // Y-axis grid ticks
  const yTicks = [dataMin, Math.round((dataMin + dataMax) / 2), dataMax];

  if (loading) {
    return (
      <DashboardCard title="Gelişim Trendi" subtitle="Son oturumlardaki bilişsel performans.">
        <View style={styles.skeleton} />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Gelişim Trendi"
      subtitle="Son 5 oturumdaki hafıza, dikkat ve mantık performansı."
    >
      {points.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>Çocuğunuz oyun oynadıkça grafik burada oluşacak</Text>
        </View>
      ) : (
        <>
          {/* Legend */}
          <View style={styles.legend}>
            {SERIES.map(s => (
              <View key={s.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={styles.legendLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Chart area */}
          <View style={[styles.chartWrapper, { width: chartWidth, height: CHART_HEIGHT }]}>
            {/* Y-axis labels */}
            <View style={[styles.yAxis, { height: plotHeight, top: PADDING_TOP }]}>
              {yTicks.slice().reverse().map(tick => (
                <Text key={tick} style={styles.yLabel}>{tick}</Text>
              ))}
            </View>

            {/* SVG plot */}
            <View style={{ marginLeft: PADDING_H, width: plotWidth, height: CHART_HEIGHT }}>
              {/* Grid lines */}
              {yTicks.map((tick, ti) => (
                <View
                  key={tick}
                  style={[
                    styles.gridLine,
                    {
                      top: PADDING_TOP + toY(tick, dataMin, dataMax),
                      width: plotWidth,
                    }
                  ]}
                />
              ))}

              {/* Lines (rendered as overlapping Views — SVG not available in RN without library) */}
              {SERIES.map(s => (
                <LineRenderer
                  key={s.key}
                  points={points.map((p, i) => ({
                    x: toX(i, points.length),
                    y: PADDING_TOP + toY(p[s.key], dataMin, dataMax),
                  }))}
                  color={s.color}
                  plotWidth={plotWidth}
                />
              ))}

              {/* X-axis labels */}
              <View style={[styles.xAxis, { top: PADDING_TOP + plotHeight + 8, width: plotWidth }]}>
                {points.map((p, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.xLabel,
                      { left: toX(i, points.length) - 18, width: 36 },
                    ]}
                  >
                    {formatLabel(p.date)}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Summary stats */}
          <View style={styles.statsRow}>
            {SERIES.map(s => {
              const latest = points.at(-1)?.[s.key] ?? 0;
              const prev = points.at(-2)?.[s.key];
              const delta = prev !== undefined ? latest - prev : null;
              return (
                <View key={s.key} style={styles.statPill}>
                  <View style={[styles.statBar, { backgroundColor: s.color + '22' }]}>
                    <View style={[styles.statFill, { width: `${latest}%` as any, backgroundColor: s.color }]} />
                  </View>
                  <Text style={[styles.statName, { color: s.color }]}>{s.label}</Text>
                  <Text style={styles.statVal}>{latest.toFixed(0)}</Text>
                  {delta !== null && (
                    <Text style={[styles.statDelta, { color: delta >= 0 ? '#10B981' : '#EF4444' }]}>
                      {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}
    </DashboardCard>
  );
};

// Pure line renderer using overlapping absolutely-positioned Views
function LineRenderer({
  points,
  color,
  plotWidth,
}: {
  points: { x: number; y: number }[];
  color: string;
  plotWidth: number;
}) {
  if (points.length < 2) return null;
  const segments: React.ReactNode[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    segments.push(
      <View
        key={`seg-${i}`}
        style={{
          position: 'absolute',
          left: p1.x,
          top: p1.y - 1.5,
          width: length,
          height: 3,
          backgroundColor: color,
          borderRadius: 2,
          opacity: 0.85,
          transform: [{ rotate: `${angle}deg` }, { translateX: length / 2 - length / 2 }],
          transformOrigin: '0 50%',
        } as any}
      />
    );
  }

  // Dots
  const dots = points.map((p, i) => (
    <View
      key={`dot-${i}`}
      style={{
        position: 'absolute',
        left: p.x - 5,
        top: p.y - 5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
      }}
    />
  ));

  return <>{segments}{dots}</>;
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  chartWrapper: {
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    width: PADDING_H - 6,
    justifyContent: 'space-between',
  },
  yLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'right',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  xAxis: {
    position: 'absolute',
    flexDirection: 'row',
  },
  xLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statFill: {
    height: 4,
    borderRadius: 2,
  },
  statName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 22,
  },
  statDelta: {
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 18,
  },
  skeleton: {
    height: CHART_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
});
