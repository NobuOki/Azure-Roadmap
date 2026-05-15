import { RoadmapNode } from '../models/roadmapOne.model';

export const ROADMAP_DATA: RoadmapNode[] = [
  {
    id: 'cloud-concepts',
    title: 'Conceptos de Nube',
    status: 'completed',
    color: 'blue',
    x: 220,
    y: 180,
    expandable: true,
    expanded: true,

    children: [
      {
        id: 'azure-policy',
        title: 'Azure Policy',
        status: 'completed',
        color: 'blue',
        x: 420,
        y: 320,
      },
      {
        id: 'initiatives',
        title: 'Iniciativas',
        status: 'progress',
        color: 'blue',
        x: 520,
        y: 470,
      },
    ],
  },

  {
    id: 'governance',
    title: 'Administracion y Gobernanza',
    status: 'progress',
    color: 'purple',
    x: 220,
    y: 580,
  },

  {
    id: 'architecture',
    title: 'Arquitectura y Servicios',
    status: 'locked',
    color: 'pink',
    x: 220,
    y: 700,
  },
];