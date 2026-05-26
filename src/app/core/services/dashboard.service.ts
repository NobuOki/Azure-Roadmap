// ─────────────────────────────────────────────────────────────────────────────
// dashboard.service.ts
//
// Servicio central del dashboard. Responsabilidades:
//   1. Leer y escribir en localStorage (hoy) / API (futuro)
//   2. Exponer los datos como signals reactivos
//   3. Calcular progreso automáticamente con computed()
//   4. Proveer métodos para actualizar el estado
//
// Ubicación: src/app/core/services/dashboard.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, computed, signal } from '@angular/core';
import {
  DashboardState,  //dashboard.model.ts
  CourseInfo,      //dashboard.model.ts
  ConceptualMap,   //map-node.model.ts
  StudySession,    //dashboard.model.ts
  Branch,          //map-node.model.ts
  Module,          //map-node.model.ts
  Unit,            //map-node.model.ts
  UnitStatus,      //map-node.model.ts
} from '../models';
import { AZ900_DEFAULT_STATE } from '../../features/az900/data/az900.data';

// ── Claves de localStorage ────────────────────────────────────────────────────
// Una clave por "endpoint" — preparado para reemplazar con API real
const STORAGE_KEYS = {
  course:   'dashboard_course',
  map:      'dashboard_map',
  sessions: 'dashboard_sessions',
} as const;

@Injectable({ providedIn: 'root' })
export class DashboardService {

  // ══════════════════════════════════════════════════════════════════════════
  // SIGNALS — estado reactivo
  // El componente nunca modifica estos signals directamente.
  // Solo usa los métodos públicos del servicio.
  // ══════════════════════════════════════════════════════════════════════════

  private _course   = signal<CourseInfo>(this.loadCourse());
  private _map      = signal<ConceptualMap>(this.loadMap());
  private _sessions = signal<StudySession[]>(this.loadSessions());

  // ── Exposición pública (readonly) ─────────────────────────────────────────
  // El componente lee estos signals pero no puede modificarlos directamente
  readonly course   = this._course.asReadonly();
  readonly map      = this._map.asReadonly();
  readonly sessions = this._sessions.asReadonly();

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED — progreso calculado automáticamente
  // Se recalculan solos cuando _map o _sessions cambian.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Progreso de cada branch ───────────────────────────────────────────────
  // Fórmula: promedio del progreso de sus módulos
  branchProgress = computed(() =>
    this._map().branches.map(branch => ({
      id:       branch.id,
      label:    branch.label,
      progress: this.calcBranchProgress(branch),
    }))
  );

  // ── Progreso general ──────────────────────────────────────────────────────
  // Fórmula: promedio del progreso de todos los branches
  overallProgress = computed(() => {
    const branches = this._map().branches;
    if (!branches.length) return 0;
    const total = branches.reduce((sum, b) => sum + this.calcBranchProgress(b), 0);
    return Math.round(total / branches.length);
  });

  // ── Módulos activos ───────────────────────────────────────────────────────
  // Branches con al menos una unit en 'done' o 'in-progress'
  activeModulesCount = computed(() =>
    this._map().branches.filter(branch =>
      branch.modules.some(mod =>
        mod.units.some(u => u.status !== 'pending')
      )
    ).length
  );

  // ── Tiempo total de estudio ───────────────────────────────────────────────
  // Fórmula: suma de durationMins de todas las sesiones / 60
  totalStudyHours = computed(() => {
    const totalMins = this._sessions().reduce((sum, s) => sum + s.durationMins, 0);
    return Math.round(totalMins / 60);
  });

  // ── Racha de estudio ──────────────────────────────────────────────────────
  // Fórmula: días consecutivos hasta hoy con al menos una sesión
  studyStreak = computed(() => {
    const sessions  = this._sessions();
    if (!sessions.length) return 0;

    // Obtener fechas únicas con sesiones, ordenadas descendente
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();

    let streak  = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    for (const dateStr of dates) {
      const sessionDate = new Date(dateStr);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.round(
        (current.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1) {
        streak++;
        current = sessionDate;
      } else {
        break; // se rompió la racha
      }
    }

    return streak;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS PÚBLICOS — actualizan el estado y persisten en localStorage
  // ══════════════════════════════════════════════════════════════════════════

  // ── Actualizar status de una unidad ──────────────────────────────────────
  // Es el único punto de entrada para modificar el progreso.
  // Recibe: id de la unidad + nuevo status
  updateUnitStatus(unitId: string, status: UnitStatus): void {
    this._map.update(map => ({
      ...map,
      branches: map.branches.map(branch => ({
        ...branch,
        modules: branch.modules.map(mod => ({
          ...mod,
          units: mod.units.map(unit =>
            unit.id === unitId ? { ...unit, status } : unit
          ),
        })),
      })),
    }));
    this.saveMap();
  }

  // ── Agregar sesión de estudio ─────────────────────────────────────────────
  addSession(nodeId: string, durationMins: number): void {
    const today = new Date().toISOString().split('T')[0];
    this._sessions.update(sessions => [
      ...sessions,
      { date: today, nodeId, durationMins },
    ]);
    this.saveSessions();
  }

  // ── Reset: vuelve a los datos por defecto ─────────────────────────────────
  // Útil para desarrollo y pruebas
  resetToDefault(): void {
    this._course.set(AZ900_DEFAULT_STATE.course);
    this._map.set(AZ900_DEFAULT_STATE.map);
    this._sessions.set(AZ900_DEFAULT_STATE.sessions);
    this.saveAll();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS PRIVADOS — carga y persistencia
  // ══════════════════════════════════════════════════════════════════════════

  // ── Carga desde localStorage (con fallback a datos por defecto) ───────────
  // Cuando haya API: reemplaza localStorage.getItem() por this.http.get()
  private loadCourse(): CourseInfo {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.course);
      return raw ? JSON.parse(raw) : AZ900_DEFAULT_STATE.course;
    } catch {
      return AZ900_DEFAULT_STATE.course;
    }
  }

  private loadMap(): ConceptualMap {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.map);
      return raw ? JSON.parse(raw) : AZ900_DEFAULT_STATE.map;
    } catch {
      return AZ900_DEFAULT_STATE.map;
    }
  }

  private loadSessions(): StudySession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.sessions);
      return raw ? JSON.parse(raw) : AZ900_DEFAULT_STATE.sessions;
    } catch {
      return AZ900_DEFAULT_STATE.sessions;
    }
  }

  // ── Persistencia en localStorage ─────────────────────────────────────────
  // Cuando haya API: reemplaza localStorage.setItem() por this.http.post/put()
  private saveMap():      void { localStorage.setItem(STORAGE_KEYS.map,      JSON.stringify(this._map())); }
  private saveSessions(): void { localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(this._sessions())); }
  private saveAll():      void {
    localStorage.setItem(STORAGE_KEYS.course,   JSON.stringify(this._course()));
    localStorage.setItem(STORAGE_KEYS.map,      JSON.stringify(this._map()));
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(this._sessions()));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS DE CÁLCULO — progreso en cascada
  // ══════════════════════════════════════════════════════════════════════════

  // Progreso de una unidad: done=100, in-progress=50, pending=0
  private calcUnitProgress(unit: Unit): number {
    return { done: 100, 'in-progress': 50, pending: 0 }[unit.status];
  }

  // Progreso de un módulo: promedio del progreso de sus unidades
  private calcModuleProgress(mod: Module): number {
    if (!mod.units.length) return 0;
    const total = mod.units.reduce((sum, u) => sum + this.calcUnitProgress(u), 0);
    return Math.round(total / mod.units.length);
  }

  // Progreso de un branch: promedio del progreso de sus módulos
  private calcBranchProgress(branch: Branch): number {
    if (!branch.modules.length) return 0;
    const total = branch.modules.reduce((sum, m) => sum + this.calcModuleProgress(m), 0);
    return Math.round(total / branch.modules.length);
  }
}