import { track } from '../analytics';

export const handleInsights = async (initialData: any): Promise<(data: any) => void> => {
  track('Session Insights', { props: toStringProps(initialData) });

  let performanceReported = false;
  return (data) => {
    if (performanceReported) {
      return;
    }
    performanceReported = true;
    track('Performance Insights', { props: toStringProps(data) });
  };
};

const toStringProps = (data: Record<string, unknown>): Record<string, string> =>
  Object.entries(data).reduce<Record<string, string>>((props, [key, value]) => {
    if (value !== undefined && value !== null) {
      props[key] = String(value);
    }
    return props;
  }, {});
