import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StyleSheet, View } from 'react-native';
import type { ProgressPoint } from '../../types/dashboard.types';

type ProgressLineChartProps = {
  data: ProgressPoint[];
};

export const ProgressLineChart = ({ data }: ProgressLineChartProps) => {
  return (
    <View style={styles.container}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 12, right: 14, left: -10, bottom: 2 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            }
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            width={36}
            tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: '#E5E7EB',
              boxShadow: '0 10px 25px rgba(17,24,39,0.05)',
              padding: '12px 16px',
            }}
            labelStyle={{ color: '#111827', fontWeight: 700, marginBottom: 8 }}
            labelFormatter={(value) =>
              new Date(String(value)).toLocaleDateString()
            }
          />
          <Line type="monotone" dataKey="memory" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="attention" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="logic" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
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

