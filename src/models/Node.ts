import { BpmnNode, StyleProperties } from '../types/bpmn';
import { NodeType } from '../types/enums';

export class NodeModel {
  readonly data: BpmnNode;

  constructor(data: BpmnNode) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get type(): NodeType {
    return this.data.type;
  }

  get name(): string | undefined {
    return this.data.name;
  }

  get style(): StyleProperties | undefined {
    return this.data.style;
  }

  update(updates: Partial<BpmnNode>): NodeModel {
    return new NodeModel({
      ...this.data,
      ...updates,
      position: updates.position ?? this.data.position,
      size: updates.size ?? this.data.size,
      properties: {
        ...this.data.properties,
        ...updates.properties,
      },
    });
  }
}
