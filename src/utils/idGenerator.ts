let counter = 0;

export const generateElementId = (prefix = 'bpmn'): string => {
  counter += 1;
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${counter.toString(36)}`;
};

export const resetIdGenerator = (): void => {
  counter = 0;
};
