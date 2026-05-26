// ─────────────────────────────────────────────────────────────────────────────
// sidebar.component.ts
//
// Muestra el anillo de progreso global y el detalle del branch seleccionado.
// Responsabilidad: visualizar el progreso y los módulos del branch activo.
//
// Ubicación: src/app/features/az900/components/sidebar/
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, input, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {

  private readonly svc = inject(DashboardService);

  // ── Input ──────────────────────────────────────────────────────────────────
  selectedBranchId = input<string>('b1');

  // ── Datos del servicio ────────────────────────────────────────────────────
  readonly overallProgress = this.svc.overallProgress;

  // Branch seleccionado con su progreso calculado
  selectedBranch = computed(() =>
    this.svc.map().branches.find(b => b.id === this.selectedBranchId())
  );

  selectedBranchProgress = computed(() =>
    this.svc.branchProgress().find(b => b.id === this.selectedBranchId())?.progress ?? 0
  );

  // ── SVG ring offset ────────────────────────────────────────────────────────
  ringOffset = computed(() => {
    const circumference = 2 * Math.PI * 32;
    return circumference - (this.overallProgress() / 100) * circumference;
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  getUnitIcon(status: string): string {
    return { done: 'ti-check', 'in-progress': 'ti-player-play', pending: '' }[status] ?? '';
  }

  getUnitColor(status: string): string {
    return {
      done:         'text-teal-700',
      'in-progress':'text-blue-700',
      pending:      'text-gray-300',
    }[status] ?? '';
  }

  getDotColor(status: string): string {
    return {
      done:         'bg-teal-700',
      'in-progress':'bg-blue-700',
      pending:      'bg-gray-200',
    }[status] ?? '';
  }
}