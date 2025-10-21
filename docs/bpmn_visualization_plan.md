コンテンツはユーザーが作成したもので、未検証です。
1
# BPMN自動可視化システム 設計ドキュメント

## 目次
1. [概要](#概要)
2. [システムアーキテクチャ](#システムアーキテクチャ)
3. [データ構造定義](#データ構造定義)
4. [実装ガイド](#実装ガイド)
5. [APIリファレンス](#apiリファレンス)
6. [サンプルコード](#サンプルコード)

---

## 概要

### システムの目的
BPMN（Business Process Model and Notation）図をJSON形式のデータから自動生成し、可視化するシステム。React FlowまたはBPMN-jsを使用してインタラクティブなプロセス図を表示する。

### 主な機能
- BPMN要素のJSON形式での定義
- React Flow / BPMN-jsへの自動変換
- 自動レイアウト機能（オプション）
- インタラクティブな編集機能
- BPMN 2.0 XML形式へのエクスポート

---

## システムアーキテクチャ

### 全体構成

```
┌─────────────────┐
│   Data Layer    │  ← BPMNデータ（JSON）
└────────┬────────┘
         │
┌────────▼────────┐
│ Converter Layer │  ← データ変換・バリデーション
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│React  │ │BPMN-js  │  ← 描画ライブラリ
│Flow   │ │         │
└───────┘ └─────────┘
```

### ディレクトリ構成

```
src/
├── types/              # TypeScript型定義
│   ├── bpmn.ts        # BPMNデータ型
│   └── enums.ts       # 列挙型定義
├── models/            # データモデル
│   ├── Diagram.ts
│   ├── Node.ts
│   └── Edge.ts
├── converters/        # 変換ロジック
│   ├── toReactFlow.ts
│   ├── toBpmnJs.ts
│   └── toBpmnXml.ts
├── validators/        # バリデーション
│   └── bpmnValidator.ts
├── utils/             # ユーティリティ
│   ├── layoutEngine.ts
│   └── idGenerator.ts
├── components/        # Reactコンポーネント
│   ├── BpmnViewer.tsx
│   └── nodes/        # カスタムノード
└── hooks/            # カスタムフック
    └── useBpmnDiagram.ts
```

---

## データ構造定義

### TypeScript型定義

#### 基本型

```typescript
// types/enums.ts

export enum NodeType {
  START_EVENT = 'startEvent',
  END_EVENT = 'endEvent',
  INTERMEDIATE_EVENT = 'intermediateEvent',
  TASK = 'task',
  GATEWAY = 'gateway',
  SUBPROCESS = 'subprocess'
}

export enum EventSubType {
  NONE = 'none',
  MESSAGE = 'message',
  TIMER = 'timer',
  ERROR = 'error',
  CONDITIONAL = 'conditional',
  SIGNAL = 'signal'
}

export enum TaskSubType {
  USER_TASK = 'userTask',
  SERVICE_TASK = 'serviceTask',
  SCRIPT_TASK = 'scriptTask',
  MANUAL_TASK = 'manualTask',
  BUSINESS_RULE_TASK = 'businessRuleTask',
  SEND_TASK = 'sendTask',
  RECEIVE_TASK = 'receiveTask'
}

export enum GatewaySubType {
  EXCLUSIVE = 'exclusive',      // XOR
  PARALLEL = 'parallel',        // AND
  INCLUSIVE = 'inclusive',      // OR
  EVENT_BASED = 'eventBased',
  COMPLEX = 'complex'
}

export enum EdgeType {
  SEQUENCE_FLOW = 'sequenceFlow',
  MESSAGE_FLOW = 'messageFlow',
  ASSOCIATION = 'association'
}

export enum GatewayDirection {
  DIVERGING = 'diverging',  // 分岐
  CONVERGING = 'converging', // 合流
  MIXED = 'mixed'           // 混合
}
```

#### コア型定義

```typescript
// types/bpmn.ts

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

export interface Metadata {
  created?: string;          // ISO 8601形式
  modified?: string;
  author?: string;
  version?: string;
  description?: string;
  [key: string]: any;       // 拡張用
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
  parentId?: string;        // 親レーンのID（入れ子の場合）
}

export interface Pool extends BaseElement {
  lanes?: Lane[];
  isCollapsed?: boolean;
}

export interface BpmnNode extends BaseElement {
  type: NodeType;
  subType?: string;         // EventSubType | TaskSubType | GatewaySubType
  parentId?: string;        // 所属するレーン/プールのID
  documentation?: string;
}

// 各ノードタイプ専用のインターフェース

export interface StartEventNode extends BpmnNode {
  type: NodeType.START_EVENT;
  subType: EventSubType;
}

export interface EndEventNode extends BpmnNode {
  type: NodeType.END_EVENT;
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
    [key: string]: any;
  };
}

export interface GatewayNode extends BpmnNode {
  type: NodeType.GATEWAY;
  subType: GatewaySubType;
  properties?: {
    gatewayDirection?: GatewayDirection;
    defaultFlow?: string;     // デフォルトフローのエッジID
    [key: string]: any;
  };
}

export interface SubprocessNode extends BpmnNode {
  type: NodeType.SUBPROCESS;
  isExpanded?: boolean;
  childNodes?: BpmnNode[];
  childEdges?: BpmnEdge[];
}

export interface Waypoint extends Position {
  // エッジの屈曲点
}

export interface BpmnEdge {
  id: string;
  type: EdgeType;
  source: string;           // ソースノードのID
  target: string;           // ターゲットノードのID
  name?: string;            // エッジラベル
  waypoints?: Waypoint[];   // 経路の座標リスト
  style?: StyleProperties;
  properties?: {
    conditionExpression?: string;  // 条件式（XPath, JavaScript等）
    isDefault?: boolean;           // デフォルトフローかどうか
    [key: string]: any;
  };
}

export interface Artifact extends BaseElement {
  type: 'dataObject' | 'annotation' | 'group';
  text?: string;            // 注釈の場合
  state?: string;           // データオブジェクトの状態
}

export interface Association {
  id: string;
  type: 'association';
  source: string;           // アーティファクトまたはノードのID
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
```

### デフォルトサイズ定義

```typescript
// utils/constants.ts

export const DEFAULT_SIZES = {
  startEvent: { width: 36, height: 36 },
  endEvent: { width: 36, height: 36 },
  intermediateEvent: { width: 36, height: 36 },
  task: { width: 120, height: 80 },
  gateway: { width: 50, height: 50 },
  subprocess: { width: 200, height: 150 },
  pool: { width: 1000, height: 400 },
  lane: { width: 1000, height: 200 },
  dataObject: { width: 40, height: 50 },
  annotation: { width: 150, height: 60 }
} as const;

export const DEFAULT_STYLES = {
  node: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    strokeWidth: 2
  },
  edge: {
    strokeColor: '#000000',
    strokeWidth: 1.5
  },
  pool: {
    borderColor: '#000000',
    backgroundColor: '#F5F5F5',
    strokeWidth: 2
  },
  lane: {
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    strokeWidth: 1
  }
}
```

### 4. カスタムフック

```typescript
// hooks/useBpmnDiagram.ts

import { useState, useCallback, useMemo } from 'react';
import { BpmnDiagram, BpmnNode, BpmnEdge } from '../types/bpmn';
import { DiagramModel } from '../models/Diagram';
import { BpmnValidator, ValidationError } from '../validators/bpmnValidator';

export interface UseBpmnDiagramResult {
  diagram: BpmnDiagram;
  model: DiagramModel;
  errors: ValidationError[];
  isValid: boolean;
  updateNode: (nodeId: string, updates: Partial) => void;
  updateEdge: (edgeId: string, updates: Partial) => void;
  addNode: (node: BpmnNode) => void;
  addEdge: (edge: BpmnEdge) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  validate: () => ValidationError[];
}

export const useBpmnDiagram = (
  initialDiagram: BpmnDiagram
): UseBpmnDiagramResult => {
  const [diagram, setDiagram] = useState(initialDiagram);
  const [errors, setErrors] = useState([]);

  const model = useMemo(() => new DiagramModel(diagram), [diagram]);

  const validate = useCallback(() => {
    const validationErrors = BpmnValidator.validate(diagram);
    setErrors(validationErrors);
    return validationErrors;
  }, [diagram]);

  const isValid = useMemo(() => errors.length === 0, [errors]);

  const updateNode = useCallback((nodeId: string, updates: Partial) => {
    setDiagram(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  const updateEdge = useCallback((edgeId: string, updates: Partial) => {
    setDiagram(prev => ({
      ...prev,
      edges: prev.edges.map(edge =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      )
    }));
  }, []);

  const addNode = useCallback((node: BpmnNode) => {
    setDiagram(prev => ({
      ...prev,
      nodes: [...prev.nodes, node]
    }));
  }, []);

  const addEdge = useCallback((edge: BpmnEdge) => {
    setDiagram(prev => ({
      ...prev,
      edges: [...prev.edges, edge]
    }));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setDiagram(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      )
    }));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setDiagram(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId)
    }));
  }, []);

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
    validate
  };
};
```

---

## APIリファレンス

### DiagramModel クラス

```typescript
class DiagramModel {
  constructor(data: BpmnDiagram)
  
  // ノード操作
  getNodeById(id: string): BpmnNode | undefined
  getNodesByType(type: NodeType): BpmnNode[]
  getNodesByLane(laneId: string): BpmnNode[]
  
  // エッジ操作
  getEdgeById(id: string): BpmnEdge | undefined
  getOutgoingEdges(nodeId: string): BpmnEdge[]
  getIncomingEdges(nodeId: string): BpmnEdge[]
  
  // プール/レーン操作
  getPoolById(poolId: string): Pool | undefined
  getLaneById(laneId: string): Lane | undefined
  
  // データ取得
  getData(): BpmnDiagram
}
```

### ReactFlowConverter クラス

```typescript
class ReactFlowConverter {
  static convert(bpmnData: BpmnDiagram): ReactFlowData
  
  // 個別変換
  static convertNode(node: BpmnNode): Node
  static convertEdge(edge: BpmnEdge): Edge
  
  // 逆変換
  static convertFromReactFlow(
    nodes: Node[], 
    edges: Edge[]
  ): Partial
}
```

### BpmnValidator クラス

```typescript
class BpmnValidator {
  static validate(diagram: BpmnDiagram): ValidationError[]
  static validateNodes(nodes: BpmnNode[]): ValidationError[]
  static validateEdges(edges: BpmnEdge[], nodes: BpmnNode[]): ValidationError[]
  static validateProcessFlow(diagram: BpmnDiagram): ValidationError[]
}
```

### LayoutEngine クラス

```typescript
interface LayoutOptions {
  direction: 'LR' | 'TB' | 'RL' | 'BT';
  nodeSpacing: number;
  rankSpacing: number;
}

class LayoutEngine {
  static autoLayout(
    nodes: BpmnNode[], 
    edges: BpmnEdge[],
    options?: LayoutOptions
  ): BpmnNode[]
}
```

---

## サンプルコード

### 完全な使用例

```typescript
// App.tsx

import React, { useEffect } from 'react';
import { BpmnViewer } from './components/BpmnViewer';
import { useBpmnDiagram } from './hooks/useBpmnDiagram';
import { BpmnDiagram } from './types/bpmn';
import { sampleDiagram } from './data/sampleDiagram';

export const App: React.FC = () => {
  const {
    diagram,
    errors,
    isValid,
    validate,
    updateNode
  } = useBpmnDiagram(sampleDiagram);

  useEffect(() => {
    // 初期バリデーション
    validate();
  }, [validate]);

  const handleNodeClick = (nodeId: string) => {
    console.log('Node clicked:', nodeId);
    // ノードの詳細表示やプロパティ編集など
  };

  return (
    
      
        BPMN Diagram Viewer
        {!isValid && (
          
            Validation Errors:
            
              {errors.map((error, index) => (
                
                  {error.field}: {error.message}
                  {error.elementId && ` (${error.elementId})`}
                
              ))}
            
          
        )}
      
      
      
        
      
    
  );
};
```

### サンプルデータ

```typescript
// data/sampleDiagram.ts

import { BpmnDiagram, NodeType, EventSubType, TaskSubType, GatewaySubType } from '../types/bpmn';

export const sampleDiagram: BpmnDiagram = {
  diagram: {
    id: 'purchase_approval_001',
    name: '購買承認プロセス',
    version: '1.0',
    metadata: {
      created: '2025-01-15T10:00:00Z',
      author: 'system',
      description: '購買申請から承認までの業務フロー'
    }
  },
  
  pools: [
    {
      id: 'pool_001',
      name: '購買部門',
      position: { x: 0, y: 0 },
      size: { width: 1200, height: 500 },
      lanes: [
        {
          id: 'lane_001',
          name: '申請者',
          position: { x: 0, y: 0 },
          size: { width: 1200, height: 250 }
        },
        {
          id: 'lane_002',
          name: '承認者',
          position: { x: 0, y: 250 },
          size: { width: 1200, height: 250 }
        }
      ]
    }
  ],
  
  nodes: [
    {
      id: 'start_001',
      type: NodeType.START_EVENT,
      subType: EventSubType.NONE,
      name: '申請開始',
      position: { x: 100, y: 100 },
      size: { width: 36, height: 36 },
      parentId: 'lane_001'
    },
    {
      id: 'task_001',
      type: NodeType.TASK,
      subType: TaskSubType.USER_TASK,
      name: '購買申請書作成',
      position: { x: 200, y: 75 },
      size: { width: 120, height: 80 },
      parentId: 'lane_001',
      properties: {
        assignee: '申請者',
        formKey: 'purchase_request_form'
      }
    },
    {
      id: 'gateway_001',
      type: NodeType.GATEWAY,
      subType: GatewaySubType.EXCLUSIVE,
      name: '金額確認',
      position: { x: 380, y: 90 },
      size: { width: 50, height: 50 },
      parentId: 'lane_001',
      properties: {
        gatewayDirection: 'diverging'
      }
    },
    {
      id: 'task_002',
      type: NodeType.TASK,
      subType: TaskSubType.USER_TASK,
      name: '承認処理',
      position: { x: 500, y: 325 },
      size: { width: 120, height: 80 },
      parentId: 'lane_002',
      properties: {
        assignee: '承認者',
        candidateGroups: ['approvers']
      }
    },
    {
      id: 'task_003',
      type: NodeType.TASK,
      subType: TaskSubType.SERVICE_TASK,
      name: '自動承認',
      position: { x: 500, y: 75 },
      size: { width: 120, height: 80 },
      parentId: 'lane_001',
      properties: {
        implementation: 'autoApprovalService'
      }
    },
    {
      id: 'gateway_002',
      type: NodeType.GATEWAY,
      subType: GatewaySubType.EXCLUSIVE,
      name: '承認結果',
      position: { x: 700, y: 340 },
      size: { width: 50, height: 50 },
      parentId: 'lane_002',
      properties: {
        gatewayDirection: 'diverging'
      }
    },
    {
      id: 'task_004',
      type: NodeType.TASK,
      subType: TaskSubType.USER_TASK,
      name: '再申請',
      position: { x: 800, y: 425 },
      size: { width: 120, height: 80 },
      parentId: 'lane_001'
    },
    {
      id: 'end_001',
      type: NodeType.END_EVENT,
      subType: EventSubType.NONE,
      name: '承認完了',
      position: { x: 1000, y: 97 },
      size: { width: 36, height: 36 },
      parentId: 'lane_001'
    },
    {
      id: 'end_002',
      type: NodeType.END_EVENT,
      subType: EventSubType.NONE,
      name: '却下',
      position: { x: 1000, y: 447 },
      size: { width: 36, height: 36 },
      parentId: 'lane_001'
    }
  ],
  
  edges: [
    {
      id: 'flow_001',
      type: 'sequenceFlow',
      source: 'start_001',
      target: 'task_001',
      name: ''
    },
    {
      id: 'flow_002',
      type: 'sequenceFlow',
      source: 'task_001',
      target: 'gateway_001',
      name: ''
    },
    {
      id: 'flow_003',
      type: 'sequenceFlow',
      source: 'gateway_001',
      target: 'task_002',
      name: '10万円以上',
      properties: {
        conditionExpression: '${amount >= 100000}'
      }
    },
    {
      id: 'flow_004',
      type: 'sequenceFlow',
      source: 'gateway_001',
      target: 'task_003',
      name: '10万円未満',
      properties: {
        conditionExpression: '${amount < 100000}',
        isDefault: true
      }
    },
    {
      id: 'flow_005',
      type: 'sequenceFlow',
      source: 'task_002',
      target: 'gateway_002',
      name: ''
    },
    {
      id: 'flow_006',
      type: 'sequenceFlow',
      source: 'gateway_002',
      target: 'end_001',
      name: '承認',
      properties: {
        conditionExpression: '${approved == true}'
      }
    },
    {
      id: 'flow_007',
      type: 'sequenceFlow',
      source: 'gateway_002',
      target: 'task_004',
      name: '差戻し',
      properties: {
        conditionExpression: '${approved == false}'
      }
    },
    {
      id: 'flow_008',
      type: 'sequenceFlow',
      source: 'task_004',
      target: 'task_001',
      name: ''
    },
    {
      id: 'flow_009',
      type: 'sequenceFlow',
      source: 'task_003',
      target: 'end_001',
      name: ''
    },
    {
      id: 'flow_010',
      type: 'sequenceFlow',
      source: 'gateway_002',
      target: 'end_002',
      name: '却下',
      properties: {
        conditionExpression: '${rejected == true}'
      }
    }
  ],
  
  artifacts: [
    {
      id: 'data_001',
      type: 'dataObject',
      name: '購買申請書',
      position: { x: 260, y: 20 },
      size: { width: 40, height: 50 }
    },
    {
      id: 'annotation_001',
      type: 'annotation',
      text: '金額に応じて承認フローが分岐します',
      position: { x: 350, y: 20 },
      size: { width: 180, height: 50 }
    }
  ],
  
  associations: [
    {
      id: 'assoc_001',
      type: 'association',
      source: 'data_001',
      target: 'task_001',
      direction: 'output'
    },
    {
      id: 'assoc_002',
      type: 'association',
      source: 'annotation_001',
      target: 'gateway_001',
      direction: 'none'
    }
  ]
};
```

### スタイル定義（CSS）

```css
/* styles/bpmn.css */

.bpmn-task-node {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: white;
  border: 2px solid #000;
  border-radius: 4px;
  width: 100%;
  height: 100%;
}

.task-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.task-icon {
  font-size: 20px;
}

.task-label {
  font-size: 12px;
  text-align: center;
  word-break: break-word;
}

.bpmn-gateway-node {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #000;
  transform: rotate(45deg);
}

.gateway-symbol {
  font-size: 24px;
  font-weight: bold;
  transform: rotate(-45deg);
}

.gateway-label {
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%) rotate(-45deg);
  white-space: nowrap;
  font-size: 11px;
}

.bpmn-start-event-node,
.bpmn-end-event-node {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.bpmn-start-event-node {
  border: 2px solid #000;
}

.bpmn-end-event-node {
  border: 4px solid #000;
}

.validation-errors {
  background: #fee;
  border: 1px solid #c00;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}

.validation-errors h3 {
  margin-top: 0;
  color: #c00;
}

.validation-errors ul {
  margin: 5px 0;
  padding-left: 20px;
}
```

---

## BPMN-js実装

### BPMN-js用コンバーター

```typescript
// converters/toBpmnJs.ts

import { BpmnDiagram } from '../types/bpmn';

export class BpmnJsConverter {
  
  static convert(bpmnData: BpmnDiagram): string {
    // BPMN 2.0 XML形式に変換
    const xml = this.generateBpmnXml(bpmnData);
    return xml;
  }

  private static generateBpmnXml(diagram: BpmnDiagram): string {
    const processId = diagram.diagram.id;
    const processName = diagram.diagram.name;

    let xml = `

  
  
`;

    // ノード追加
    diagram.nodes.forEach(node => {
      xml += this.generateNodeXml(node);
    });

    // エッジ追加
    diagram.edges.forEach(edge => {
      xml += this.generateEdgeXml(edge);
    });

    xml += `  \n`;

    // Diagram Interchange (位置情報)
    xml += this.generateDiagramXml(diagram);

    xml += ``;

    return xml;
  }

  private static generateNodeXml(node: any): string {
    switch (node.type) {
      case 'startEvent':
        return `    \n`;
      case 'endEvent':
        return `    \n`;
      case 'task':
        return `    \n`;
      case 'gateway':
        const gatewayType = this.getGatewayType(node.subType);
        return `    <bpmn:${gatewayType} id="${node.id}" name="${node.name || ''}"/>\n`;
      default:
        return '';
    }
  }

  private static getGatewayType(subType: string): string {
    const typeMap: Record = {
      'exclusive': 'exclusiveGateway',
      'parallel': 'parallelGateway',
      'inclusive': 'inclusiveGateway',
      'eventBased': 'eventBasedGateway'
    };
    return typeMap[subType] || 'exclusiveGateway';
  }

  private static generateEdgeXml(edge: any): string {
    return `    \n`;
  }

  private static generateDiagramXml(diagram: BpmnDiagram): string {
    let xml = `  
    
`;

    // ノードの位置情報
    diagram.nodes.forEach(node => {
      xml += `      
        
      \n`;
    });

    // エッジの位置情報
    diagram.edges.forEach(edge => {
      const sourceNode = diagram.nodes.find(n => n.id === edge.source);
      const targetNode = diagram.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        xml += `      
        
        
      \n`;
      }
    });

    xml += `    
  \n`;

    return xml;
  }
}
```

### BPMN-js ビューアコンポーネント

```typescript
// components/BpmnJsViewer.tsx

import React, { useEffect, useRef } from 'react';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import { BpmnDiagram } from '../types/bpmn';
import { BpmnJsConverter } from '../converters/toBpmnJs';

interface BpmnJsViewerProps {
  diagram: BpmnDiagram;
  onElementClick?: (element: any) => void;
}

export const BpmnJsViewer: React.FC = ({
  diagram,
  onElementClick
}) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // BPMN Viewerの初期化
    const viewer = new BpmnViewer({
      container: containerRef.current,
      height: 600
    });

    viewerRef.current = viewer;

    // XML生成とインポート
    const xml = BpmnJsConverter.convert(diagram);
    
    viewer.importXML(xml).then(() => {
      const canvas = viewer.get('canvas');
      canvas.zoom('fit-viewport');

      // クリックイベントの登録
      if (onElementClick) {
        const eventBus = viewer.get('eventBus');
        eventBus.on('element.click', (event: any) => {
          onElementClick(event.element);
        });
      }
    }).catch((err: any) => {
      console.error('Error rendering BPMN diagram:', err);
    });

    return () => {
      viewer.destroy();
    };
  }, [diagram, onElementClick]);

  return (
    
  );
};
```

---

## パッケージ設定

### package.json

```json
{
  "name": "bpmn-visualization-system",
  "version": "1.0.0",
  "description": "BPMN diagram auto-visualization system",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint src --ext ts,tsx",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "reactflow": "^11.10.0",
    "bpmn-js": "^14.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.56.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## テストコード例

```typescript
// __tests__/validators/bpmnValidator.test.ts

import { describe, it, expect } from 'vitest';
import { BpmnValidator } from '../../src/validators/bpmnValidator';
import { BpmnDiagram, NodeType, EventSubType } from '../../src/types/bpmn';

describe('BpmnValidator', () => {
  it('should validate a correct diagram', () => {
    const validDiagram: BpmnDiagram = {
      diagram: {
        id: 'test_001',
        name: 'Test Diagram'
      },
      nodes: [
        {
          id: 'start',
          type: NodeType.START_EVENT,
          subType: EventSubType.NONE,
          position: { x: 0, y: 0 },
          size: { width: 36, height: 36 }
        },
        {
          id: 'end',
          type: NodeType.END_EVENT,
          subType: EventSubType.NONE,
          position: { x: 200, y: 0 },
          size: { width: 36, height: 36 }
        }
      ],
      edges: [
        {
          id: 'flow1',
          type: 'sequenceFlow',
          source: 'start',
          target: 'end'
        }
      ]
    };

    const errors = BpmnValidator.validate(validDiagram);
    expect(errors).toHaveLength(0);
  });

  it('should detect missing start event', () => {
    const invalidDiagram: BpmnDiagram = {
      diagram: { id: 'test_002', name: 'Invalid' },
      nodes: [
        {
          id: 'end',
          type: NodeType.END_EVENT,
          subType: EventSubType.NONE,
          position: { x: 0, y: 0 },
          size: { width: 36, height: 36 }
        }
      ],
      edges: []
    };

    const errors = BpmnValidator.validate(invalidDiagram);
    expect(errors.some(e => e.message.includes('start event'))).toBe(true);
  });
});
```

---

## ベストプラクティス

### 1. データの不変性を保つ
```typescript
// ❌ 悪い例
node.position.x = 100;

// ✅ 良い例
const updatedNode = {
  ...node,
  position: { ...node.position, x: 100 }
};
```

### 2. TypeScriptの型を活用
```typescript
// 型ガードの使用
function isTaskNode(node: BpmnNode): node is TaskNode {
  return node.type === NodeType.TASK;
}

// 使用例
if (isTaskNode(node)) {
  // nodeはTaskNode型として扱われる
  console.log(node.properties?.assignee);
}
```

### 3. IDの一意性を保証
```typescript
// IdGeneratorを使用
import { IdGenerator } from '../utils/idGenerator';

const newNodeId = IdGenerator.generateId('node');
const newEdgeId = IdGenerator.generateUuid();
```

### 4. エラーハンドリング
```typescript
try {
  const xml = BpmnJsConverter.convert(diagram);
  await viewer.importXML(xml);
} catch (error) {
  console.error('Failed to render diagram:', error);
  // ユーザーにエラーを通知
  showErrorNotification('図の読み込みに失敗しました');
}
```

### 5. パフォーマンス最適化
```typescript
// useMemoで計算結果をキャッシュ
const reactFlowData = useMemo(
  () => ReactFlowConverter.convert(diagram),
  [diagram]
);

// useCallbackでコールバックをメモ化
const handleNodeClick = useCallback((nodeId: string) => {
  console.log('Clicked:', nodeId);
}, []);
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. ノードが表示されない
**原因**: 位置座標が不正、またはサイズが0

**解決方法**:
```typescript
// デフォルトサイズを設定
import { DEFAULT_SIZES } from '../utils/constants';

const node: BpmnNode = {
  id: 'task_001',
  type: NodeType.TASK,
  position: { x: 100, y: 100 },
  size: DEFAULT_SIZES.task, // デフォルトサイズを使用
  ...
};
```

#### 2. エッジが接続されない
**原因**: sourceまたはtargetのノードIDが存在しない

**解決方法**:
```typescript
// バリデーションで事前チェック
const errors = BpmnValidator.validate(diagram);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
  // エラーを修正
}
```

#### 3. React Flowのレンダリングが遅い
**原因**: ノード/エッジ数が多い、または不要な再レンダリング

**解決方法**:
```typescript
// React.memoでコンポーネントをメモ化
export const BpmnTaskNode = React.memo<NodeProps>(({ data }) => {
  // ...
});

// 仮想化を検討（1000ノード以上の場合）
import { useVirtualizer } from '@tanstack/react-virtual';
```

#### 4. BPMN-jsのXMLインポートエラー
**原因**: XML構造が不正

**解決方法**:
```typescript
// XMLを検証
const xml = BpmnJsConverter.convert(diagram);
console.log('Generated XML:', xml);

// BPMN 2.0スキーマに準拠しているか確認
// オンラインバリデーターを使用: https://www.bpmn.io/toolkit/bpmn-js/
```

---

## 拡張機能の実装

### 1. ズーム・パン機能

```typescript
// components/DiagramControls.tsx

import React from 'react';
import { useReactFlow } from 'reactflow';

export const DiagramControls: React.FC = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    
      <button onClick={() => zoomIn()}>拡大
      <button onClick={() => zoomOut()}>縮小
      <button onClick={() => fitView()}>全体表示
    
  );
};
```

### 2. ノードの検索・ハイライト

```typescript
// hooks/useNodeSearch.ts

import { useState, useCallback } from 'react';
import { BpmnNode } from '../types/bpmn';

export const useNodeSearch = (nodes: BpmnNode[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedNodes, setHighlightedNodes] = useState<Set>(
    new Set()
  );

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    
    if (!term) {
      setHighlightedNodes(new Set());
      return;
    }

    const matches = nodes
      .filter(node => 
        node.name?.toLowerCase().includes(term.toLowerCase()) ||
        node.id.toLowerCase().includes(term.toLowerCase())
      )
      .map(node => node.id);

    setHighlightedNodes(new Set(matches));
  }, [nodes]);

  return {
    searchTerm,
    highlightedNodes,
    search
  };
};
```

### 3. エクスポート機能

```typescript
// utils/exportDiagram.ts

import { BpmnDiagram } from '../types/bpmn';
import { BpmnJsConverter } from '../converters/toBpmnJs';

export class DiagramExporter {
  
  // JSON形式でエクスポート
  static exportAsJson(diagram: BpmnDiagram): void {
    const json = JSON.stringify(diagram, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadFile(blob, `${diagram.diagram.name}.json`);
  }

  // BPMN XML形式でエクスポート
  static exportAsBpmnXml(diagram: BpmnDiagram): void {
    const xml = BpmnJsConverter.convert(diagram);
    const blob = new Blob([xml], { type: 'application/xml' });
    this.downloadFile(blob, `${diagram.diagram.name}.bpmn`);
  }

  // SVG画像としてエクスポート
  static async exportAsSvg(
    svgElement: SVGSVGElement, 
    filename: string
  ): Promise {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    this.downloadFile(blob, `${filename}.svg`);
  }

  // PNG画像としてエクスポート
  static async exportAsPng(
    svgElement: SVGSVGElement, 
    filename: string
  ): Promise {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            this.downloadFile(blob, `${filename}.png`);
            resolve();
          } else {
            reject(new Error('Failed to create PNG'));
          }
        });
      };
      
      img.onerror = reject;
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  }

  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
```

### 4. インポート機能

```typescript
// utils/importDiagram.ts

import { BpmnDiagram } from '../types/bpmn';
import { BpmnValidator } from '../validators/bpmnValidator';

export class DiagramImporter {
  
  // JSON形式からインポート
  static async importFromJson(file: File): Promise {
    const text = await file.text();
    const diagram = JSON.parse(text) as BpmnDiagram;
    
    // バリデーション
    const errors = BpmnValidator.validate(diagram);
    if (errors.length > 0) {
      throw new Error(`Invalid BPMN data: ${errors[0].message}`);
    }
    
    return diagram;
  }

  // BPMN XML形式からインポート（簡易版）
  static async importFromBpmnXml(file: File): Promise<Partial> {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    // XMLからBpmnDiagram形式に変換
    // 注: 完全な実装にはXMLパーサーが必要
    return this.parseXmlToDiagram(xmlDoc);
  }

  private static parseXmlToDiagram(
    xmlDoc: Document
  ): Partial {
    // 簡易的な実装例
    const processElement = xmlDoc.querySelector('process');
    const processId = processElement?.getAttribute('id') || 'imported';
    const processName = processElement?.getAttribute('name') || 'Imported Diagram';

    return {
      diagram: {
        id: processId,
        name: processName,
        version: '1.0'
      },
      nodes: [],
      edges: []
    };
  }
}
```

### 5. アンドゥ・リドゥ機能

```typescript
// hooks/useHistoryManager.ts

import { useState, useCallback } from 'react';
import { BpmnDiagram } from '../types/bpmn';

interface HistoryState {
  past: BpmnDiagram[];
  present: BpmnDiagram;
  future: BpmnDiagram[];
}

export const useHistoryManager = (initialDiagram: BpmnDiagram) => {
  const [history, setHistory] = useState({
    past: [],
    present: initialDiagram,
    future: []
  });

  const updateDiagram = useCallback((newDiagram: BpmnDiagram) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newDiagram,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    diagram: history.present,
    updateDiagram,
    undo,
    redo,
    canUndo,
    canRedo
  };
};
```

---

## パフォーマンス最適化ガイド

### 1. 大規模ダイアグラムの処理

```typescript
// utils/performanceOptimizer.ts

export class PerformanceOptimizer {
  
  // ノードの可視範囲のみをレンダリング
  static filterVisibleNodes(
    nodes: BpmnNode[],
    viewport: { x: number; y: number; zoom: number }
  ): BpmnNode[] {
    const viewportWidth = window.innerWidth / viewport.zoom;
    const viewportHeight = window.innerHeight / viewport.zoom;

    return nodes.filter(node => {
      const nodeRight = node.position.x + node.size.width;
      const nodeBottom = node.position.y + node.size.height;

      return (
        nodeRight >= viewport.x &&
        node.position.x <= viewport.x + viewportWidth &&
        nodeBottom >= viewport.y &&
        node.position.y <= viewport.y + viewportHeight
      );
    });
  }

  // エッジの簡略化（直線化）
  static simplifyEdges(edges: BpmnEdge[]): BpmnEdge[] {
    return edges.map(edge => ({
      ...edge,
      waypoints: edge.waypoints ? 
        this.simplifyWaypoints(edge.waypoints) : 
        undefined
    }));
  }

  private static simplifyWaypoints(
    waypoints: { x: number; y: number }[]
  ): { x: number; y: number }[] {
    if (waypoints.length <= 2) return waypoints;

    // Douglas-Peuckerアルゴリズムの簡易実装
    const tolerance = 5;
    const simplified = [waypoints[0]];
    
    // 簡略化ロジック（詳細は省略）
    
    simplified.push(waypoints[waypoints.length - 1]);
    return simplified;
  }

  // デバウンス関数
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}
```

### 2. メモリ管理

```typescript
// hooks/useDiagramCleanup.ts

import { useEffect } from 'react';

export const useDiagramCleanup = () => {
  useEffect(() => {
    return () => {
      // コンポーネントアンマウント時のクリーンアップ
      // イベントリスナーの削除
      // タイマーのクリア
      // メモリリークの防止
    };
  }, []);
};
```

---

## セキュリティ考慮事項

### 1. XSS対策

```typescript
// utils/sanitizer.ts

export class Sanitizer {
  
  // HTMLタグのエスケープ
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ノード名のサニタイズ
  static sanitizeNodeName(name: string): string {
    return this.escapeHtml(name.trim());
  }

  // プロパティ値のサニタイズ
  static sanitizeProperties(properties: Record): Record {
    const sanitized: Record = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string') {
        sanitized[key] = this.escapeHtml(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}
```

### 2. データバリデーション

```typescript
// validators/inputValidator.ts

export class InputValidator {
  
  static validateNodeId(id: string): boolean {
    // 英数字、アンダースコア、ハイフンのみ許可
    return /^[a-zA-Z0-9_-]+$/.test(id);
  }

  static validatePosition(position: { x: number; y: number }): boolean {
    return (
      Number.isFinite(position.x) &&
      Number.isFinite(position.y) &&
      position.x >= 0 &&
      position.y >= 0
    );
  }

  static validateSize(size: { width: number; height: number }): boolean {
    return (
      Number.isFinite(size.width) &&
      Number.isFinite(size.height) &&
      size.width > 0 &&
      size.height > 0
    );
  }
}
```

---

## デプロイメント

### 1. ビルド設定

```javascript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'flow-vendor': ['reactflow'],
          'bpmn-vendor': ['bpmn-js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['reactflow', 'bpmn-js']
  }
});
```

### 2. 環境変数設定

```bash
# .env.production

VITE_API_ENDPOINT=https://api.example.com
VITE_MAX_DIAGRAM_SIZE=10000
VITE_ENABLE_ANALYTICS=true
```

### 3. Docker設定

```dockerfile
# Dockerfile

FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## まとめ

### 実装の優先順位

**Phase 1: 基本機能**
1. データ構造の定義（型定義）
2. React Flow基本表示
3. バリデーション機能

**Phase 2: 可視化強化**
1. カスタムノードコンポーネント
2. スタイリング
3. インタラクション（クリック、ホバー）

**Phase 3: 編集機能**
1. ノード追加・削除
2. エッジ追加・削除
3. アンドゥ・リドゥ

**Phase 4: 高度な機能**
1. 自動レイアウト
2. インポート・エクスポート
3. BPMN-js連携

### 推奨ライブラリ

**必須:**
- `reactflow` - React Flowベース実装
- `bpmn-js` - BPMN標準準拠

**推奨:**
- `dagre` - 自動レイアウトアルゴリズム
- `elkjs` - より高度なレイアウト
- `zustand` - 状態管理（Reduxの代替）
- `react-query` - データフェッチング

### 参考リンク

- [React Flow Documentation](https://reactflow.dev/)
- [BPMN-js Documentation](https://bpmn.io/toolkit/bpmn-js/)
- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [Dagre Layout Algorithm](https://github.com/dagrejs/dagre)

---

## 付録: 完全な実装例

以下は、全機能を統合した完全な実装例です：

```typescript
// App.tsx - 完全版

import React, { useState } from 'react';
import { BpmnViewer } from './components/BpmnViewer';
import { DiagramControls } from './components/DiagramControls';
import { useBpmnDiagram } from './hooks/useBpmnDiagram';
import { useHistoryManager } from './hooks/useHistoryManager';
import { DiagramExporter } from './utils/exportDiagram';
import { DiagramImporter } from './utils/importDiagram';
import { sampleDiagram } from './data/sampleDiagram';
import './styles/app.css';

export const App: React.FC = () => {
  const {
    diagram: currentDiagram,
    updateDiagram,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistoryManager(sampleDiagram);

  const {
    diagram,
    errors,
    isValid,
    validate,
    updateNode,
    addNode,
    removeNode
  } = useBpmnDiagram(currentDiagram);

  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const handleExportJson = () => {
    DiagramExporter.exportAsJson(diagram);
  };

  const handleExportBpmn = () => {
    DiagramExporter.exportAsBpmnXml(diagram);
  };

  const handleImport = async (event: React.ChangeEvent) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await DiagramImporter.importFromJson(file);
      updateDiagram(imported);
    } catch (error) {
      console.error('Import failed:', error);
      alert('ファイルの読み込みに失敗しました');
    }
  };

  return (
    
      
        BPMN Diagram Viewer
        
        
          
            元に戻す
          
          
            やり直し
          
          
            検証
          
          
            JSON出力
          
          
            BPMN出力
          
          
            読込
            
          
        

        {!isValid && (
          
            エラー:
            
              {errors.map((error, i) => (
                
                  {error.field}: {error.message}
                
              ))}
            
          
        )}
      

      
        
        
        

        {selectedNodeId && (
          
            ノードプロパティ
            
              {JSON.stringify(
                diagram.nodes.find(n => n.id === selectedNodeId),
                null,
                2
              )}
            
          
        )}
      
    
  );
};
```

このドキュメントを参照することで、BPMN自動可視化システムの完全な実装が可能です。 as const;
```

---

## 実装ガイド

### 1. React Flow実装

#### Step 1: データモデルの作成

```typescript
// models/Diagram.ts

import { BpmnDiagram, BpmnNode, BpmnEdge } from '../types/bpmn';

export class DiagramModel {
  private data: BpmnDiagram;

  constructor(data: BpmnDiagram) {
    this.data = data;
  }

  // ノード取得
  getNodeById(id: string): BpmnNode | undefined {
    return this.data.nodes.find(node => node.id === id);
  }

  // エッジ取得
  getEdgeById(id: string): BpmnEdge | undefined {
    return this.data.edges.find(edge => edge.id === id);
  }

  // 特定レーンのノード取得
  getNodesByLane(laneId: string): BpmnNode[] {
    return this.data.nodes.filter(node => node.parentId === laneId);
  }

  // 特定ノードの出力エッジ取得
  getOutgoingEdges(nodeId: string): BpmnEdge[] {
    return this.data.edges.filter(edge => edge.source === nodeId);
  }

  // 特定ノードの入力エッジ取得
  getIncomingEdges(nodeId: string): BpmnEdge[] {
    return this.data.edges.filter(edge => edge.target === nodeId);
  }

  // データ全体取得
  getData(): BpmnDiagram {
    return this.data;
  }
}
```

#### Step 2: React Flow変換

```typescript
// converters/toReactFlow.ts

import { Node, Edge } from 'reactflow';
import { BpmnDiagram, BpmnNode, BpmnEdge, NodeType } from '../types/bpmn';

export interface ReactFlowData {
  nodes: Node[];
  edges: Edge[];
}

export class ReactFlowConverter {
  
  static convert(bpmnData: BpmnDiagram): ReactFlowData {
    const nodes = this.convertNodes(bpmnData.nodes);
    const edges = this.convertEdges(bpmnData.edges);
    
    return { nodes, edges };
  }

  private static convertNodes(bpmnNodes: BpmnNode[]): Node[] {
    return bpmnNodes.map(node => ({
      id: node.id,
      type: this.getReactFlowNodeType(node.type, node.subType),
      position: node.position,
      data: {
        label: node.name || '',
        bpmnType: node.type,
        bpmnSubType: node.subType,
        properties: node.properties,
        style: node.style
      },
      style: this.convertNodeStyle(node),
      parentNode: node.parentId
    }));
  }

  private static convertEdges(bpmnEdges: BpmnEdge[]): Edge[] {
    return bpmnEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.name,
      type: this.getReactFlowEdgeType(edge.type),
      animated: false,
      style: edge.style,
      data: {
        bpmnType: edge.type,
        properties: edge.properties
      },
      markerEnd: {
        type: 'arrowclosed'
      }
    }));
  }

  private static getReactFlowNodeType(
    nodeType: NodeType, 
    subType?: string
  ): string {
    // カスタムノードタイプへのマッピング
    const typeMap: Record = {
      'startEvent': 'bpmnStartEvent',
      'endEvent': 'bpmnEndEvent',
      'task': 'bpmnTask',
      'gateway': 'bpmnGateway',
      'subprocess': 'bpmnSubprocess'
    };
    
    return typeMap[nodeType] || 'default';
  }

  private static getReactFlowEdgeType(edgeType: string): string {
    const typeMap: Record = {
      'sequenceFlow': 'smoothstep',
      'messageFlow': 'default',
      'association': 'straight'
    };
    
    return typeMap[edgeType] || 'smoothstep';
  }

  private static convertNodeStyle(node: BpmnNode): React.CSSProperties {
    return {
      width: node.size.width,
      height: node.size.height,
      border: `${node.style?.strokeWidth || 2}px solid ${node.style?.borderColor || '#000'}`,
      backgroundColor: node.style?.backgroundColor || '#fff',
      borderRadius: node.type === NodeType.START_EVENT || 
                     node.type === NodeType.END_EVENT ? '50%' : '4px'
    };
  }
}
```

#### Step 3: カスタムノードコンポーネント

```typescript
// components/nodes/BpmnTaskNode.tsx

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface TaskNodeData {
  label: string;
  bpmnSubType?: string;
  properties?: any;
}

export const BpmnTaskNode: React.FC<NodeProps> = ({ data }) => {
  const getTaskIcon = () => {
    switch (data.bpmnSubType) {
      case 'userTask':
        return '👤';
      case 'serviceTask':
        return '⚙️';
      case 'scriptTask':
        return '📝';
      default:
        return '';
    }
  };

  return (
    
      
      
        {getTaskIcon()}
        {data.label}
      
      
    
  );
};
```

```typescript
// components/nodes/BpmnGatewayNode.tsx

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GatewaySubType } from '../../types/bpmn';

interface GatewayNodeData {
  label: string;
  bpmnSubType?: GatewaySubType;
}

export const BpmnGatewayNode: React.FC<NodeProps> = ({ 
  data 
}) => {
  const getGatewaySymbol = () => {
    switch (data.bpmnSubType) {
      case GatewaySubType.EXCLUSIVE:
        return '×';
      case GatewaySubType.PARALLEL:
        return '+';
      case GatewaySubType.INCLUSIVE:
        return '○';
      default:
        return '';
    }
  };

  return (
    
      
      {getGatewaySymbol()}
      {data.label && {data.label}}
      
    
  );
};
```

#### Step 4: メインビューアコンポーネント

```typescript
// components/BpmnViewer.tsx

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';

import { BpmnDiagram } from '../types/bpmn';
import { ReactFlowConverter } from '../converters/toReactFlow';
import { BpmnTaskNode } from './nodes/BpmnTaskNode';
import { BpmnGatewayNode } from './nodes/BpmnGatewayNode';
import { BpmnStartEventNode } from './nodes/BpmnStartEventNode';
import { BpmnEndEventNode } from './nodes/BpmnEndEventNode';

interface BpmnViewerProps {
  diagram: BpmnDiagram;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

export const BpmnViewer: React.FC = ({
  diagram,
  onNodeClick,
  onEdgeClick
}) => {
  // カスタムノードタイプの定義
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      bpmnTask: BpmnTaskNode,
      bpmnGateway: BpmnGatewayNode,
      bpmnStartEvent: BpmnStartEventNode,
      bpmnEndEvent: BpmnEndEventNode
    }),
    []
  );

  // BPMNデータをReact Flow形式に変換
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => ReactFlowConverter.convert(diagram),
    [diagram]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = (event: React.MouseEvent, node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  const handleEdgeClick = (event: React.MouseEvent, edge: any) => {
    if (onEdgeClick) {
      onEdgeClick(edge.id);
    }
  };

  return (
    
      
        
        
        
      
    
  );
};
```

### 2. バリデーション実装

```typescript
// validators/bpmnValidator.ts

import { BpmnDiagram, BpmnNode, BpmnEdge, NodeType } from '../types/bpmn';

export interface ValidationError {
  field: string;
  message: string;
  elementId?: string;
}

export class BpmnValidator {
  
  static validate(diagram: BpmnDiagram): ValidationError[] {
    const errors: ValidationError[] = [];

    // 基本構造の検証
    if (!diagram.diagram?.id) {
      errors.push({ field: 'diagram.id', message: 'Diagram ID is required' });
    }

    // ノードの検証
    errors.push(...this.validateNodes(diagram.nodes));

    // エッジの検証
    errors.push(...this.validateEdges(diagram.edges, diagram.nodes));

    // プロセスフローの検証
    errors.push(...this.validateProcessFlow(diagram));

    return errors;
  }

  private static validateNodes(nodes: BpmnNode[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const nodeIds = new Set();

    nodes.forEach(node => {
      // ID重複チェック
      if (nodeIds.has(node.id)) {
        errors.push({
          field: 'nodes',
          message: `Duplicate node ID: ${node.id}`,
          elementId: node.id
        });
      }
      nodeIds.add(node.id);

      // 必須フィールドチェック
      if (!node.type) {
        errors.push({
          field: 'nodes.type',
          message: 'Node type is required',
          elementId: node.id
        });
      }

      if (!node.position) {
        errors.push({
          field: 'nodes.position',
          message: 'Node position is required',
          elementId: node.id
        });
      }

      // タイプ別の検証
      if (node.type === NodeType.GATEWAY && !node.subType) {
        errors.push({
          field: 'nodes.subType',
          message: 'Gateway subType is required',
          elementId: node.id
        });
      }
    });

    return errors;
  }

  private static validateEdges(
    edges: BpmnEdge[], 
    nodes: BpmnNode[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));
    const edgeIds = new Set();

    edges.forEach(edge => {
      // ID重複チェック
      if (edgeIds.has(edge.id)) {
        errors.push({
          field: 'edges',
          message: `Duplicate edge ID: ${edge.id}`,
          elementId: edge.id
        });
      }
      edgeIds.add(edge.id);

      // 参照整合性チェック
      if (!nodeIds.has(edge.source)) {
        errors.push({
          field: 'edges.source',
          message: `Source node not found: ${edge.source}`,
          elementId: edge.id
        });
      }

      if (!nodeIds.has(edge.target)) {
        errors.push({
          field: 'edges.target',
          message: `Target node not found: ${edge.target}`,
          elementId: edge.id
        });
      }

      // 自己参照チェック
      if (edge.source === edge.target) {
        errors.push({
          field: 'edges',
          message: 'Edge cannot connect node to itself',
          elementId: edge.id
        });
      }
    });

    return errors;
  }

  private static validateProcessFlow(diagram: BpmnDiagram): ValidationError[] {
    const errors: ValidationError[] = [];

    // 開始イベントの存在チェック
    const startEvents = diagram.nodes.filter(
      n => n.type === NodeType.START_EVENT
    );
    if (startEvents.length === 0) {
      errors.push({
        field: 'nodes',
        message: 'At least one start event is required'
      });
    }

    // 終了イベントの存在チェック
    const endEvents = diagram.nodes.filter(
      n => n.type === NodeType.END_EVENT
    );
    if (endEvents.length === 0) {
      errors.push({
        field: 'nodes',
        message: 'At least one end event is required'
      });
    }

    // 孤立ノードチェック
    const connectedNodes = new Set();
    diagram.edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    diagram.nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && 
          node.type !== NodeType.START_EVENT) {
        errors.push({
          field: 'nodes',
          message: 'Orphaned node detected',
          elementId: node.id
        });
      }
    });

    return errors;
  }
}
```

### 3. ユーティリティ関数

```typescript
// utils/idGenerator.ts

export class IdGenerator {
  private static counters: Map = new Map();

  static generateId(prefix: string = 'node'): string {
    const count = this.counters.get(prefix) || 0;
    this.counters.set(prefix, count + 1);
    return `${prefix}_${count + 1}`;
  }

  static generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static reset(): void {
    this.counters.clear();
  }
}
```

```typescript
// utils/layoutEngine.ts

import { BpmnNode, BpmnEdge } from '../types/bpmn';

export interface LayoutOptions {
  direction: 'LR' | 'TB' | 'RL' | 'BT';  // Left-Right, Top-Bottom等
  nodeSpacing: number;
  rankSpacing: number;
}

export class LayoutEngine {
  
  static autoLayout(
    nodes: BpmnNode[], 
    edges: BpmnEdge[],
    options: LayoutOptions = {
      direction: 'LR',
      nodeSpacing: 80,
      rankSpacing: 150
    }
  ): BpmnNode[] {
    // 簡易的な階層レイアウト実装
    // 実際はDagreやElkなどのライブラリ使用を推奨
    
    const graph = this.buildGraph(nodes, edges);
    const ranks = this.assignRanks(graph);
    
    return this.positionNodes(nodes, ranks, options);
  }

  private static buildGraph(
    nodes: BpmnNode[], 
    edges: BpmnEdge[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    nodes.forEach(node => {
      graph.set(node.id, []);
    });
    
    edges.forEach(edge => {
      const neighbors = graph.get(edge.source) || [];
      neighbors.push(edge.target);
      graph.set(edge.source, neighbors);
    });
    
    return graph;
  }

  private static assignRanks(
    graph: Map<string, string[]>
  ): Map<string, number> {
    const ranks = new Map<string, number>();
    const visited = new Set<string>();
    
    // BFSで階層を割り当て
    const queue: Array<{ id: string; rank: number }> = [];
    
    // 開始ノードを見つける（入次数0のノード）
    graph.forEach((neighbors, nodeId) => {
      let hasIncoming = false;
      graph.forEach((neighs) => {
        if (neighs.includes(nodeId)) {
          hasIncoming = true;
        }
      });
      
      if (!hasIncoming) {
        queue.push({ id: nodeId, rank: 0 });
      }
    });
    
    while (queue.length > 0) {
      const { id, rank } = queue.shift()!;
      
      if (visited.has(id)) continue;
      visited.add(id);
      ranks.set(id, rank);
      
      const neighbors = graph.get(id) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, rank: rank + 1 });
        }
      });
    }
    
    return ranks;
  }

  private static positionNodes(
    nodes: BpmnNode[],
    ranks: Map<string, number>,
    options: LayoutOptions
  ): BpmnNode[] {
    const nodesPerRank = new Map<number, BpmnNode[]>();
    
    // ランクごとにノードをグループ化
    nodes.forEach(node => {
      const rank = ranks.get(node.id) ?? 0;
      const rankNodes = nodesPerRank.get(rank) || [];
      rankNodes.push(node);
      nodesPerRank.set(rank, rankNodes);
    });
    
    // 位置を計算
    const positionedNodes: BpmnNode[] = [];
    
    nodesPerRank.forEach((rankNodes, rank) => {
      rankNodes.forEach((node, index) => {
        const newNode = { ...node };
        
        if (options.direction === 'LR') {
          newNode.position = {
            x: rank * options.rankSpacing,
            y: index * options.nodeSpacing
          };
        } else if (options.direction === 'TB') {
          newNode.position = {
            x: index * options.nodeSpacing,
            y: rank * options.rankSpacing
          };
        }
        
        positionedNodes.push(newNode);
      });
    });
    
    return positionedNodes;
  }
}
