// TODO: replace with live data when attendance tracking is implemented

export type AssistanceMetricValue = {
  current: number;
  total: number;
};

export type AdminAssistance = {
  childCare: AssistanceMetricValue;
  workshops: AssistanceMetricValue;
};

export const adminAssistance: AdminAssistance = {
  childCare: { current: 50, total: 100 },
  workshops: { current: 30, total: 100 },
};
