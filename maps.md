src/app/
│
├── core/
│   └── models/
│       ├── map-node.model.ts      ← interfaces y tipos
│       └── roadmap-module.model.ts
│
├── features/
│   └── az900/
│       ├── az900.component.ts     ← componente raíz del feature
│       ├── az900.component.html
│       │
│       ├── components/            ← sub-componentes
│       │   ├── conceptual-map/
│       │   │   ├── conceptual-map.component.ts
│       │   │   ├── conceptual-map.component.html
│       │   │   └── conceptual-map.component.scss
│       │   │
│       │   ├── roadmap-card/
│       │   │   ├── roadmap-card.component.ts
│       │   │   └── roadmap-card.component.html
│       │   │
│       │   └── sidebar/
│       │       ├── sidebar.component.ts
│       │       └── sidebar.component.html
│       │
│       └── data/
│           └── az900.data.ts      ← datos hardcodeados por ahora
│                                     (aquí conectas el JSON después)
│
└── shared/
    └── components/               ← si algo se reutiliza en el futuro


src/app/
│
├── core/
│   ├── models/                          ✅ Paso 1
│   │   ├── map-node.model.ts
│   │   ├── dashboard.model.ts
│   │   └── index.ts
│   │
│   └── services/                        ⬅ Paso 3
│       └── dashboard.service.ts
│
├── features/
│   └── az900/
│       ├── data/                        ✅ Paso 2
│       │   └── az900.data.ts
│       │
│       ├── components/                  ⬅ Paso 4 y 5
│       │   ├── conceptual-map/
│       │   │   ├── conceptual-map.component.ts
│       │   │   ├── conceptual-map.component.html
│       │   │   ├── conceptual-map.component.scss
│       │   │   └── map-node/            ⬅ Paso 5 (recursivo)
│       │   │       ├── map-node.component.ts
│       │   │       └── map-node.component.html
│       │   │
│       │   ├── roadmap-card/
│       │   │   ├── roadmap-card.component.ts
│       │   │   └── roadmap-card.component.html
│       │   │
│       │   └── sidebar/
│       │       ├── sidebar.component.ts
│       │       └── sidebar.component.html
│       │
│       ├── az900.component.ts           ⬅ Paso 6 (componente raíz)
│       └── az900.component.html
│
└── shared/                              ⬅ futuro
    └── components/



AZ-900
├── Conceptos de Nube (blue)
│     ├── Fundamentos de la Nube → 3 unidades (todas done)
│     ├── Azure Policy           → 2 unidades (1 done, 1 in-progress)
│     └── Cost Management        → 2 unidades (1 in-progress, 1 pending)
│
├── Arquitectura y Servicios (purple)
│     ├── Arquitectura Azure     → 3 unidades (2 done, 1 pending)
│     └── Cómputo y Redes        → 3 unidades (todas pending)
│
└── Administración y Gobernanza (pink)
      ├── Seguridad e Identidad  → 3 unidades (todas pending)
      └── Cumplimiento           → 2 unidades (todas pending)

Paso 1 — Interfaces ✅ core/models/
     Definir la forma de los datos: MapNode, Module, Course, Session
Paso 2 — Data ✅ features/az900/data/
    - Datos del AZ-900 hardcodeados usando las interfaces
Paso 3 — Servicio ⬅ estamos aquí
    - DashboardService que lee/escribe localStorage con métodos separados
Paso 4 — Separar componentes
    - Dividir el componente monolítico en conceptual-map, roadmap-card y sidebar
Paso 5 — MapNode recursivo
    - map-node.component que se llama a sí mismo para renderizar el árbol dinámicamente
Paso 6 — Conectar todo
    - El componente raíz consume el servicio, HTML limpio, sin datos hardcodeados


# ── Paso 1: Interfaces ─────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "src/app/core/models"
New-Item -ItemType File -Force -Path "src/app/core/models/map-node.model.ts"
New-Item -ItemType File -Force -Path "src/app/core/models/dashboard.model.ts"
New-Item -ItemType File -Force -Path "src/app/core/models/index.ts"

# ── Paso 2: Data ───────────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "src/app/features/az900/data"
New-Item -ItemType File -Force -Path "src/app/features/az900/data/az900.data.ts"

# ── Paso 3: Servicio ───────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "src/app/core/services"
New-Item -ItemType File -Force -Path "src/app/core/services/dashboard.service.ts"

# ── Paso 4: Componentes ────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "src/app/features/az900"
New-Item -ItemType File -Force -Path "src/app/features/az900/az900.component.ts"
New-Item -ItemType File -Force -Path "src/app/features/az900/az900.component.html"

New-Item -ItemType Directory -Force -Path "src/app/features/az900/components/conceptual-map"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/conceptual-map/conceptual-map.component.ts"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/conceptual-map/conceptual-map.component.html"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/conceptual-map/conceptual-map.component.scss"

New-Item -ItemType Directory -Force -Path "src/app/features/az900/components/roadmap-card"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/roadmap-card/roadmap-card.component.ts"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/roadmap-card/roadmap-card.component.html"

New-Item -ItemType Directory -Force -Path "src/app/features/az900/components/sidebar"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/sidebar/sidebar.component.ts"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/sidebar/sidebar.component.html"

# ── Paso 5: MapNode recursivo (preparado para el siguiente paso) ───────────
New-Item -ItemType Directory -Force -Path "src/app/features/az900/components/conceptual-map/map-node"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/conceptual-map/map-node/map-node.component.ts"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/conceptual-map/map-node/map-node.component.html"

# ── Shared (para el futuro) ────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "src/app/shared/components"



src/app/
│
├── core/
│   ├── models/                                    ✅ Paso 1
│   │   ├── map-node.model.ts
│   │   ├── dashboard.model.ts
│   │   └── index.ts
│   │
│   └── services/                                  ✅ Paso 3
│       └── dashboard.service.ts
│
├── features/
│   └── az900/
│       ├── data/                                  ✅ Paso 2
│       │   └── az900.data.ts
│       │
│       ├── components/                            ✅ Paso 4 y 5
│       │   │
│       │   ├── conceptual-map/                    ✅ Paso 4 y 5
│       │   │   ├── conceptual-map.component.ts
│       │   │   ├── conceptual-map.component.html
│       │   │   ├── conceptual-map.component.scss
│       │   │   │
│       │   │   └── map-node/                      ✅ Paso 5 ← aquí
│       │   │       ├── map-node.component.ts
│       │   │       └── map-node.component.html
│       │   │
│       │   ├── roadmap-card/                      ✅ Paso 4
│       │   │   ├── roadmap-card.component.ts
│       │   │   └── roadmap-card.component.html
│       │   │
│       │   └── sidebar/                           ✅ Paso 4
│       │       ├── sidebar.component.ts
│       │       └── sidebar.component.html
│       │
│       ├── az900.component.ts                     ✅ Paso 4
│       └── az900.component.html                   ✅ Paso 4
│
└── shared/                                        ⬅ futuro
    └── components/

    

# ── map-node (sub-componente de conceptual-map) ────────────────────────────
New-Item -ItemType Directory -Force -Path "src/app/features/az900/components/conceptual-map/map-node"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/conceptual-map/map-node/map-node.component.ts"
New-Item -ItemType File -Force -Path "src/app/features/az900/components/conceptual-map/map-node/map-node.component.html"