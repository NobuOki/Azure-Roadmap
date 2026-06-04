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
   pending: { unitLabel: string; moduleLabel: string }[];
   done: { unitLabel: string; moduleLabel: string }[];
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

   // ── Vista detalle: branch seleccionado con units agrupadas ────────────────
   // Se muestra cuando SÍ hay branch seleccionado
   branchDetail = computed((): BranchDetail | null => {
      const id = this.selectedBranchId();
      if (!id) return null;

      const branch = this.svc.map().branches.find((b) => b.id === id);
      if (!branch) return null;

      const progress = this.svc.branchProgress().find((b) => b.id === id)?.progress ?? 0;

      const inProgress: BranchDetail['inProgress'] = [];
      const pending: BranchDetail['pending'] = [];
      const done: BranchDetail['done'] = [];

      for (const mod of branch.modules) {
         for (const unit of mod.units) {
            if (unit.status === 'in-progress') {
               inProgress.push({ unitLabel: unit.label, moduleLabel: mod.label });
            } else if (unit.status === 'pending') {
               pending.push({ unitLabel: unit.label, moduleLabel: mod.label });
            } else if (unit.status === 'done') {
               done.push({ unitLabel: unit.label, moduleLabel: mod.label });
            }
            // locked no aparece en ninguna sección
         }
      }

      return { label: branch.label, progress, inProgress, pending, done };
   });

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
