type AssistanceMetricProps = {
  label: string;
  current: number;
  total: number;
};

export function AssistanceMetric({ label, current, total }: AssistanceMetricProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-small text-default-500">{label}</span>
      <span className="text-2xl font-bold">
        {current}/{total}
      </span>
    </div>
  );
}
