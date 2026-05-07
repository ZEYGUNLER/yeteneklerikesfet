import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StyleSheet, View } from 'react-native';
import type { ProgressPoint } from '../../types/dashboard.types';

type ProgressLineChartProps = {
  data: ProgressPoint[];
};

export const ProgressLineChart = ({ data }: ProgressLineChartProps) => {
  return (
    <View style={styles.container}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            }
          />
          <YAxis domain={[0, 100]} />
          <Tooltip
            labelFormatter={(value) =>
              new Date(String(value)).toLocaleDateString()
            }
          />
          <Line type="monotone" dataKey="memory" stroke="#2563EB" dot={false} />
          <Line type="monotone" dataKey="attention" stroke="#10B981" dot={false} />
          <Line type="monotone" dataKey="logic" stroke="#F59E0B" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 260,
  },
});

