import React from 'react';
import { BpmnViewer } from './components/BpmnViewer';
import { sampleDiagram } from './data/sampleDiagram';

export const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BpmnViewer diagram={sampleDiagram} enableAutoLayout />
    </div>
  );
};
