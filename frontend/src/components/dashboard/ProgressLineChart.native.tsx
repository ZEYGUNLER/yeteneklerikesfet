import { Dimensions, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { ProgressPoint } from '../../types/dashboard.types';

type ProgressLineChartProps = {
  data: ProgressPoint[];
};

export const ProgressLineChart = ({ data }: ProgressLineChartProps) => {
  const width = Math.max(Dimensions.get('window').width - 64, 300);

  const labels = data.map((point) =>
    new Date(point.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  );

  return (
    <View style={styles.container}>
      <LineChart
        width={width}
        height={220}
        data={{
          labels,
          datasets: [
            { data: data.map((item) => item.memory), color: () => '#2563EB' },
            { data: data.map((item) => item.attention), color: () => '#10B981' },
            { data: data.map((item) => item.logic), color: () => '#F59E0B' },
          ],
          legend: ['Memory', 'Attention', 'Logic'],
        }}
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          propsForDots: {
            r: '2',
          },
        }}
        bezier
        withShadow={false}
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
});

