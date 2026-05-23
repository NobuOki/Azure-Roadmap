/*import { Component } from '@angular/core';

@Component({
  selector: 'app-roadmap-final',
  imports: [],
  templateUrl: './roadmap-final.component.html',
  styleUrl: './roadmap-final.component.scss',
})
export class RoadmapFinalComponent {} */

import { Component, computed, signal, WritableSignal, ElementRef, ViewChild } from '@angular/core';
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

  // ── Canvas ref (para calcular posición relativa del mouse) ────────────────
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLDivElement>;

  // ── Stats ──────────────────────────────────────────────────────────────────
  studyHours  = signal(12);
  studyStreak = signal(8);

  // ─────────────────────────────────────────────────────────────────────────
  // ZOOM + PAN
  // ─────────────────────────────────────────────────────────────────────────
 
  // Estado del canvas
  zoom  = signal(0.8);   // escala inicial: 80% para que entre el mapa completo
  panX  = signal(0);     // desplazamiento X en px
  panY  = signal(0);     // desplazamiento Y en px
 
  // Estado del drag
  isDragging   = signal(false);
  private dragStartX = 0;
  private dragStartY = 0;
  private panStartX  = 0;
  private panStartY  = 0;
 
  // Transform CSS calculado — se bindea en el template con [style.transform]
  mapTransform = computed(() =>
    `scale(${this.zoom()}) translate(${this.panX()}px, ${this.panY()}px)`
  );
 
  // ── Zoom con botones ──────────────────────────────────────────────────────
  private readonly ZOOM_STEP = 0.1;
  private readonly ZOOM_MIN  = 0.3;
  private readonly ZOOM_MAX  = 2.0;
 
  zoomIn(): void {
    this.zoom.update(z => Math.min(this.ZOOM_MAX, +(z + this.ZOOM_STEP).toFixed(2)));
  }
 
  zoomOut(): void {
    this.zoom.update(z => Math.max(this.ZOOM_MIN, +(z - this.ZOOM_STEP).toFixed(2)));
  }
 
  // ── Zoom con Ctrl + scroll ────────────────────────────────────────────────
  onWheel(e: WheelEvent): void {
    if (!e.ctrlKey) return;   // sin Ctrl → scroll normal del OS
    e.preventDefault();
    const delta = e.deltaY > 0 ? -this.ZOOM_STEP : this.ZOOM_STEP;
    this.zoom.update(z =>
      Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, +(z + delta).toFixed(2)))
    );
  }
 
  // ── Pan con click + drag ──────────────────────────────────────────────────
  onMouseDown(e: MouseEvent): void {
    // Solo botón izquierdo
    if (e.button !== 0) return;
    this.isDragging.set(true);
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.panStartX  = this.panX();
    this.panStartY  = this.panY();
  }
 
  onMouseMove(e: MouseEvent): void {
    if (!this.isDragging()) return;
    // El desplazamiento del mouse se divide por zoom para que
    // el movimiento sea proporcional a la escala actual
    const dx = (e.clientX - this.dragStartX) / this.zoom();
    const dy = (e.clientY - this.dragStartY) / this.zoom();
    this.panX.set(this.panStartX + dx);
    this.panY.set(this.panStartY + dy);
  }
 
  onMouseUp(): void {
    this.isDragging.set(false);
  }
 
  // ── Reset: vuelve al estado inicial ──────────────────────────────────────
  resetCanvas(): void {
    this.zoom.set(0.8);
    this.panX.set(0);
    this.panY.set(0);
  }

  // ── Conceptual Map: joints (interruptores de expansión) ──────────────────
  //
  // joint1    → controla Branch L1 "Conceptos de Nube" + sus hijos
  // joint2    → controla Branch L1 "Administración y Gobernanza"
  // joint3    → controla Branch L1 "Arquitectura y Servicios"
  // jointCost → controla el Nested L3 "Iniciativas" (hijo de Cost Management)
  //
  // joint1 arranca en true para mostrar el mapa con algo visible al cargar
  joint1    = signal(true);
  joint2    = signal(false);
  joint3    = signal(false);
  jointCost = signal(false);

  toggleJoint(j: WritableSignal<boolean>): void {
    j.update(v => !v);
  }

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