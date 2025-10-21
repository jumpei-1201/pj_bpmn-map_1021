import { EdgeType, EventSubType, GatewayDirection, GatewaySubType, NodeType, TaskSubType } from './enums';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface StyleProperties {
  borderColor?: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
}

export type Record = {
  [key: string]: unknown;
};

export interface Metadata {
  created?: string;
  modified?: string;
  author?: string;
  version?: string;
  description?: string;
  [key: string]: unknown;
}

export interface BaseElement {
  id: string;
  name?: string;
  position: Position;
  size: Size;
  style?: StyleProperties;
  properties?: Record;
}

export interface Lane extends BaseElement {
  parentId?: string;
}

export interface Pool extends BaseElement {
  lanes?: Lane[];
  isCollapsed?: boolean;
}

export interface BpmnNode extends BaseElement {
  type: NodeType;
  subType?: string;
  parentId?: string;
  documentation?: string;
}

export interface StartEventNode extends BpmnNode {
  type: NodeType.START_EVENT;
  subType: EventSubType;
}

export interface EndEventNode extends BpmnNode {
  type: NodeType.END_EVENT;
  subType: EventSubType;
}

export interface IntermediateEventNode extends BpmnNode {
  type: NodeType.INTERMEDIATE_EVENT;
  subType: EventSubType;
}

export interface TaskNode extends BpmnNode {
  type: NodeType.TASK;
  subType: TaskSubType;
  properties?: {
    assignee?: string;
    candidateGroups?: string[];
    formKey?: string;
    dueDate?: string;
    priority?: number;
    [key: string]: unknown;
  };
}

export interface GatewayNode extends BpmnNode {
  type: NodeType.GATEWAY;
  subType: GatewaySubType;
  properties?: {
    gatewayDirection?: GatewayDirection;
    defaultFlow?: string;
    [key: string]: unknown;
  };
}

export interface SubprocessNode extends BpmnNode {
  type: NodeType.SUBPROCESS;
  isExpanded?: boolean;
  childNodes?: BpmnNode[];
  childEdges?: BpmnEdge[];
}

export interface Waypoint extends Position {}

export interface BpmnEdge {
  id: string;
  type: EdgeType;
  source: string;
  target: string;
  name?: string;
  waypoints?: Waypoint[];
  style?: StyleProperties;
  properties?: {
    conditionExpression?: string;
    isDefault?: boolean;
    [key: string]: unknown;
  };
}

export interface Artifact extends BaseElement {
  type: 'dataObject' | 'annotation' | 'group';
  text?: string;
  state?: string;
}

export interface Association {
  id: string;
  type: 'association';
  source: string;
  target: string;
  direction?: 'none' | 'input' | 'output' | 'bidirectional';
}

export interface BpmnDiagram {
  diagram: {
    id: string;
    name: string;
    version?: string;
    metadata?: Metadata;
  };
  pools?: Pool[];
  nodes: BpmnNode[];
  edges: BpmnEdge[];
  artifacts?: Artifact[];
  associations?: Association[];
}

export type AnyNode =
  | StartEventNode
  | EndEventNode
  | IntermediateEventNode
  | TaskNode
  | GatewayNode
  | SubprocessNode
  | BpmnNode;

export type BpmnElement = BpmnNode | BpmnEdge | Pool | Lane | Artifact | Association;
