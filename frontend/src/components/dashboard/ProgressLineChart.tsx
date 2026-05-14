import { Platform } from 'react-native';
import type { ProgressPoint } from '../../types/dashboard.types';

type ProgressLineChartProps = {
  data: ProgressPoint[];
};

const WebChart =
  Platform.OS === 'web'
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ? require('./ProgressLineChart.web').ProgressLineChart
    : null;
const NativeChart =
  Platform.OS !== 'web'
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ? require('./ProgressLineChart.native').ProgressLineChart
    : null;

export const ProgressLineChart = ({ data }: ProgressLineChartProps) => {
  if (Platform.OS === 'web' && WebChart) {
    return <WebChart data={data} />;
  }
  if (NativeChart) {
    return <NativeChart data={data} />;
  }
  return null;
};

