// ─────────────────────────────────────────────────────────────────────────────
// index.ts — barrel export
//
// Exporta todos los modelos desde un solo punto de entrada.
// En lugar de importar así:
//   import { Branch } from '../../core/models/map-node.model';
//   import { CourseInfo } from '../../core/models/dashboard.model';
//
// Se importa así (más limpio):
//   import { Branch, CourseInfo } from '../../core/models';
// ─────────────────────────────────────────────────────────────────────────────

export * from './map-node.model';
export * from './dashboard.model';