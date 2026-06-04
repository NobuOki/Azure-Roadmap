// ─────────────────────────────────────────────────────────────────────────────
// az900.component.ts — corregido
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, signal, computed } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { ConceptualMapComponent } from './components/conceptual-map/conceptual-map.component';
import { RoadmapCardComponent } from './components/roadmap-card/roadmap-card.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
   selector: 'app-az900',
   standalone: true,
   imports: [ConceptualMapComponent, RoadmapCardComponent, SidebarComponent],
   templateUrl: './az900.component.html',
})
export class Az900Component {
   // ── Servicio (privado — el template no accede directamente) ───────────────
   private readonly svc = inject(DashboardService);

   // ── Propiedades públicas expuestas al template ────────────────────────────
   // El template solo ve estas propiedades — nada más del servicio
   readonly course = this.svc.course;
   readonly overallProgress = this.svc.overallProgress;
   readonly activeModulesCount = this.svc.activeModulesCount;
   readonly totalStudyHours = this.svc.totalStudyHours;
   readonly studyStreak = this.svc.studyStreak;
   readonly totalBranches = computed(() => this.svc.map().branches.length);

   // ── Branch seleccionado ───────────────────────────────────────────────────
   // null = sin selección → sidebar en vista neutral
   // string = branch seleccionado → sidebar en vista detalle
   selectedBranchId = signal<string | null>(null);
   
   onBranchSelected(branchId: string): void {
      // Si hace click en el mismo branch → deselecciona (toggle)
      this.selectedBranchId.update(current =>
         current === branchId ? null : branchId
      );
   }

}
