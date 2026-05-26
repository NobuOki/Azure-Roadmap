// ─────────────────────────────────────────────────────────────────────────────
// map-node.model.ts
//
// Define la estructura del árbol del mapa conceptual.
// El árbol tiene 3 niveles fijos:
//   L1 → Branch   (ej: "Conceptos de Nube")
//   L2 → Module   (ej: "Azure Policy")
//   L3 → Unit     (ej: "Definiciones") ← aquí muere el árbol
// ─────────────────────────────────────────────────────────────────────────────

// Estado de una unidad (L3) — el único nivel que se actualiza manualmente
export type UnitStatus = 'pending' | 'in-progress' | 'done';

// Colores disponibles para los branches L1
export type BranchColor = 'blue' | 'purple' | 'pink';

// ── Nivel 3: Unidad ──────────────────────────────────────────────────────────
// El nodo hoja del árbol. Aquí vive el progreso real.
export interface Unit {
  id:     string;       // ej: "b1-m1-u1"
  label:  string;       // ej: "Definiciones de Política"
  status: UnitStatus;   // actualizado por el usuario
}

// ── Nivel 2: Módulo ──────────────────────────────────────────────────────────
// Contiene unidades. Su progreso se calcula automáticamente.
export interface Module {
  id:       string;     // ej: "b1-m1"
  label:    string;     // ej: "Azure Policy"
  units:    Unit[];     // hijos L3
  // progress: NO se define aquí — se calcula con computed()
  //   fórmula: unidades done / total unidades × 100
}

// ── Nivel 1: Branch ──────────────────────────────────────────────────────────
// Contiene módulos. Color visual de todo su sub-árbol.
export interface Branch {
  id:      string;       // ej: "b1"
  label:   string;       // ej: "Conceptos de Nube"
  color:   BranchColor;  // define el color de toda la rama
  modules: Module[];     // hijos L2
  // progress: NO se define aquí — se calcula con computed()
  //   fórmula: promedio de progress de sus módulos
}

// ── Raíz: ConceptualMap ──────────────────────────────────────────────────────
// El nodo raíz del árbol. Representa el título del curso en el Main Chip.
export interface ConceptualMap {
  title:    string;     // ej: "AZURE AZ-900" — aparece en el Main Chip
  branches: Branch[];   // hijos L1
  // overallProgress: NO se define aquí — se calcula con computed()
  //   fórmula: promedio de progress de todos los branches
}