export const DEFAULT_SIZES = {
  startEvent: { width: 36, height: 36 },
  endEvent: { width: 36, height: 36 },
  intermediateEvent: { width: 36, height: 36 },
  task: { width: 120, height: 80 },
  gateway: { width: 50, height: 50 },
  subprocess: { width: 200, height: 150 },
  pool: { width: 1000, height: 400 },
  lane: { width: 1000, height: 200 },
  dataObject: { width: 40, height: 50 },
  annotation: { width: 150, height: 60 },
} as const;

export const DEFAULT_STYLES = {
  node: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    strokeWidth: 2,
  },
  edge: {
    strokeColor: '#000000',
    strokeWidth: 1.5,
  },
  pool: {
    borderColor: '#000000',
    backgroundColor: '#F5F5F5',
    strokeWidth: 2,
  },
  lane: {
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    strokeWidth: 1,
  },
} as const;
