export enum NodeType {
  START_EVENT = 'startEvent',
  END_EVENT = 'endEvent',
  INTERMEDIATE_EVENT = 'intermediateEvent',
  TASK = 'task',
  GATEWAY = 'gateway',
  SUBPROCESS = 'subprocess',
}

export enum EventSubType {
  NONE = 'none',
  MESSAGE = 'message',
  TIMER = 'timer',
  ERROR = 'error',
  CONDITIONAL = 'conditional',
  SIGNAL = 'signal',
}

export enum TaskSubType {
  USER_TASK = 'userTask',
  SERVICE_TASK = 'serviceTask',
  SCRIPT_TASK = 'scriptTask',
  MANUAL_TASK = 'manualTask',
  BUSINESS_RULE_TASK = 'businessRuleTask',
  SEND_TASK = 'sendTask',
  RECEIVE_TASK = 'receiveTask',
}

export enum GatewaySubType {
  EXCLUSIVE = 'exclusive',
  PARALLEL = 'parallel',
  INCLUSIVE = 'inclusive',
  EVENT_BASED = 'eventBased',
  COMPLEX = 'complex',
}

export enum EdgeType {
  SEQUENCE_FLOW = 'sequenceFlow',
  MESSAGE_FLOW = 'messageFlow',
  ASSOCIATION = 'association',
}

export enum GatewayDirection {
  DIVERGING = 'diverging',
  CONVERGING = 'converging',
  MIXED = 'mixed',
}
