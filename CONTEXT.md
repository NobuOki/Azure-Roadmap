# CONTEXT.md — Azure Roadmap Dashboard
> Documento de contexto técnico para continuar el proyecto en cualquier chat o IA.
> Última actualización: Paso 6 completado — arquitectura conectada y funcional.

---

## ¿Qué es este proyecto?

Dashboard de aprendizaje personal construido con **Angular 17+ y Tailwind CSS**.
Nació de la necesidad de trackear el progreso en el curso **Azure AZ-900** de Microsoft.
Diseñado como **molde genérico** — funciona para cualquier curso o tema de estudio.

**Stack:**
- Angular 17+ (Signals API, standalone components, `@if`, `@for`)
- Tailwind CSS v3 + PostCSS
- SVG con `foreignObject` para el mapa conceptual
- `localStorage` como persistencia (preparado para API real)

---

## Estructura de carpetas

```
src/app/
├── core/
│   ├── models/
│   │   ├── map-node.model.ts      ← interfaces del árbol del mapa
│   │   ├── dashboard.model.ts     ← CourseInfo, StudySession, DashboardState
│   │   └── index.ts               ← barrel export
│   └── services/
│       └── dashboard.service.ts   ← servicio central con localStorage + computed
│
├── features/
│   └── az900/
│       ├── data/
│       │   └── az900.data.ts      ← datos hardcodeados del AZ-900
│       ├── components/
│       │   ├── conceptual-map/
│       │   │   ├── conceptual-map.component.ts   ← algoritmo de layout + zoom/pan
│       │   │   ├── conceptual-map.component.html ← SVG dinámico con @for
│       │   │   └── map-node/
│       │   │       ├── map-node.component.ts     ← nodo presentacional (futuro uso)
│       │   │       └── map-node.component.html
│       │   ├── roadmap-card/
│       │   │   ├── roadmap-card.component.ts
│       │   │   └── roadmap-card.component.html
│       │   └── sidebar/
│       │       ├── sidebar.component.ts
│       │       └── sidebar.component.html
│       ├── az900.component.ts     ← componente raíz del feature
│       └── az900.component.html
│
└── shared/                        ← vacío, para futuro uso
```

---

## Modelo de datos

### Árbol del mapa (3 niveles fijos)
```typescript
// map-node.model.ts
type UnitStatus  = 'pending' | 'in-progress' | 'done';
type BranchColor = 'blue' | 'purple' | 'pink';

interface Unit   { id: string; label: string; status: UnitStatus; }
interface Module { id: string; label: string; units: Unit[]; }
interface Branch { id: string; label: string; color: BranchColor; modules: Module[]; }
interface ConceptualMap { title: string; branches: Branch[]; }
```

**Regla clave:** el progreso NO se guarda — se calcula en cascada:
```
Unit.status → calcUnitProgress() → calcModuleProgress() → calcBranchProgress() → overallProgress
```

### Estado del dashboard
```typescript
// dashboard.model.ts
interface DashboardState {
  course:   CourseInfo;      // → GET /api/course/{id}     (futuro)
  map:      ConceptualMap;   // → GET /api/map/{courseId}  (futuro)
  sessions: StudySession[];  // → GET /api/sessions/{id}   (futuro)
}
```

---

## Servicio central

```typescript
// dashboard.service.ts — patrón clave
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private _map = signal<ConceptualMap>(this.loadMap());
  readonly map  = this._map.asReadonly(); // componentes leen, no modifican

  // Computed automáticos
  overallProgress    = computed(() => /* promedio de branches */);
  totalStudyHours    = computed(() => /* suma sessions / 60 */);
  studyStreak        = computed(() => /* días consecutivos */);
  activeModulesCount = computed(() => /* branches con progreso > 0 */);

  // Único punto de entrada para modificar progreso
  updateUnitStatus(unitId: string, status: UnitStatus): void { ... }

  // localStorage → reemplazar por http.get() cuando haya API
  private loadMap(): ConceptualMap {
    const raw = localStorage.getItem('dashboard_map');
    return raw ? JSON.parse(raw) : AZ900_DEFAULT_STATE.map;
  }
}
```

---

## Mapa conceptual — cómo funciona

### SVG con foreignObject
Todos los elementos (paths, joints, nodos HTML) viven en **un solo SVG**.
Los nodos HTML se embeben con `<foreignObject>` — garantiza coordinadas exactas.

### Algoritmo de layout dinámico
```typescript
// conceptual-map.component.ts
private expansion = signal<Record<string, boolean>>({ b1: true });
layout = computed(() => this.buildLayout()); // se recalcula al expandir/colapsar

// buildLayout() retorna listas planas:
interface MapLayout {
  paths:     RenderedPath[];   // SVG paths (L-shaped + verticales)
  joints:    RenderedJoint[];  // círculos interactivos
  nodes:     RenderedNode[];   // nodos con x, y, width calculados
  svgHeight: number;           // crece/encoge según el árbol
  svgWidth:  number;
}
```

### Orden de dibujo SVG (efecto spine tricolor)
```
Branch más lejano (B3 pink)   → dibujado PRIMERO (queda debajo)
Branch intermedio (B2 purple) → dibujado SEGUNDO (tapa el pink arriba)
Branch más cercano (B1 blue)  → dibujado ÚLTIMO  (queda encima)
```
Mismo principio se repite en sub-niveles.

### Paths SVG — dos tipos
```typescript
// L-shaped: vertical → curva 90° → horizontal (spine a nodo)
`M${sx} ${sy} L${sx} ${ty-10} M${sx} ${ty-10} Q${sx} ${ty} ${sx+10} ${ty} M${sx+10} ${ty} L${tx} ${ty}`

// Vertical recto: nodo bottom → joint center
`M${x} ${y1} L${x} ${y2}`
```

### Posiciones X fijas por nivel
```
Spine:   x=35
L1:      x=65   joint cx=81
L2:      x=101  joint cx=119
L3:      x=139
```

### Posiciones Y dinámicas (computed en cascada)
```
B2.y = b1SubtreeBottom + L1_GAP
B3.y = b2SubtreeBottom + L1_GAP
// Si B1 se expande → B2 y B3 bajan automáticamente
```

---

## Comunicación entre componentes

```
DashboardService (singleton)
  ↑ inject()
  ├── Az900Component        → orquesta layout + selectedBranchId signal
  │     ├── ConceptualMapComponent  → zoom/pan + layout del mapa
  │     ├── RoadmapCardComponent    → lista branches, emite branchSelected
  │     └── SidebarComponent       ← recibe selectedBranchId como input
```

**Regla:** el template nunca accede al servicio directamente.
El componente expone solo las propiedades que el template necesita:
```typescript
// ✅ correcto
readonly overallProgress = this.svc.overallProgress; // expuesto
private readonly svc = inject(DashboardService);      // privado
```

---

## Tailwind — convenciones usadas

```html
<!-- Valor arbitrario cuando no existe clase predefinida -->
border-[3px]           → border-width: 3px
grid-cols-[1fr_220px]  → grid-template-columns: 1fr 220px
left-[10px]            → left: 10px

<!-- Clases dinámicas con [ngClass] → deben estar en safelist del tailwind.config -->
[ngClass]="{ 'bg-teal-50': status === 'completed' }"
```

**SCSS residual** (solo 3 cosas que Tailwind no puede):
```scss
.border        { border-width: 0.5px !important; } // Tailwind mínimo = 1px
.ring-transition { transition: stroke-dashoffset 0.6s ease; } // propiedad SVG
```

---

## localStorage — claves

```typescript
const STORAGE_KEYS = {
  course:   'dashboard_course',
  map:      'dashboard_map',
  sessions: 'dashboard_sessions',
};
// Una clave por "endpoint" → preparado para reemplazar con API real
```

---

## Lo que falta por hacer (próximos pasos)

1. **Formulario de actualización de progreso**
   El usuario puede marcar unidades como done/in-progress desde la UI.
   Usar `DashboardService.updateUnitStatus(unitId, status)` — ya está implementado.

2. **Registro de sesiones de estudio**
   Formulario para agregar tiempo estudiado por nodo.
   Usar `DashboardService.addSession(nodeId, durationMins)` — ya está implementado.

3. **Stat cards dinámicas**
   `totalStudyHours`, `studyStreak`, `activeModulesCount` ya son computed en el servicio.
   Solo falta conectarlas al template con sesiones reales.

4. **Soporte multi-curso**
   Crear `aws.data.ts`, `kubernetes.data.ts` etc. con la misma estructura.
   El dashboard se adapta automáticamente sin cambiar HTML.

5. **API real**
   Reemplazar `localStorage.getItem()` por `this.http.get()` en el servicio.
   El resto del código no cambia.

6. **Animaciones del mapa**
   `stroke-dashoffset` para animar los paths al expandir joints.
   `translateX + opacity` para los nodos al aparecer.

---

## Prompt para continuar en otro chat

```
Estoy desarrollando un dashboard de aprendizaje en Angular 17+ y Tailwind CSS
llamado "Azure Roadmap Dashboard". El proyecto está funcional con esta arquitectura:

STACK: Angular 17+ (Signals, standalone), Tailwind CSS v3, SVG con foreignObject, localStorage

ESTRUCTURA:
- core/models/ → interfaces: Unit, Module, Branch, ConceptualMap, DashboardState
- core/services/dashboard.service.ts → servicio con signals, computed y localStorage
- features/az900/data/az900.data.ts → datos del curso AZ-900
- features/az900/components/conceptual-map/ → mapa SVG dinámico con zoom/pan
- features/az900/components/roadmap-card/ → lista de branches con progreso
- features/az900/components/sidebar/ → anillo de progreso + detalle del branch
- features/az900/az900.component → componente raíz orquestador

LO QUE YA FUNCIONA:
- Mapa conceptual SVG con foreignObject, zoom, pan y drag
- Spine central tricolor que se auto-ajusta al expandir/colapsar nodos
- Joints interactivos con estado visual (relleno=colapsado, vacío=expandido)
- Progreso calculado en cascada: Unit.status → Module → Branch → overall
- localStorage con claves separadas: dashboard_course, dashboard_map, dashboard_sessions
- Algoritmo de layout dinámico con posiciones Y calculadas con computed()
- Comunicación entre componentes: service (privado) → propiedades públicas → template

CONVENCIONES CLAVE:
- El template nunca accede al servicio directamente
- El progreso no se guarda, se calcula con computed()
- Orden de dibujo SVG: far primero, near último (efecto tricolor)
- Valores arbitrarios Tailwind: border-[3px], grid-cols-[1fr_220px]
- @if y @for (Angular 17+, NO *ngIf/*ngFor)
- input() y output() modernos (NO @Input/@Output decorators)

PRÓXIMO PASO A DESARROLLAR:
[describe aquí qué quieres hacer a continuación]

El archivo CONTEXT.md en la raíz del proyecto tiene toda la documentación detallada.
```

---

*Este archivo debe actualizarse cada vez que se completa una etapa significativa del proyecto.*
