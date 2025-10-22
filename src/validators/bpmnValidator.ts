import { BpmnDiagram, BpmnEdge, BpmnNode } from '../types/bpmn';
import { EdgeType, NodeType } from '../types/enums';

export interface ValidationError {
  message: string;
  field?: string;
  elementId?: string;
}

const REQUIRED_NODE_FIELDS: Array<keyof BpmnNode> = ['id', 'type', 'position', 'size'];

const validateRequiredFields = (node: BpmnNode): ValidationError[] => {
  return REQUIRED_NODE_FIELDS.flatMap((field) => {
    if ((node as BpmnNode)[field] === undefined) {
      return [{
        message: 'Required field is missing',
        field: field.toString(),
        elementId: node.id,
      }];
    }
    return [];
  });
};

const validateUniqueIds = (diagram: BpmnDiagram): ValidationError[] => {
  const seen = new Set<string>();
  const errors: ValidationError[] = [];

  const registerId = (id: string, elementId: string, type: string) => {
    if (seen.has(id)) {
      errors.push({
        message: `${type} id must be unique`,
        field: 'id',
        elementId,
      });
    } else {
      seen.add(id);
    }
  };

  diagram.nodes.forEach((node) => registerId(node.id, node.id, 'Node'));
  diagram.edges.forEach((edge) => registerId(edge.id, edge.id, 'Edge'));
  diagram.pools?.forEach((pool) => {
    registerId(pool.id, pool.id, 'Pool');
    pool.lanes?.forEach((lane) => registerId(lane.id, lane.id, 'Lane'));
  });
  diagram.artifacts?.forEach((artifact) => registerId(artifact.id, artifact.id, 'Artifact'));
  diagram.associations?.forEach((association) => registerId(association.id, association.id, 'Association'));

  return errors;
};

const validateEdgeEndpoints = (diagram: BpmnDiagram): ValidationError[] => {
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));
  const errors: ValidationError[] = [];

  diagram.edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        message: 'Edge source does not reference a valid node',
        field: 'source',
        elementId: edge.id,
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        message: 'Edge target does not reference a valid node',
        field: 'target',
        elementId: edge.id,
      });
    }
  });

  return errors;
};

const validateStartAndEndEvents = (diagram: BpmnDiagram): ValidationError[] => {
  const startEvents = diagram.nodes.filter((node) => node.type === NodeType.START_EVENT);
  const endEvents = diagram.nodes.filter((node) => node.type === NodeType.END_EVENT);

  const errors: ValidationError[] = [];

  if (startEvents.length === 0) {
    errors.push({
      message: 'Diagram must contain at least one start event',
      field: 'nodes',
    });
  }

  if (endEvents.length === 0) {
    errors.push({
      message: 'Diagram must contain at least one end event',
      field: 'nodes',
    });
  }

  return errors;
};

const validateSequenceFlowConnections = (diagram: BpmnDiagram): ValidationError[] => {
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));
  const errors: ValidationError[] = [];

  diagram.edges
    .filter((edge) => edge.type === EdgeType.SEQUENCE_FLOW)
    .forEach((edge) => {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        errors.push({
          message: 'Sequence flow must connect valid BPMN nodes',
          field: 'edges',
          elementId: edge.id,
        });
      }
    });

  return errors;
};

const validateNodePlacement = (diagram: BpmnDiagram): ValidationError[] => {
  const errors: ValidationError[] = [];

  diagram.nodes.forEach((node) => {
    if (node.position.x < 0 || node.position.y < 0) {
      errors.push({
        message: 'Node position must be non-negative',
        field: 'position',
        elementId: node.id,
      });
    }
    if (node.size.width <= 0 || node.size.height <= 0) {
      errors.push({
        message: 'Node size must be positive',
        field: 'size',
        elementId: node.id,
      });
    }
  });

  return errors;
};

export class BpmnValidator {
  static validate(diagram: BpmnDiagram): ValidationError[] {
    const errors: ValidationError[] = [];

    diagram.nodes.forEach((node) => {
      errors.push(...validateRequiredFields(node));
    });

    errors.push(...validateUniqueIds(diagram));
    errors.push(...validateEdgeEndpoints(diagram));
    errors.push(...validateStartAndEndEvents(diagram));
    errors.push(...validateSequenceFlowConnections(diagram));
    errors.push(...validateNodePlacement(diagram));

    return errors;
  }
}
