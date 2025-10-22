import { BpmnEdge } from '../types/bpmn';
import { EdgeType } from '../types/enums';

export class EdgeModel {
  readonly data: BpmnEdge;

  constructor(data: BpmnEdge) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get type(): EdgeType {
    return this.data.type;
  }

  update(updates: Partial<BpmnEdge>): EdgeModel {
    return new EdgeModel({
      ...this.data,
      ...updates,
      properties: {
        ...this.data.properties,
        ...updates.properties,
      },
      waypoints: updates.waypoints ?? this.data.waypoints,
    });
  }
}
