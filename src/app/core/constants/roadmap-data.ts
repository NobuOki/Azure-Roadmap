import { RoadmapNode } from '../models/roadmap.model';

export const AZURE_ROADMAP_DATA: RoadmapNode[] = [
  {
    id: '1',
    label: 'Conceptos de Nube',
    type: 'branch',
    color: '#3b71fe',
    expanded: true,
    children: [
      { id: '1-1', label: 'Azure Policy', type: 'sub-branch' },
      { 
        id: '1-2', 
        label: 'Cost Management', 
        type: 'sub-branch',
        expanded: true,
        children: [{ id: '1-2-1', label: 'Cost', type: 'nested' }]
      }
    ]
  },
  {
    id: '2',
    label: 'Administración y Gobernanza',
    type: 'branch',
    color: '#a676f2',
    expanded: false,
    children: []
  },
  {
    id: '3',
    label: 'Arquitectura y servicios',
    type: 'branch',
    color: '#f25a8a',
    expanded: false,
    children: []
  }
];