/*import { Component } from '@angular/core';

@Component({
  selector: 'app-roadmap-final',
  imports: [],
  templateUrl: './roadmap-final.component.html',
  styleUrl: './roadmap-final.component.scss',
})
export class RoadmapFinalComponent {} */

import { Component, computed, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

export type ModuleStatus = 'completed' | 'in-progress' | 'locked';

export interface Subtopic {
  name: string;
  status: 'done' | 'active' | 'pending';
}

export interface RoadmapModule {
  id: number;
  name: string;
  description: string;
  status: ModuleStatus;
  progress: number;
  subtopics: Subtopic[];
}

@Component({
  selector: 'app-az900-dashboard',
  standalone: true,
  // NgClass es necesario para [ngClass] en el template con Tailwind
  imports: [CommonModule, NgClass],
  templateUrl: './roadmap-final.component.html',
  styleUrl: './roadmap-final.component.scss',
})
export class Az900DashboardComponent {

  // ── Stats ──────────────────────────────────────────────────────────────────
  studyHours  = signal(12);
  studyStreak = signal(8);

  // ── Roadmap data ───────────────────────────────────────────────────────────
  modules = signal<RoadmapModule[]>([
    {
      id: 1,
      name: 'Cloud Concepts',
      description: 'IaaS, PaaS, SaaS · Modelos de nube',
      status: 'completed',
      progress: 100,
      subtopics: [
        { name: 'Beneficios de la nube',     status: 'done'    },
        { name: 'Modelos de servicio',        status: 'done'    },
        { name: 'Modelos de implementación',  status: 'done'    },
      ],
    },
    {
      id: 2,
      name: 'Azure Architecture',
      description: 'Regions, Zones, Resource Groups',
      status: 'completed',
      progress: 85,
      subtopics: [
        { name: 'Regiones y zonas',        status: 'done'   },
        { name: 'Resource Groups',         status: 'done'   },
        { name: 'Azure Resource Manager',  status: 'active' },
      ],
    },
    {
      id: 3,
      name: 'Azure Services',
      description: 'Compute, Storage, Networking',
      status: 'in-progress',
      progress: 60,
      subtopics: [
        { name: 'Azure Policy',     status: 'done'    },
        { name: 'Cost Management',  status: 'active'  },
        { name: 'Iniciativas',      status: 'pending' },
      ],
    },
    {
      id: 4,
      name: 'Security & Identity',
      description: 'AAD, RBAC, Zero Trust',
      status: 'locked',
      progress: 0,
      subtopics: [
        { name: 'Azure Active Directory', status: 'pending' },
        { name: 'RBAC',                   status: 'pending' },
        { name: 'Zero Trust',             status: 'pending' },
      ],
    },
    {
      id: 5,
      name: 'Pricing & Governance',
      description: 'SLA, TCO, Azure Policy',
      status: 'locked',
      progress: 0,
      subtopics: [
        { name: 'Calculadora de precios', status: 'pending' },
        { name: 'TCO Calculator',         status: 'pending' },
        { name: 'SLA y ciclo de vida',    status: 'pending' },
      ],
    },
  ]);

  // ── Selected module ────────────────────────────────────────────────────────
  selectedModuleId = signal<number>(3);

  selectedModule = computed(() =>
    this.modules().find(m => m.id === this.selectedModuleId()) ?? this.modules()[2]
  );

  // ── Computed ───────────────────────────────────────────────────────────────
  overallProgress = computed(() => {
    const total = this.modules().reduce((sum, m) => sum + m.progress, 0);
    return Math.round(total / this.modules().length);
  });

  activeModulesCount = computed(() =>
    this.modules().filter(m => m.status !== 'locked').length
  );

  // Offset para el anillo SVG — calculado en TS, aplicado en el template
  ringOffset = computed(() => {
    const circumference = 2 * Math.PI * 32;
    return circumference - (this.overallProgress() / 100) * circumference;
  });

  // ── Acción ────────────────────────────────────────────────────────────────
  selectModule(module: RoadmapModule): void {
    if (module.status !== 'locked') {
      this.selectedModuleId.set(module.id);
    }
  }

  // NOTA: los helpers getModuleColorClass() y getProgressBarColor() del
  // .ts anterior ya NO son necesarios. Con Tailwind, la lógica de colores
  // se expresa directo en [ngClass] dentro del template.
}