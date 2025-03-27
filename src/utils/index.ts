import { Selection } from "@heroui/react";

export const getGroupContextValue = (groupContext: Selection | undefined) => {
  const selectedValue = groupContext as Set<string | number>;
  return selectedValue ? selectedValue.values().next().value : "";
};
