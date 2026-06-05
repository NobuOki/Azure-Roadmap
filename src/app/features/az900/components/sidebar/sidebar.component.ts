// ─────────────────────────────────────────────────────────────────────────────
// sidebar.component.ts — actualizado
//
// Dos vistas:
//   Vista neutral  → sin branch seleccionado: todos los branches + módulos + mini barra
//   Vista detalle  → branch seleccionado: En curso / Pendientes / Completadas
//
// El anillo cambia según el contexto:
//   Sin selección → overallProgress (global)
//   Con selección → progreso del branch seleccionado
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, input, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { Branch, Module, Unit } from '../../../../core/models';

// ── Interfaces de vista ───────────────────────────────────────────────────────

// Vista neutral: branch con módulos y progreso
export interface BranchSummary {

   id: string;
   label: string;
   progress: number;
   modules: { id: string; label: string }[];
}

// Vista detalle: units agrupadas por estado
export interface BranchDetail {

   label: string;
   progress: number;
   inProgress: { unitLabel: string; moduleLabel: string }[];
   pending: PendingModule[];
   done: DoneModule[];
}

export interface PendingUnit {

  label:  string;
  status: 'pending' | 'locked';  // diferencia visual entre ambos

}
 
export interface PendingModule {

  label:       string;
  hasUnits:    boolean;           // true = tiene units activas para mostrar
  units:       PendingUnit[];     // vacío si solo muestra el header

}

// ── Interface para done (mismo patrón que PendingModule) ─────────────────
export interface DoneModule {

  label:    string;
  hasUnits: boolean;
  units:    { label: string }[];
  
}

@Component({
   selector: 'app-sidebar',
   standalone: true,
   imports: [NgClass],
   templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
   private readonly svc = inject(DashboardService);

   // ── Input — viene del az900.component ────────────────────────────────────
   // null = sin branch seleccionado (vista neutral)
   selectedBranchId = input<string | null>(null);

   // ── Anillo: global o del branch según contexto ────────────────────────────
   ringProgress = computed(() => {
      const id = this.selectedBranchId();
      if (!id) return this.svc.overallProgress();
      return this.svc.branchProgress().find((b) => b.id === id)?.progress ?? 0;
   });

   ringLabel = computed(() =>
      this.selectedBranchId() ? 'progreso del branch' : 'progreso global',
   );

   ringOffset = computed(() => {
      const circumference = 2 * Math.PI * 32;
      return circumference - (this.ringProgress() / 100) * circumference;
   });

   // Color del anillo según progreso
   ringColor = computed(() => {
      const p = this.ringProgress();

      if (p === 100) return '#0F6E56'; // teal — completado
      if (p > 0) return '#185FA5'; // blue — en progreso
      return '#D3D1C7'; // gray — sin iniciar
   });

   // ── Vista neutral: todos los branches con módulos ─────────────────────────
   // Se muestra cuando NO hay branch seleccionado
   branchSummaries = computed((): BranchSummary[] =>
      this.svc.map().branches.map((branch) => ({
         id: branch.id,
         label: branch.label,
         progress: this.svc.branchProgress().find((b) => b.id === branch.id)?.progress ?? 0,
         modules: branch.modules.map((mod) => ({ id: mod.id, label: mod.label })),
      })),
   );

   // ── Computed branchDetail actualizado ────────────────────────────────────────
   // Reemplaza el computed branchDetail existente en SidebarComponent
   // ── Computed principal — solo orquesta ───────────────────────────────────
   branchDetail = computed((): BranchDetail | null => {
      const id = this.selectedBranchId();
      if (!id) return null;

      const branch = this.svc.map().branches.find((b) => b.id === id);
      if (!branch) return null;

      const progress = this.svc.branchProgress().find((b) => b.id === id)?.progress ?? 0;
      return {
         label: branch.label,
         progress,
         inProgress: this.getInProgressUnits(branch.modules),
         done: this.getDoneModules(branch.modules),
         pending: this.getPendingModules(branch.modules),
      };
   });

   // ── Units en curso ────────────────────────────────────────────────────────
   private getInProgressUnits(modules: Module[]): BranchDetail['inProgress'] {
      return modules.flatMap((mod) =>
         mod.units
            .filter((u) => u.status === 'in-progress')
            .map((u) => ({ unitLabel: u.label, moduleLabel: mod.label })),
      );
   }

   // ── Units completadas ─────────────────────────────────────────────────────
   private getDoneModules(modules: Module[]): DoneModule[] {
      return modules
         .filter((mod) => mod.units.some((u) => u.status === 'done')) // solo modules con alguna done
         .map((mod) => this.mapToDoneModule(mod));
   }

   private mapToDoneModule(mod: Module): DoneModule {
      const allDone = mod.units.every((u) => u.status === 'done');

      if (allDone) {
         // Module completamente done → solo header
         return { label: mod.label, hasUnits: false, units: [] };
      }

      // Module parcialmente done → header + units done
      const units = mod.units.filter((u) => u.status === 'done').map((u) => ({ label: u.label }));

      return { label: mod.label, hasUnits: true, units };
   }

   // ── Módulos pendientes ────────────────────────────────────────────────────
   private getPendingModules(modules: Module[]): PendingModule[] {
      // Encuentra el module activo — el primero con in-progress o pending
      const activeModuleId =
         modules.find((mod) =>
            mod.units.some((u) => u.status === 'in-progress' || u.status === 'pending'),
         )?.id ?? null;

      return modules
         .filter((mod) => !mod.units.every((u) => u.status === 'done'))
         .map((mod) => this.mapToPendingModule(mod, mod.id === activeModuleId));
   }

   // ── Mapea un module a PendingModule ──────────────────────────────────────
   private mapToPendingModule(mod: Module, isCurrentModule: boolean): PendingModule {
      if (!isCurrentModule) {
         // No es el module activo → solo header
         return { label: mod.label, hasUnits: false, units: [] };
      }

      // Es el module activo → header + units pending y locked
      const units: PendingUnit[] = mod.units
         .filter((u) => u.status === 'pending' || u.status === 'locked')
         .map((u) => ({ label: u.label, status: u.status as 'pending' | 'locked' }));

      return { label: mod.label, hasUnits: true, units };
   }

   // ── Helpers de estado ─────────────────────────────────────────────────────

   // Determina el escenario de la vista detalle
   getDetailScenario(): 'empty' | 'in-progress' | 'completed' {
      const detail = this.branchDetail();
      if (!detail) return 'empty';
      if (detail.progress === 100) return 'completed';
      if (detail.progress > 0) return 'in-progress';
      return 'empty';
   }

   // Color de la mini barra en la vista neutral
   getMiniBarColor(progress: number): string {
      if (progress === 100) return 'bg-teal-600';
      if (progress > 0) return 'bg-blue-600';
      return 'bg-gray-200';
   }

   // Color del badge de progreso en la vista neutral
   getProgressTextColor(progress: number): string {
      if (progress === 100) return 'text-teal-700';
      if (progress > 0) return 'text-blue-700';
      return 'text-gray-400';
   }
}
