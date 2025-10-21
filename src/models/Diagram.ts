import { BpmnDiagram, BpmnEdge, BpmnNode } from '../types/bpmn';
import { EdgeModel } from './Edge';
import { NodeModel } from './Node';

export class DiagramModel {
  private readonly diagram: BpmnDiagram;

  constructor(diagram: BpmnDiagram) {
    this.diagram = diagram;
  }

  get data(): BpmnDiagram {
    return this.diagram;
  }

  get nodes(): NodeModel[] {
    return this.diagram.nodes.map((node) => new NodeModel(node));
  }

  get edges(): EdgeModel[] {
    return this.diagram.edges.map((edge) => new EdgeModel(edge));
  }

  updateNode(nodeId: string, updates: Partial<BpmnNode>): DiagramModel {
    const updatedNodes = this.diagram.nodes.map((node) =>
      node.id === nodeId ? { ...node, ...updates } : node
    );
    return new DiagramModel({
      ...this.diagram,
      nodes: updatedNodes,
    });
  }

  updateEdge(edgeId: string, updates: Partial<BpmnEdge>): DiagramModel {
    const updatedEdges = this.diagram.edges.map((edge) =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    );
    return new DiagramModel({
      ...this.diagram,
      edges: updatedEdges,
    });
  }

  addNode(node: BpmnNode): DiagramModel {
    return new DiagramModel({
      ...this.diagram,
      nodes: [...this.diagram.nodes, node],
    });
  }

  addEdge(edge: BpmnEdge): DiagramModel {
    return new DiagramModel({
      ...this.diagram,
      edges: [...this.diagram.edges, edge],
    });
  }

  removeNode(nodeId: string): DiagramModel {
    const filteredNodes = this.diagram.nodes.filter((node) => node.id !== nodeId);
    const filteredEdges = this.diagram.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    );
    return new DiagramModel({
      ...this.diagram,
      nodes: filteredNodes,
      edges: filteredEdges,
    });
  }

  removeEdge(edgeId: string): DiagramModel {
    const filteredEdges = this.diagram.edges.filter((edge) => edge.id !== edgeId);
    return new DiagramModel({
      ...this.diagram,
      edges: filteredEdges,
    });
  }
}
