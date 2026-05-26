// ─────────────────────────────────────────────────────────────────────────────
// dashboard.model.ts
//
// Interfaces para el resto del dashboard:
//   - CourseInfo   → info general del curso (header + stats)
//   - StudySession → historial de sesiones (racha, tiempo total)
//   - DashboardState → todo junto, lo que vive en localStorage
// ─────────────────────────────────────────────────────────────────────────────

import { ConceptualMap } from './map-node.model';

// ── CourseInfo ────────────────────────────────────────────────────────────────
// Información general del curso.
// Alimenta el header y las stat cards del dashboard.
export interface CourseInfo {
  id:          string;   // ej: "az900" — clave única del curso
  title:       string;   // ej: "Azure AZ-900"
  subtitle:    string;   // ej: "Microsoft Azure Fundamentals"
  certCode:    string;   // ej: "AZ-900"
}

// ── StudySession ──────────────────────────────────────────────────────────────
// Representa una sesión de estudio.
// De aquí se calculan: tiempo total, racha y velocidad.
export interface StudySession {
  date:         string;  // ej: "2026-05-25" (ISO date)
  nodeId:       string;  // id del nodo trabajado (unit, module o branch)
  durationMins: number;  // minutos dedicados en esa sesión
}

// ── DashboardState ────────────────────────────────────────────────────────────
// El estado completo del dashboard.
// Es lo que se guarda y lee del localStorage.
// En el futuro cada propiedad corresponderá a un endpoint de la API:
//
//   course   → GET /api/course/{id}
//   map      → GET /api/map/{courseId}
//   sessions → GET /api/sessions/{courseId}
//
export interface DashboardState {
  course:   CourseInfo;
  map:      ConceptualMap;
  sessions: StudySession[];
}

// ── Tipos calculados (NO viven en localStorage) ───────────────────────────────
// Estos valores se derivan de DashboardState con computed() en el servicio.
// Se definen aquí solo como referencia de qué se puede calcular:
//
//   overallProgress  → promedio de progreso de todos los branches
//   totalStudyHours  → suma de durationMins de sessions / 60
//   studyStreak      → días consecutivos con al menos una sesión
//   activeModules    → branches con al menos una unit en 'done' o 'in-progress'