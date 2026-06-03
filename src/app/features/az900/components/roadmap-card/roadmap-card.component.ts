// ─────────────────────────────────────────────────────────────────────────────
// roadmap-card.component.ts
//
// Muestra la lista de branches con su progreso.
// Responsabilidad: listar y permitir seleccionar un branch.
//
// Ubicación: src/app/features/az900/components/roadmap-card/
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, input, output, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { Branch, Module, UnitStatus } from '../../../../core/models';

@Component({
   selector: 'app-roadmap-card',
   standalone: true,
   imports: [NgClass],
   templateUrl: './roadmap-card.component.html',
})
export class RoadmapCardComponent {
   private readonly svc = inject(DashboardService);

   // ── Inputs / Outputs ───────────────────────────────────────────────────────
   // input() es la forma moderna de Angular 17+ (sin @Input decorator)
   selectedBranchId = input<string>('b1');
   branchSelected = output<string>();

   // ── Datos del servicio ────────────────────────────────────────────────────
   readonly branches = computed(() => this.svc.map().branches);
   readonly branchProgress = this.svc.branchProgress;

   // ── Branch expandido ───────────────────────────────────────────────────────
   // Solo un branch puede estar expandido a la vez
   expandedBranchId = signal<string | null>(null);

   toggleExpand(branchId: string): void {
      this.expandedBranchId.update((current) => (current === branchId ? null : branchId));
      this.branchSelected.emit(branchId);
   }

   isExpanded(branchId: string): boolean {
      return this.expandedBranchId() === branchId;
   }

   // ── Helpers ───────────────────────────────────────────────────────────────

   // Obtiene el progreso de un branch por su id
   getProgress(branchId: string): number {
      return this.branchProgress().find((b) => b.id === branchId)?.progress ?? 0;
   }

   // Determina el status visual de un branch según su progreso
   getBranchStatus(branchId: string): 'completed' | 'in-progress' | 'locked' {
      const progress = this.getProgress(branchId);
      if (progress === 100) return 'completed';
      if (progress > 0) return 'in-progress';

      // Verifica si tiene alguna unit desbloqueada
      const branch = this.branches().find((b) => b.id === branchId);
      const hasUnlocked = branch?.modules.some((mod) =>
         mod.units.some((u) => u.status !== 'locked'),
      );
      return hasUnlocked ? 'in-progress' : 'locked';
   }

   // ── Module header: contador X/Y ───────────────────────────────────────────
   // X = units done, Y = total units sin contar locked
   getModuleUnitCount(mod: Module): string {
      const total = mod.units.filter((u) => u.status !== 'locked').length;
      const done = mod.units.filter((u) => u.status === 'done').length;
      return `${done}/${total}`;
   }

   // Progreso del module para la mini barra
   getModuleProgress(mod: Module): number {
      const activable = mod.units.filter((u) => u.status !== 'locked');
      if (!activable.length) return 0;
      const done = activable.filter((u) => u.status === 'done').length;
      return Math.round((done / activable.length) * 100);
   }

   // ─────────────────────────────────────────────────────────────────────────────
   // También actualiza getUnitStatusIcon() para usar íconos más expresivos:
   // ─────────────────────────────────────────────────────────────────────────────

   getUnitStatusIcon(status: UnitStatus): string {
      return (
         {
            done: 'ti-check',
            'in-progress': 'ti-loader-2', // ícono de reloj/carga
            pending: 'ti-circle',
            locked: 'ti-lock',
         }[status] ?? 'ti-circle'
      );
   }

   getUnitStatusColor(status: UnitStatus): string {
      return (
         {
            done: 'text-teal-600',
            'in-progress': 'text-amber-500',
            pending: 'text-blue-500',
            locked: 'text-gray-300',
         }[status] ?? 'text-gray-300'
      );
   }

   getUnitDotColor(status: UnitStatus): string {
      return (
         {
            done: 'bg-teal-500',
            'in-progress': 'bg-amber-400',
            pending: 'bg-blue-400',
            locked: 'bg-gray-200',
         }[status] ?? 'bg-gray-200'
      );
   }

   // ── Unit toggle ───────────────────────────────────────────────────────────
   onCycleUnit(unitId: string, status: UnitStatus): void {
      if (status === 'locked') return; // locked no cicla
      this.svc.cycleUnitStatus(unitId);
   }

   // ── Branch row styles ─────────────────────────────────────────────────────
   getBranchRowBg(branchId: string): string {
      return (
         {
            completed: 'bg-teal-50  border-teal-200',
            'in-progress': 'bg-blue-50  border-blue-200',
            locked: 'bg-gray-100 border-gray-200 opacity-60',
         }[this.getBranchStatus(branchId)] ?? ''
      );
   }

   getBadgeBg(branchId: string): string {
      return (
         {
            completed: 'bg-teal-700 text-teal-50',
            'in-progress': 'bg-blue-700 text-blue-50',
            locked: 'bg-gray-300 text-gray-500',
         }[this.getBranchStatus(branchId)] ?? ''
      );
   }

   getBarColor(branchId: string): string {
      return (
         {
            completed: 'bg-teal-700',
            'in-progress': 'bg-blue-700',
            locked: 'bg-gray-200',
         }[this.getBranchStatus(branchId)] ?? ''
      );
   }

   getProgressTextColor(branchId: string): string {
      return (
         {
            completed: 'text-teal-700',
            'in-progress': 'text-blue-700',
            locked: 'text-gray-400',
         }[this.getBranchStatus(branchId)] ?? ''
      );
   }

   // Etiqueta del estado actual (se muestra en el botón)
   getStatusLabel(status: UnitStatus): string {
      return (
         {
            pending: 'Pendiente',
            'in-progress': 'En curso',
            done: 'Completado',
            locked: '',
         }[status] ?? ''
      );
   }

   // Etiqueta del siguiente estado (tooltip del botón)
   getNextStatusLabel(status: UnitStatus): string {
      return (
         {
            pending: 'Marcar como En curso',
            'in-progress': 'Marcar como Completado',
            done: 'Marcar como Pendiente',
            locked: '',
         }[status] ?? ''
      );
   }

   /*
   onSelect(branchId: string): void {
      if (this.getBranchStatus(branchId) !== 'locked') {
         this.branchSelected.emit(branchId);
      }
   }*/
}
