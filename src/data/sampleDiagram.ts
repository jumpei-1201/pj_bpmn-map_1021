import { BpmnDiagram } from '../types/bpmn';
import { EdgeType, EventSubType, GatewaySubType, NodeType, TaskSubType } from '../types/enums';

export const sampleDiagram: BpmnDiagram = {
  diagram: {
    id: 'purchase_approval_001',
    name: '購買承認プロセス',
    version: '1.0',
    metadata: {
      created: '2025-01-15T10:00:00Z',
      author: 'system',
      description: '購買申請から承認までの業務フロー',
    },
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
          size: { width: 1200, height: 250 },
        },
        {
          id: 'lane_002',
          name: '承認者',
          position: { x: 0, y: 250 },
          size: { width: 1200, height: 250 },
        },
      ],
    },
  ],
  nodes: [
    {
      id: 'start_001',
      type: NodeType.START_EVENT,
      subType: EventSubType.NONE,
      name: '申請開始',
      position: { x: 100, y: 100 },
      size: { width: 36, height: 36 },
      parentId: 'lane_001',
    },
    {
      id: 'task_001',
      type: NodeType.TASK,
      subType: TaskSubType.USER_TASK,
      name: '購買申請書作成',
      position: { x: 260, y: 80 },
      size: { width: 120, height: 80 },
      parentId: 'lane_001',
      properties: {
        assignee: '申請者',
        formKey: 'purchase_request_form',
      },
    },
    {
      id: 'gateway_001',
      type: NodeType.GATEWAY,
      subType: GatewaySubType.EXCLUSIVE,
      name: '金額確認',
      position: { x: 440, y: 95 },
      size: { width: 50, height: 50 },
      parentId: 'lane_002',
    },
    {
      id: 'task_002',
      type: NodeType.TASK,
      subType: TaskSubType.USER_TASK,
      name: '部長承認',
      position: { x: 620, y: 80 },
      size: { width: 120, height: 80 },
      parentId: 'lane_002',
      properties: {
        assignee: '部長',
      },
    },
    {
      id: 'end_001',
      type: NodeType.END_EVENT,
      subType: EventSubType.NONE,
      name: '完了',
      position: { x: 820, y: 100 },
      size: { width: 36, height: 36 },
      parentId: 'lane_002',
    },
  ],
  edges: [
    {
      id: 'flow_start_to_task',
      type: EdgeType.SEQUENCE_FLOW,
      source: 'start_001',
      target: 'task_001',
    },
    {
      id: 'flow_task_to_gateway',
      type: EdgeType.SEQUENCE_FLOW,
      source: 'task_001',
      target: 'gateway_001',
    },
    {
      id: 'flow_gateway_to_task',
      type: EdgeType.SEQUENCE_FLOW,
      source: 'gateway_001',
      target: 'task_002',
    },
    {
      id: 'flow_task_to_end',
      type: EdgeType.SEQUENCE_FLOW,
      source: 'task_002',
      target: 'end_001',
    },
  ],
};
