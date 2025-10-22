import { useCallback, useEffect, useMemo, useState } from 'react';
import { DiagramModel } from '../models/Diagram';
import { BpmnDiagram, BpmnEdge, BpmnNode } from '../types/bpmn';
import { BpmnValidator, ValidationError } from '../validators/bpmnValidator';

export interface UseBpmnDiagramResult {
  diagram: BpmnDiagram;
  model: DiagramModel;
  errors: ValidationError[];
  isValid: boolean;
  updateNode: (nodeId: string, updates: Partial<BpmnNode>) => void;
  updateEdge: (edgeId: string, updates: Partial<BpmnEdge>) => void;
  addNode: (node: BpmnNode) => void;
  addEdge: (edge: BpmnEdge) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  validate: () => ValidationError[];
}

export const useBpmnDiagram = (initialDiagram: BpmnDiagram): UseBpmnDiagramResult => {
  const [diagram, setDiagram] = useState(initialDiagram);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    setDiagram((current) => (current === initialDiagram ? current : initialDiagram));
  }, [initialDiagram]);

  const model = useMemo(() => new DiagramModel(diagram), [diagram]);

  const validate = useCallback(() => {
    const validationErrors = BpmnValidator.validate(diagram);
    setErrors(validationErrors);
    return validationErrors;
  }, [diagram]);

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<BpmnNode>) => {
      setDiagram((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
      }));
    },
    []
  );

  const updateEdge = useCallback(
    (edgeId: string, updates: Partial<BpmnEdge>) => {
      setDiagram((prev) => ({
        ...prev,
        edges: prev.edges.map((edge) => (edge.id === edgeId ? { ...edge, ...updates } : edge)),
      }));
    },
    []
  );

  const addNode = useCallback((node: BpmnNode) => {
    setDiagram((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }));
  }, []);

  const addEdge = useCallback((edge: BpmnEdge) => {
    setDiagram((prev) => ({
      ...prev,
      edges: [...prev.edges, edge],
    }));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => node.id !== nodeId),
      edges: prev.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    }));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setDiagram((prev) => ({
      ...prev,
      edges: prev.edges.filter((edge) => edge.id !== edgeId),
    }));
  }, []);

  const isValid = errors.length === 0;

  return {
    diagram,
    model,
    errors,
    isValid,
    updateNode,
    updateEdge,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    validate,
  };
};
