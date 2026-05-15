export type NodeType = 'main' | 'branch' | 'sub-branch' | 'nested';

export interface RoadmapNode {
  id: string;
  label: string;
  type: NodeType;
  color?: string;
  expanded?: boolean;
  children?: RoadmapNode[];
}