import { Edge, Node, Position as ReactFlowPosition } from 'reactflow';
import { BpmnDiagram, BpmnEdge, BpmnNode } from '../types/bpmn';
import { NodeType } from '../types/enums';

interface ReactFlowResult {
  nodes: Node[];
  edges: Edge[];
}

const toReactFlowNode = (node: BpmnNode): Node => ({
  id: node.id,
  type: node.type,
  position: node.position as ReactFlowPosition,
  data: {
    label: node.name,
    subType: node.subType,
    style: node.style,
    properties: node.properties,
  },
  style: node.style,
});

const toReactFlowEdge = (edge: BpmnEdge): Edge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  type: edge.type,
  label: edge.name,
  data: {
    waypoints: edge.waypoints,
    properties: edge.properties,
  },
  style: edge.style,
});

const sortNodesForDisplay = (nodes: Node[]): Node[] => {
  return [...nodes].sort((a, b) => {
    const typeWeight = (nodeType: string): number => {
      switch (nodeType) {
        case NodeType.START_EVENT:
          return 0;
        case NodeType.TASK:
          return 1;
        case NodeType.GATEWAY:
          return 2;
        case NodeType.END_EVENT:
          return 3;
        default:
          return 4;
      }
    };

    const typeComparison = typeWeight(String(a.type ?? '')) - typeWeight(String(b.type ?? ''));
    if (typeComparison !== 0) {
      return typeComparison;
    }

    return a.position.x - b.position.x;
  });
};

export const convertToReactFlow = (diagram: BpmnDiagram): ReactFlowResult => {
  const nodes = diagram.nodes.map(toReactFlowNode);
  const edges = diagram.edges.map(toReactFlowEdge);

  return {
    nodes: sortNodesForDisplay(nodes),
    edges,
  };
};
