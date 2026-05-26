// ─────────────────────────────────────────────────────────────────────────────
// conceptual-map.component.ts — Paso 5
//
// Responsabilidades:
//   1. Zoom + Pan del canvas
//   2. Estado de expansión de cada nodo (qué joints están abiertos)
//   3. Algoritmo de layout: calcula posiciones Y dinámicas para todo el árbol
//   4. Expone el layout calculado al template para renderizar con @for
//
// Ubicación: src/app/features/az900/components/conceptual-map/
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, computed, signal, ElementRef, ViewChild } from '@angular/core';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { Branch, Module, Unit } from '../../../../core/models';

// ── View model interfaces (solo para renderizado, no son domain models) ──────

export interface RenderedNode {
  id:          string;
  label:       string;
  level:       0 | 1 | 2 | 3;     // 0=chip, 1=branch, 2=module, 3=unit
  colorKey:    string | null;      // 'blue' | 'purple' | 'pink' | null
  x:           number;
  y:           number;
  centerY:     number;
  width:       number;
  height:      number;             // 46 para chip, 40 para el resto
  hasChildren: boolean;
  status?:     string;             // solo para units: 'done'|'in-progress'|'pending'
}

export interface RenderedPath {
  d:      string;
  color:  string;
  dashed: boolean;
}

export interface RenderedJoint {
  nodeId: string;   // id del nodo al que pertenece este joint
  cx:     number;
  cy:     number;
  color:  string;
  radius: number;
}

export interface MapLayout {
  nodes:     RenderedNode[];
  paths:     RenderedPath[];
  joints:    RenderedJoint[];
  svgHeight: number;
  svgWidth:  number;
}

// ── Componente ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-conceptual-map',
  standalone: true,
  imports: [],
  templateUrl: './conceptual-map.component.html',
})
export class ConceptualMapComponent {

  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLDivElement>;

  private readonly svc = inject(DashboardService);

  // ── Datos del mapa (viene del servicio) ───────────────────────────────────
  readonly map = this.svc.map;

  // ══════════════════════════════════════════════════════════════════════════
  // CONSTANTES DE LAYOUT
  // Ajusta estos valores para modificar el ritmo visual del mapa
  // ══════════════════════════════════════════════════════════════════════════
  private readonly C = {
    CHIP_Y:  20, CHIP_H: 46,
    NODE_H:  40,
    J1_R:    10,    // radio joint L1
    J2_R:    8,     // radio joint L2
    N_TO_J:  20,    // nodo bottom → joint center
    J_TO_C:  12,    // joint edge → primer hijo top
    SIB_GAP: 12,    // entre hermanos del mismo nivel
    L1_GAP:  16,    // entre branches L1
    SPINE_X: 35,
    L1_X:    65,  L1_JCX: 81,
    L2_X:    101, L2_JCX: 119,
    L3_X:    139,
    L1_W:    180,   // ancho fijo de branches L1
    L2_W:    155,   // ancho fijo de modules L2
    L3_W:    130,   // ancho fijo de units L3
    CHIP_W:  200,
  };

  // Mapa de colores: BranchColor → RGB string para SVG
  private readonly COLORS: Record<string, string> = {
    blue:   'rgb(64,112,255)',
    purple: 'rgb(161,121,242)',
    pink:   'rgb(247,87,140)',
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADO DE EXPANSIÓN
  // Record<nodeId, boolean> — true = expandido, false = colapsado
  // ══════════════════════════════════════════════════════════════════════════
  private expansion = signal<Record<string, boolean>>({
    b1: true, // branch 1 expandido por defecto al cargar
  });

  isExpanded(id: string): boolean {
    return this.expansion()[id] ?? false;
  }

  toggleNode(id: string): void {
    this.expansion.update(state => ({ ...state, [id]: !state[id] }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LAYOUT CALCULADO
  // Se recalcula automáticamente cuando cambia:
  //   - expansion (usuario hace click en un joint)
  //   - map (datos del servicio cambian)
  // ══════════════════════════════════════════════════════════════════════════
  layout = computed(() => this.buildLayout());

  // ══════════════════════════════════════════════════════════════════════════
  // ALGORITMO DE LAYOUT
  // Recorre el árbol y calcula posiciones X, Y para cada nodo y path.
  // Retorna listas planas que el template renderiza con @for.
  // ══════════════════════════════════════════════════════════════════════════
  private buildLayout(): MapLayout {
    const map  = this.map();
    const exp  = this.expansion();
    const C    = this.C;
    const COL  = this.COLORS;

    const nodes:  RenderedNode[]  = [];
    const paths:  RenderedPath[]  = [];
    const joints: RenderedJoint[] = [];

    const chipBottom = C.CHIP_Y + C.CHIP_H; // = 66

    // ── Helpers de path SVG ───────────────────────────────────────────────
    // L-shaped: vertical → curva 90° → horizontal
    const lpath = (sx: number, sy: number, tx: number, ty: number): string =>
      `M${sx} ${sy} L${sx} ${ty-10} M${sx} ${ty-10} Q${sx} ${ty} ${sx+10} ${ty} M${sx+10} ${ty} L${tx} ${ty}`;

    // Vertical recto: nodo bottom → joint center
    const vpath = (x: number, y1: number, y2: number): string =>
      `M${x} ${y1} L${x} ${y2}`;

    // ── Nodo raíz (Main Chip) ─────────────────────────────────────────────
    nodes.push({
      id: 'root', label: map.title, level: 0,
      colorKey: null, x: C.CHIP_Y, y: C.CHIP_Y,
      centerY: C.CHIP_Y + C.CHIP_H / 2,
      width: C.CHIP_W, height: C.CHIP_H,
      hasChildren: true,
    });

    // ── Paso 1: calcular posiciones Y de todo el árbol ────────────────────
    // Necesitamos los centerY de los branches ANTES de dibujar los paths
    // (el path al branch más lejano se dibuja primero)

    let currentY = chipBottom;

    interface BranchLayout {
      branch:     Branch;
      y:          number;
      centerY:    number;
      bottom:     number;
      jointCy:    number;
      color:      string;
      fullBottom: number;
      mods: {
        mod:        Module;
        y:          number;
        centerY:    number;
        bottom:     number;
        jointCy:    number;
        fullBottom: number;
        units: { unit: Unit; y: number; centerY: number }[];
      }[];
    }

    const branchLayouts: BranchLayout[] = [];

    for (const branch of map.branches) {
      const bY       = currentY + C.L1_GAP;
      const bCenterY = bY + C.NODE_H / 2;
      const bBottom  = bY + C.NODE_H;
      const bJointCy = bBottom + C.N_TO_J;
      const color    = COL[branch.color] ?? COL['blue'];

      const mods: BranchLayout['mods'] = [];
      let subtreeBottom = bJointCy + C.J1_R;

      if (exp[branch.id]) {
        let modY = bJointCy + C.J1_R + C.J_TO_C;

        for (const mod of branch.modules) {
          const mCenterY = modY + C.NODE_H / 2;
          const mBottom  = modY + C.NODE_H;
          const mJointCy = mBottom + C.N_TO_J;

          const units: BranchLayout['mods'][0]['units'] = [];
          let modSubBottom = mJointCy + C.J2_R;

          if (exp[mod.id]) {
            let unitY = mJointCy + C.J2_R + C.J_TO_C;
            for (const unit of mod.units) {
              units.push({ unit, y: unitY, centerY: unitY + C.NODE_H / 2 });
              unitY += C.NODE_H + C.SIB_GAP;
            }
            modSubBottom = unitY - C.SIB_GAP;
          }

          mods.push({ mod, y: modY, centerY: mCenterY, bottom: mBottom, jointCy: mJointCy, fullBottom: modSubBottom, units });
          modY = modSubBottom + C.SIB_GAP;
          subtreeBottom = modY - C.SIB_GAP;
        }
      }

      branchLayouts.push({ branch, y: bY, centerY: bCenterY, bottom: bBottom, jointCy: bJointCy, color, fullBottom: subtreeBottom, mods });
      currentY = subtreeBottom;
    }

    // ── Paso 2: dibujar paths de spine (far primero → near último) ────────
    // Esto crea el efecto de color por sección sin gradiente
    for (let i = branchLayouts.length - 1; i >= 0; i--) {
      const bl = branchLayouts[i];
      paths.push({ d: lpath(C.SPINE_X, chipBottom, C.L1_X, bl.centerY), color: bl.color, dashed: false });
    }

    // ── Paso 3: renderizar nodos, joints y sub-paths (forward) ───────────
    for (const bl of branchLayouts) {
      const { branch, y, centerY, bottom, jointCy, color, mods } = bl;

      // Branch node (L1)
      nodes.push({ id: branch.id, label: branch.label, level: 1, colorKey: branch.color, x: C.L1_X, y, centerY, width: C.L1_W, height: C.NODE_H, hasChildren: branch.modules.length > 0 });

      // Conector vertical: branch bottom → joint L1
      paths.push({ d: vpath(C.L1_JCX, bottom, jointCy), color, dashed: false });

      // Joint L1
      joints.push({ nodeId: branch.id, cx: C.L1_JCX, cy: jointCy, color, radius: C.J1_R });

      if (exp[branch.id] && mods.length > 0) {

        // Paths a módulos (far primero, near último)
        for (let mi = mods.length - 1; mi >= 0; mi--) {
          paths.push({ d: lpath(C.L1_JCX, jointCy, C.L2_X, mods[mi].centerY), color, dashed: false });
        }

        // Nodos de módulos, joints y unidades (forward)
        for (const { mod, y: mY, centerY: mCY, bottom: mBtm, jointCy: mJCy, units } of mods) {

          // Module node (L2)
          nodes.push({ id: mod.id, label: mod.label, level: 2, colorKey: branch.color, x: C.L2_X, y: mY, centerY: mCY, width: C.L2_W, height: C.NODE_H, hasChildren: mod.units.length > 0 });

          // Conector vertical: module bottom → joint L2
          paths.push({ d: vpath(C.L2_JCX, mBtm, mJCy), color, dashed: false });

          // Joint L2
          joints.push({ nodeId: mod.id, cx: C.L2_JCX, cy: mJCy, color, radius: C.J2_R });

          if (exp[mod.id] && units.length > 0) {

            // Paths a unidades (far primero, near último, punteados)
            for (let ui = units.length - 1; ui >= 0; ui--) {
              paths.push({ d: lpath(C.L2_JCX, mJCy, C.L3_X, units[ui].centerY), color, dashed: true });
            }

            // Unit nodes (L3)
            for (const { unit, y: uY, centerY: uCY } of units) {
              nodes.push({ id: unit.id, label: unit.label, level: 3, colorKey: branch.color, x: C.L3_X, y: uY, centerY: uCY, width: C.L3_W, height: C.NODE_H, hasChildren: false, status: unit.status });
            }
          }
        }
      }
    }

    return {
      nodes, paths, joints,
      svgHeight: currentY + 30,
      svgWidth:  C.L3_X + C.L3_W + 20,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS DE ESTILO para el template
  // ══════════════════════════════════════════════════════════════════════════

  // Estilos inline para cada nivel de nodo (dentro de foreignObject)
  getNodeStyle(node: RenderedNode): string {
    const base = 'width:100%;height:100%;display:flex;align-items:center;box-sizing:border-box;font-family:system-ui,sans-serif;';

    const colorMap: Record<string, string> = {
      blue: 'rgb(64,112,255)', purple: 'rgb(161,121,242)', pink: 'rgb(247,87,140)',
    };

    const c = node.colorKey ? colorMap[node.colorKey] : '#00bcff';

    switch (node.level) {
      case 0:
        return `${base}justify-content:center;border-radius:18px;border:3px solid #00bcff;background:white;`;
      case 1:
        return `${base}padding:0 14px;border-radius:13px;background:${c};cursor:pointer;`;
      case 2:
        return `${base}padding:0 12px;border-radius:13px;background:white;border:4px solid ${c};cursor:pointer;`;
      case 3:
        return `${base}padding:0 12px;border-radius:13px;background:white;border:2px dotted ${c};`;
      default:
        return base;
    }
  }

  getTextStyle(node: RenderedNode): string {
    switch (node.level) {
      case 0: return 'font-size:15px;font-weight:bold;color:#3d474d;letter-spacing:-0.02em;';
      case 1: return 'font-size:13px;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      case 2: return 'font-size:12px;color:#3d474d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      case 3: return 'font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      default: return '';
    }
  }

  // Color del dot de estado para units (L3)
  getStatusDot(status: string | undefined): string {
    return { done: '#0F6E56', 'in-progress': '#185FA5', pending: '#D3D1C7' }[status ?? 'pending'] ?? '#D3D1C7';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ZOOM + PAN (sin cambios)
  // ══════════════════════════════════════════════════════════════════════════
  zoom = signal(0.8);
  panX = signal(0);
  panY = signal(0);
  isDragging    = signal(false);
  private dragStartX = 0;
  private dragStartY = 0;
  private panStartX  = 0;
  private panStartY  = 0;

  mapTransform = computed(() =>
    `scale(${this.zoom()}) translate(${this.panX()}px, ${this.panY()}px)`
  );

  private readonly ZOOM_STEP = 0.1;
  private readonly ZOOM_MIN  = 0.3;
  private readonly ZOOM_MAX  = 2.0;

  zoomIn():  void { this.zoom.update(z => Math.min(this.ZOOM_MAX, +(z + this.ZOOM_STEP).toFixed(2))); }
  zoomOut(): void { this.zoom.update(z => Math.max(this.ZOOM_MIN, +(z - this.ZOOM_STEP).toFixed(2))); }

  onWheel(e: WheelEvent): void {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const d = e.deltaY > 0 ? -this.ZOOM_STEP : this.ZOOM_STEP;
    this.zoom.update(z => Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, +(z + d).toFixed(2))));
  }

  onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging.set(true);
    this.dragStartX = e.clientX; this.dragStartY = e.clientY;
    this.panStartX  = this.panX(); this.panStartY  = this.panY();
  }

  onMouseMove(e: MouseEvent): void {
    if (!this.isDragging()) return;
    this.panX.set(this.panStartX + (e.clientX - this.dragStartX) / this.zoom());
    this.panY.set(this.panStartY + (e.clientY - this.dragStartY) / this.zoom());
  }

  onMouseUp(): void { this.isDragging.set(false); }

  resetCanvas(): void { this.zoom.set(0.8); this.panX.set(0); this.panY.set(0); }
}