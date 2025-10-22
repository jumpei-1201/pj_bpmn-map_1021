import { BpmnDiagram } from '../types/bpmn';
import { EdgeType } from '../types/enums';

const xmlEscape = (value: string | undefined): string => {
  if (!value) {
    return '';
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const serializeNode = (node: BpmnDiagram['nodes'][number]): string => {
  const attributes = [`id="${xmlEscape(node.id)}"`, `name="${xmlEscape(node.name)}"`]
    .filter(Boolean)
    .join(' ');
  return `<bpmn:${node.type} ${attributes} />`;
};

const serializeEdge = (edge: BpmnDiagram['edges'][number]): string => {
  const edgeTag = edge.type === EdgeType.SEQUENCE_FLOW ? 'sequenceFlow' : edge.type;
  const attributes = [
    `id="${xmlEscape(edge.id)}"`,
    `sourceRef="${xmlEscape(edge.source)}"`,
    `targetRef="${xmlEscape(edge.target)}"`,
    edge.name ? `name="${xmlEscape(edge.name)}"` : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  return `<bpmn:${edgeTag} ${attributes} />`;
};

export const convertToBpmnXml = (diagram: BpmnDiagram): string => {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  const definitionsOpen = `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="${xmlEscape(
    diagram.diagram.id
  )}">`;
  const processOpen = `<bpmn:process id="${xmlEscape(diagram.diagram.id)}" name="${xmlEscape(
    diagram.diagram.name
  )}">`;
  const nodesXml = diagram.nodes.map(serializeNode).join('\n    ');
  const edgesXml = diagram.edges.map(serializeEdge).join('\n    ');
  const processClose = '</bpmn:process>';
  const definitionsClose = '</bpmn:definitions>';

  return [
    header,
    definitionsOpen,
    `  ${processOpen}`,
    nodesXml ? `    ${nodesXml}` : '',
    edgesXml ? `    ${edgesXml}` : '',
    `  ${processClose}`,
    definitionsClose,
  ]
    .filter(Boolean)
    .join('\n');
};
