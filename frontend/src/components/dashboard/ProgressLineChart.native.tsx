import { Dimensions, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { ProgressPoint } from '../../types/dashboard.types';

type ProgressLineChartProps = {
  data: ProgressPoint[];
};

export const ProgressLineChart = ({ data }: ProgressLineChartProps) => {
  const width = Math.max(Dimensions.get('window').width - 70, 300);

  const labels = data.map((point, index) =>
    // Keep labels readable on smaller widths by showing every other label.
    index % 2 === 0
      ? new Date(point.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : ''
  );

  return (
    <View style={styles.container}>
      <LineChart
        width={width}
        height={230}
        data={{
          labels,
          datasets: [
            { data: data.map((item) => item.memory), color: () => '#2563EB', strokeWidth: 3 },
            { data: data.map((item) => item.attention), color: () => '#10B981', strokeWidth: 3 },
            { data: data.map((item) => item.logic), color: () => '#F59E0B', strokeWidth: 3 },
          ],
        }}
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          propsForDots: {
            r: '4',
            strokeWidth: '0',
          },
          propsForLabels: {
            fontSize: 12,
            fontWeight: '600',
          },
          propsForBackgroundLines: {
            strokeDasharray: '4',
            stroke: '#F3F4F6',
          },
        }}
        withVerticalLines={false}
        withShadow={false}
        withInnerLines
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 2,
    marginLeft: -10,
  },
  chart: {
    borderRadius: 12,
  },
});

