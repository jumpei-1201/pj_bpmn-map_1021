import React, { useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { convertToReactFlow } from '../converters/toReactFlow';
import { useBpmnDiagram } from '../hooks/useBpmnDiagram';
import { autoLayoutDiagram } from '../utils/layoutEngine';
import { BpmnDiagram } from '../types/bpmn';

export interface BpmnViewerProps {
  diagram: BpmnDiagram;
  enableAutoLayout?: boolean;
}

export const BpmnViewer: React.FC<BpmnViewerProps> = ({ diagram, enableAutoLayout }) => {
  const normalizedDiagram = useMemo(
    () => (enableAutoLayout ? autoLayoutDiagram(diagram) : diagram),
    [diagram, enableAutoLayout]
  );

  const { errors, isValid, validate } = useBpmnDiagram(normalizedDiagram);
  const { nodes, edges } = useMemo(() => convertToReactFlow(normalizedDiagram), [normalizedDiagram]);

  useEffect(() => {
    validate();
  }, [validate]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isValid && (
        <div style={{ color: '#B00020', padding: '8px 12px', backgroundColor: '#FDECEA' }}>
          <strong>Validation Errors:</strong>
          <ul>
            {errors.map((error, index) => (
              <li key={`${error.elementId ?? 'diagram'}-${index}`}>
                {error.message}
                {error.elementId ? ` (${error.elementId})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ReactFlow style={{ flex: 1 }} nodes={nodes} edges={edges} fitView>
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};
