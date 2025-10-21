import { BpmnDiagram, BpmnNode, Position } from '../types/bpmn';
import { NodeType } from '../types/enums';

interface LayoutOptions {
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

const DEFAULT_HORIZONTAL_SPACING = 160;
const DEFAULT_VERTICAL_SPACING = 120;

const sortNodes = (nodes: BpmnNode[]): BpmnNode[] => {
  return [...nodes].sort((a, b) => a.position.x - b.position.x);
};

const getRowIndex = (node: BpmnNode, options: LayoutOptions): number => {
  const { verticalSpacing = DEFAULT_VERTICAL_SPACING } = options;
  return Math.round(node.position.y / verticalSpacing);
};

const alignNodesInRow = (
  nodes: BpmnNode[],
  options: LayoutOptions,
  baseY: number
): BpmnNode[] => {
  const { horizontalSpacing = DEFAULT_HORIZONTAL_SPACING } = options;
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: index * horizontalSpacing,
      y: baseY,
    },
  }));
};

const emphasizeStartAndEnd = (node: BpmnNode): BpmnNode => {
  if (node.type === NodeType.START_EVENT) {
    return {
      ...node,
      position: {
        x: node.position.x,
        y: node.position.y - 20,
      },
    };
  }

  if (node.type === NodeType.END_EVENT) {
    return {
      ...node,
      position: {
        x: node.position.x,
        y: node.position.y + 20,
      },
    };
  }

  return node;
};

export const autoLayoutDiagram = (
  diagram: BpmnDiagram,
  options: LayoutOptions = {}
): BpmnDiagram => {
  const groupedByRow = new Map<number, BpmnNode[]>();
  const sortedNodes = sortNodes(diagram.nodes);

  sortedNodes.forEach((node) => {
    const rowIndex = getRowIndex(node, options);
    const nodesInRow = groupedByRow.get(rowIndex) ?? [];
    nodesInRow.push(node);
    groupedByRow.set(rowIndex, nodesInRow);
  });

  const laidOutNodes: BpmnNode[] = [];

  Array.from(groupedByRow.entries())
    .sort(([rowA], [rowB]) => rowA - rowB)
    .forEach(([rowIndex, nodesInRow]) => {
      const baseY = rowIndex * (options.verticalSpacing ?? DEFAULT_VERTICAL_SPACING);
      const alignedNodes = alignNodesInRow(nodesInRow, options, baseY);
      alignedNodes.forEach((node) => {
        laidOutNodes.push(emphasizeStartAndEnd(node));
      });
    });

  const updatedNodes = diagram.nodes.map((node) => {
    const laidOutNode = laidOutNodes.find((candidate) => candidate.id === node.id);
    return laidOutNode ?? node;
  });

  return {
    ...diagram,
    nodes: updatedNodes,
  };
};

export const computeCenterPosition = (
  positions: Position[]
): Position => {
  if (positions.length === 0) {
    return { x: 0, y: 0 };
  }

  const total = positions.reduce(
    (acc, position) => ({
      x: acc.x + position.x,
      y: acc.y + position.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / positions.length,
    y: total.y / positions.length,
  };
};
