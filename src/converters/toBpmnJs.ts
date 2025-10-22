import { BpmnDiagram } from '../types/bpmn';

export interface BpmnJsElement {
  id: string;
  type: string;
  businessObject: Record<string, unknown>;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BpmnJsEdge {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  waypoints?: Array<{ x: number; y: number }>;
  businessObject: Record<string, unknown>;
}

export interface BpmnJsResult {
  elements: BpmnJsElement[];
  edges: BpmnJsEdge[];
}

export const convertToBpmnJs = (diagram: BpmnDiagram): BpmnJsResult => {
  const elements = diagram.nodes.map((node) => ({
    id: node.id,
    type: `bpmn:${node.type}`,
    businessObject: {
      id: node.id,
      name: node.name,
      documentation: node.documentation,
      properties: node.properties,
    },
    x: node.position.x,
    y: node.position.y,
    width: node.size.width,
    height: node.size.height,
  }));

  const pools = (diagram.pools ?? []).map((pool) => ({
    id: pool.id,
    type: 'bpmn:Participant',
    businessObject: {
      id: pool.id,
      name: pool.name,
      lanes: pool.lanes?.map((lane) => lane.id),
      properties: pool.properties,
    },
    x: pool.position.x,
    y: pool.position.y,
    width: pool.size.width,
    height: pool.size.height,
  }));

  const lanes = (diagram.pools ?? []).flatMap((pool) =>
    (pool.lanes ?? []).map((lane) => ({
      id: lane.id,
      type: 'bpmn:Lane',
      businessObject: {
        id: lane.id,
        name: lane.name,
        properties: lane.properties,
      },
      x: lane.position.x,
      y: lane.position.y,
      width: lane.size.width,
      height: lane.size.height,
    }))
  );

  const artifacts = (diagram.artifacts ?? []).map((artifact) => ({
    id: artifact.id,
    type: `bpmn:${artifact.type}`,
    businessObject: {
      id: artifact.id,
      name: artifact.name,
      text: artifact.text,
      state: artifact.state,
      properties: artifact.properties,
    },
    x: artifact.position.x,
    y: artifact.position.y,
    width: artifact.size.width,
    height: artifact.size.height,
  }));

  const edges = diagram.edges.map((edge) => ({
    id: edge.id,
    type: `bpmn:${edge.type}`,
    sourceId: edge.source,
    targetId: edge.target,
    waypoints: edge.waypoints,
    businessObject: {
      id: edge.id,
      name: edge.name,
      properties: edge.properties,
    },
  }));

  const associations = (diagram.associations ?? []).map((association) => ({
    id: association.id,
    type: 'bpmn:Association',
    sourceId: association.source,
    targetId: association.target,
    businessObject: {
      id: association.id,
      direction: association.direction,
    },
  }));

  return {
    elements: [...pools, ...lanes, ...elements, ...artifacts],
    edges: [...edges, ...associations],
  };
};
