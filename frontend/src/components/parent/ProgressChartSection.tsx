import React from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { DashboardCard } from './DashboardCard';
import type { ProgressPoint } from '../../types/dashboard.types';

interface ProgressChartSectionProps {
  data: ProgressPoint[];
  loading: boolean;
}

export const ProgressChartSection = ({ data, loading }: ProgressChartSectionProps) => {
  const { width: windowWidth } = useWindowDimensions();
  
  // Calculate chart width based on responsiveness
  const chartWidth = Math.min(windowWidth, 900) - 80; // Accounting for card padding

  const chartData = {
    labels: data.slice(-5).map(p => p.date.split('-').slice(1).reverse().join('/')),
    datasets: [
      {
        data: data.slice(-5).map(p => p.memory),
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 3,
      }
    ],
    legend: ['Genel Gelişim Skoru']
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffffff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#F3F4F6',
    }
  };

  return (
    <DashboardCard 
      title="Gelişim Trendi" 
      subtitle="Son 5 oturumdaki bilişsel performans değişimi."
    >
      <View style={styles.chartContainer}>
        {data.length > 0 ? (
          <LineChart
            data={chartData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withShadow={false}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Veri toplanıyor...</Text>
          </View>
        )}
      </View>
    </DashboardCard>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  chart: {
    borderRadius: 16,
    paddingRight: 40,
  },
  empty: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
});
