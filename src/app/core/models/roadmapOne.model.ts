export interface RoadmapNode {
  id: string;
  title: string;
  status: 'completed' | 'progress' | 'locked';
  color: 'blue' | 'purple' | 'pink';

  x: number;
  y: number;

  expandable?: boolean;
  expanded?: boolean;

  children?: RoadmapNode[];
}