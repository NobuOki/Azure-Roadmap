import { Component, computed, signal, WritableSignal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

export type ModuleStatus = 'completed' | 'in-progress' | 'locked';
export interface Subtopic { name: string; status: 'done' | 'active' | 'pending'; }
export interface RoadmapModule {
  id: number; name: string; description: string;
  status: ModuleStatus; progress: number; subtopics: Subtopic[];
}

@Component({
  selector: 'app-az900-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './roadmap-final.component.html',
  styleUrl:    './roadmap-final.component.scss',
})
export class Az900DashboardComponent {

  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLDivElement>;

  // ── Stats ──────────────────────────────────────────────────────────────────
  studyHours  = signal(12);
  studyStreak = signal(8);

  // ── Zoom + Pan ─────────────────────────────────────────────────────────────
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

  // ══════════════════════════════════════════════════════════════════════════
  // JOINTS DEL MAPA CONCEPTUAL
  // ══════════════════════════════════════════════════════════════════════════
  joint1     = signal(true);    // L1: Conceptos de Nube
  joint2     = signal(false);   // L1: Arquitectura y servicios
  joint3     = signal(false);   // L1: Administración y Gobernanza
  jointAP    = signal(false);   // L2: Azure Policy → Definiciones
  jointCost  = signal(false);   // L2: Cost Management → Iniciativas
  joint2Sub  = signal(false);   // L2: Cómputo y Redes → Azure VMs
  joint3Sub1 = signal(false);   // L2: RBAC → Roles y Permisos

  toggleJoint(j: WritableSignal<boolean>): void { j.update(v => !v); }

  // ══════════════════════════════════════════════════════════════════════════
  // CONSTANTES DE LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Estas constantes definen el ritmo visual del mapa.
  // Cambiar un valor aquí ajusta todo el árbol automáticamente.
  //
  readonly NODE_H  = 40;  // altura de todos los nodos
  readonly CHIP_H  = 46;  // altura del main chip
  readonly J1_R    = 10;  // radio del joint L1
  readonly J2_R    = 8;   // radio del joint L2 (más pequeño = jerarquía)
  readonly N_TO_J  = 20;  // gap: nodo bottom → joint center
  readonly J_TO_C  = 12;  // gap: joint edge → primer hijo top
  readonly SIB_GAP = 12;  // gap: entre hermanos del mismo nivel
  readonly L1_GAP  = 16;  // gap: entre L1 branches

  // Posiciones X fijas (no cambian con el estado)
  readonly SPINE_X = 35;
  readonly L1_X    = 65;
  readonly L2_X    = 101;
  readonly L3_X    = 139;
  readonly L1_JCX  = 81;   // L1 joint center x = L1_X + 16
  readonly L2_JCX  = 119;  // L2 joint center x = L2_X + 18

  // ══════════════════════════════════════════════════════════════════════════
  // POSICIONES Y CALCULADAS (computed)
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Cada Y depende del estado de los joints anteriores.
  // Cuando un joint cambia, Angular recalcula automáticamente
  // todos los computed que dependen de él — efecto cascada.
  //
  // Estructura de dependencias:
  //   joint1 → yAP, yCost → apSubtreeBottom → yCost → b1SubBottom → yB2
  //   joint2 → yB2Sub → b2SubBottom → yB3
  //   joint3 → yB3Sub1, yB3Sub2 → b3SubBottom → svgHeight
  //

  // ── Chip ──────────────────────────────────────────────────────────────────
  chipBottom = computed(() => 20 + this.CHIP_H); // = 66, ancla fija

  // ── B1: Conceptos de Nube ─────────────────────────────────────────────────
  yB1  = computed(() => this.chipBottom() + 22); // = 88, primer branch siempre aquí
  cyJ1 = computed(() => this.yB1() + this.NODE_H + this.N_TO_J); // = 148

  // L2 de B1 — Azure Policy (near) y Cost Management (far)
  // En la pantalla: AP aparece primero (arriba), Cost después (abajo)
  yAP      = computed(() => this.cyJ1() + this.J1_R + this.J_TO_C); // = 170
  cyJAP    = computed(() => this.yAP() + this.NODE_H + this.N_TO_J); // = 230
  yAPNested= computed(() => this.cyJAP() + this.J2_R + this.J_TO_C); // = 250

  // Fondo del sub-árbol de AP (depende de si jointAP está abierto)
  apSubtreeBottom = computed(() =>
    this.jointAP()
      ? this.yAPNested() + this.NODE_H  // incluye nodo nested
      : this.cyJAP() + this.J2_R        // solo hasta el borde del joint
  );

  // Cost Management se posiciona DESPUÉS del sub-árbol de AP
  // → si AP se expande, Cost baja automáticamente
  yCost        = computed(() => this.apSubtreeBottom() + this.SIB_GAP);
  cyCostJ      = computed(() => this.yCost() + this.NODE_H + this.N_TO_J);
  yIniciativas = computed(() => this.cyCostJ() + this.J2_R + this.J_TO_C);

  // Fondo del sub-árbol completo de B1
  b1SubBottom = computed(() => {
    if (!this.joint1()) return this.cyJ1() + this.J1_R; // colapsado: solo joint
    if (this.jointCost()) return this.yIniciativas() + this.NODE_H;
    return this.cyCostJ() + this.J2_R;
  });

  // ── B2: Arquitectura y servicios ──────────────────────────────────────────
  // B2 se posiciona DESPUÉS del sub-árbol completo de B1
  // → si B1 se expande/colapsa, B2 sube o baja automáticamente
  yB2       = computed(() => this.b1SubBottom() + this.L1_GAP);
  cyJ2      = computed(() => this.yB2() + this.NODE_H + this.N_TO_J);
  yB2Sub    = computed(() => this.cyJ2() + this.J1_R + this.J_TO_C);
  cyJ2Sub   = computed(() => this.yB2Sub() + this.NODE_H + this.N_TO_J);
  yB2Nested = computed(() => this.cyJ2Sub() + this.J2_R + this.J_TO_C);

  b2SubBottom = computed(() => {
    if (!this.joint2()) return this.cyJ2() + this.J1_R;
    if (this.joint2Sub()) return this.yB2Nested() + this.NODE_H;
    return this.cyJ2Sub() + this.J2_R;
  });

  // ── B3: Administración y Gobernanza ───────────────────────────────────────
  // B3 se posiciona DESPUÉS del sub-árbol completo de B2
  yB3           = computed(() => this.b2SubBottom() + this.L1_GAP);
  cyJ3          = computed(() => this.yB3() + this.NODE_H + this.N_TO_J);
  yB3Sub1       = computed(() => this.cyJ3() + this.J1_R + this.J_TO_C);
  cyJ3Sub1      = computed(() => this.yB3Sub1() + this.NODE_H + this.N_TO_J);
  yB3Sub1Nested = computed(() => this.cyJ3Sub1() + this.J2_R + this.J_TO_C);

  // B3Sub1 sub-árbol bottom
  b3Sub1Bottom = computed(() =>
    this.joint3Sub1()
      ? this.yB3Sub1Nested() + this.NODE_H
      : this.cyJ3Sub1() + this.J2_R
  );

  // B3Sub2 (far) se posiciona DESPUÉS del sub-árbol de B3Sub1
  // → si B3Sub1 se expande, B3Sub2 baja automáticamente
  yB3Sub2 = computed(() => this.b3Sub1Bottom() + this.SIB_GAP);

  b3SubBottom = computed(() => {
    if (!this.joint3()) return this.cyJ3() + this.J1_R;
    return this.yB3Sub2() + this.NODE_H; // B3Sub2 siempre es el último
  });

  // ── SVG dimensions ────────────────────────────────────────────────────────
  svgHeight = computed(() => this.b3SubBottom() + 30); // padding inferior
  svgWidth  = 310; // ancho fijo (L3 max right edge ≈ 139+130=269, +40 padding)

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS DE PATH SVG
  // ══════════════════════════════════════════════════════════════════════════
  //
  // p(): genera el path L-shaped estándar (vertical + curva 90° + horizontal)
  //   (sx, sy) = punto de inicio (spine o joint center)
  //   (tx, ty) = left edge x del nodo destino, center y del nodo destino
  //
  // El patrón es siempre:
  //   M{sx} {sy}            → mover al origen
  //   L{sx} {ty-10}         → bajar verticalmente hasta justo antes de la curva
  //   M{sx} {ty-10}         → nuevo sub-path (evita artifacts en la curva)
  //   Q{sx} {ty} {sx+10} {ty} → curva Bézier cuadrática que gira 90°
  //   M{sx+10} {ty} L{tx} {ty} → línea horizontal hasta el nodo
  //
  private p(sx: number, sy: number, tx: number, ty: number): string {
    return [
      `M${sx} ${sy}`,
      `L${sx} ${ty - 10}`,
      `M${sx} ${ty - 10}`,
      `Q${sx} ${ty} ${sx + 10} ${ty}`,
      `M${sx + 10} ${ty}`,
      `L${tx} ${ty}`,
    ].join(' ');
  }

  // vp(): genera un path vertical recto (para joint connectors)
  //   conecta el bottom de un nodo con el center de su joint
  private vp(x: number, y1: number, y2: number): string {
    return `M${x} ${y1} L${x} ${y2}`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATHS CALCULADOS (computed)
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Cada path se recalcula cuando cambia el Y del nodo destino.
  // Todos usan center_y = node_top + NODE_H/2 = node_top + 20
  //

  // ── Main spine → L1 branches (orden: B3, B2, B1 para el efecto tricolor) ──
  pathToB3 = computed(() => this.p(this.SPINE_X, 66, this.L1_X, this.yB3() + 20));
  pathToB2 = computed(() => this.p(this.SPINE_X, 66, this.L1_X, this.yB2() + 20));
  pathToB1 = computed(() => this.p(this.SPINE_X, 66, this.L1_X, this.yB1() + 20));

  // ── Vertical connectors (nodo bottom → joint center) ──────────────────────
  pathJB1 = computed(() => this.vp(this.L1_JCX, this.yB1() + this.NODE_H, this.cyJ1()));
  pathJB2 = computed(() => this.vp(this.L1_JCX, this.yB2() + this.NODE_H, this.cyJ2()));
  pathJB3 = computed(() => this.vp(this.L1_JCX, this.yB3() + this.NODE_H, this.cyJ3()));

  // ── B1 sub-paths (L2) ─────────────────────────────────────────────────────
  // Cost (far) se dibuja PRIMERO, AP (near) se dibuja DESPUÉS
  // → mismo principio del efecto tricolor pero en el sub-árbol
  pathToCost = computed(() => this.p(this.L1_JCX, this.cyJ1(), this.L2_X, this.yCost() + 20));
  pathToAP   = computed(() => this.p(this.L1_JCX, this.cyJ1(), this.L2_X, this.yAP() + 20));
  pathJAP    = computed(() => this.vp(this.L2_JCX, this.yAP() + this.NODE_H, this.cyJAP()));
  pathJCost  = computed(() => this.vp(this.L2_JCX, this.yCost() + this.NODE_H, this.cyCostJ()));

  // ── B1 sub-paths (L3, dotted) ─────────────────────────────────────────────
  pathToAPNested    = computed(() => this.p(this.L2_JCX, this.cyJAP(), this.L3_X, this.yAPNested() + 20));
  pathToIniciativas = computed(() => this.p(this.L2_JCX, this.cyCostJ(), this.L3_X, this.yIniciativas() + 20));

  // ── B2 sub-paths ──────────────────────────────────────────────────────────
  pathToB2Sub   = computed(() => this.p(this.L1_JCX, this.cyJ2(), this.L2_X, this.yB2Sub() + 20));
  pathJB2Sub    = computed(() => this.vp(this.L2_JCX, this.yB2Sub() + this.NODE_H, this.cyJ2Sub()));
  pathToB2Nested= computed(() => this.p(this.L2_JCX, this.cyJ2Sub(), this.L3_X, this.yB2Nested() + 20));

  // ── B3 sub-paths ──────────────────────────────────────────────────────────
  // Sub2 (far) primero, Sub1 (near) después
  pathToB3Sub2       = computed(() => this.p(this.L1_JCX, this.cyJ3(), this.L2_X, this.yB3Sub2() + 20));
  pathToB3Sub1       = computed(() => this.p(this.L1_JCX, this.cyJ3(), this.L2_X, this.yB3Sub1() + 20));
  pathJB3Sub1        = computed(() => this.vp(this.L2_JCX, this.yB3Sub1() + this.NODE_H, this.cyJ3Sub1()));
  pathToB3Sub1Nested = computed(() => this.p(this.L2_JCX, this.cyJ3Sub1(), this.L3_X, this.yB3Sub1Nested() + 20));

  // ══════════════════════════════════════════════════════════════════════════
  // ROADMAP MODULES
  // ══════════════════════════════════════════════════════════════════════════
  modules = signal<RoadmapModule[]>([
    {
      id: 1, name: 'Cloud Concepts', description: 'IaaS, PaaS, SaaS · Modelos de nube',
      status: 'completed', progress: 100,
      subtopics: [
        { name: 'Beneficios de la nube',    status: 'done' },
        { name: 'Modelos de servicio',       status: 'done' },
        { name: 'Modelos de implementación', status: 'done' },
      ],
    },
    {
      id: 2, name: 'Azure Architecture', description: 'Regions, Zones, Resource Groups',
      status: 'completed', progress: 85,
      subtopics: [
        { name: 'Regiones y zonas',       status: 'done'   },
        { name: 'Resource Groups',        status: 'done'   },
        { name: 'Azure Resource Manager', status: 'active' },
      ],
    },
    {
      id: 3, name: 'Azure Services', description: 'Compute, Storage, Networking',
      status: 'in-progress', progress: 60,
      subtopics: [
        { name: 'Azure Policy',    status: 'done'    },
        { name: 'Cost Management', status: 'active'  },
        { name: 'Iniciativas',     status: 'pending' },
      ],
    },
    {
      id: 4, name: 'Security & Identity', description: 'AAD, RBAC, Zero Trust',
      status: 'locked', progress: 0,
      subtopics: [
        { name: 'Azure Active Directory', status: 'pending' },
        { name: 'RBAC',                   status: 'pending' },
        { name: 'Zero Trust',             status: 'pending' },
      ],
    },
    {
      id: 5, name: 'Pricing & Governance', description: 'SLA, TCO, Azure Policy',
      status: 'locked', progress: 0,
      subtopics: [
        { name: 'Calculadora de precios', status: 'pending' },
        { name: 'TCO Calculator',         status: 'pending' },
        { name: 'SLA y ciclo de vida',    status: 'pending' },
      ],
    },
  ]);

  selectedModuleId = signal<number>(3);
  selectedModule   = computed(() => this.modules().find(m => m.id === this.selectedModuleId()) ?? this.modules()[2]);
  overallProgress  = computed(() => Math.round(this.modules().reduce((s, m) => s + m.progress, 0) / this.modules().length));
  activeModulesCount = computed(() => this.modules().filter(m => m.status !== 'locked').length);
  ringOffset       = computed(() => { const c = 2 * Math.PI * 32; return c - (this.overallProgress() / 100) * c; });

  selectModule(module: RoadmapModule): void {
    if (module.status !== 'locked') this.selectedModuleId.set(module.id);
  }
}