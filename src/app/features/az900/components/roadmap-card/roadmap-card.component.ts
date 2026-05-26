// ─────────────────────────────────────────────────────────────────────────────
// roadmap-card.component.ts
//
// Muestra la lista de branches con su progreso.
// Responsabilidad: listar y permitir seleccionar un branch.
//
// Ubicación: src/app/features/az900/components/roadmap-card/
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';

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
  branchSelected   = output<string>();

  // ── Datos del servicio ────────────────────────────────────────────────────
  readonly branches        = computed(() => this.svc.map().branches);
  readonly branchProgress  = this.svc.branchProgress;

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Obtiene el progreso de un branch por su id
  getProgress(branchId: string): number {
    return this.branchProgress().find(b => b.id === branchId)?.progress ?? 0;
  }

  // Determina el status visual de un branch según su progreso
  getBranchStatus(branchId: string): 'completed' | 'in-progress' | 'locked' {
    const progress = this.getProgress(branchId);
    if (progress === 100) return 'completed';
    if (progress > 0)     return 'in-progress';
    return 'locked';
  }

  // Color de la barra de progreso según status
  getBarColor(branchId: string): string {
    return {
      'completed':   'bg-teal-700',
      'in-progress': 'bg-blue-700',
      'locked':      'bg-gray-200',
    }[this.getBranchStatus(branchId)];
  }

  onSelect(branchId: string): void {
    if (this.getBranchStatus(branchId) !== 'locked') {
      this.branchSelected.emit(branchId);
    }
  }
}