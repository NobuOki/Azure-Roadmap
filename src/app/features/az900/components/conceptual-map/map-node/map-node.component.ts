// ─────────────────────────────────────────────────────────────────────────────
// map-node.component.ts
//
// Componente presentacional — representa UN nodo del árbol.
//
// Estado actual (Paso 5):
//   El renderizado del árbol se hace dentro del SVG con foreignObject
//   directamente en ConceptualMapComponent. Este componente existe como
//   unidad conceptual y preparación para una futura implementación
//   HTML-only (sin SVG) donde podría usarse recursivamente.
//
// Uso futuro previsto:
//   <app-map-node [node]="branch">
//     @for (child of branch.children; track child.id) {
//       <app-map-node [node]="child" />
//     }
//   </app-map-node>
//
// Ubicación: src/app/features/az900/components/conceptual-map/map-node/
// ─────────────────────────────────────────────────────────────────────────────

import { Component, input, output } from '@angular/core';
import { RenderedNode } from '../conceptual-map.component';

@Component({
  selector: 'app-map-node',
  standalone: true,
  imports: [],
  templateUrl: './map-node.component.html',
})
export class MapNodeComponent {

  // ── Inputs ─────────────────────────────────────────────────────────────────
  node     = input.required<RenderedNode>();
  expanded = input<boolean>(false);

  // ── Output ─────────────────────────────────────────────────────────────────
  toggle = output<string>(); // emite el id del nodo al hacer click

  // ── Helpers ───────────────────────────────────────────────────────────────
  onToggle(): void {
    if (this.node().hasChildren) {
      this.toggle.emit(this.node().id);
    }
  }

  getStatusDot(status: string | undefined): string {
    return { done: '#0F6E56', 'in-progress': '#185FA5', pending: '#D3D1C7' }[status ?? 'pending'] ?? '#D3D1C7';
  }
}