// ─────────────────────────────────────────────────────────────────────────────
// index-parser.service.ts
//
// Convierte el texto de un archivo .txt al formato DashboardState.
// Es el puente entre lo que escribe el usuario y lo que entiende el dashboard.
//
// Formato esperado del .txt:
//   COURSE: nombre del curso
//   BRANCH: rama principal
//     MODULE: módulo
//       unidad libre (4 espacios de sangría)
//
// Ubicación: src/app/features/onboarding/parser/
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import {
   DashboardState,
   ConceptualMap,
   Branch,
   Module,
   Unit,
   BranchColor,
} from '../../../core/models';

// ── Resultado del parser ──────────────────────────────────────────────────────
export interface ParseSuccess {
   ok: true;
   data: DashboardState;
}

export interface ParseError {
   ok: false;
   error: string; // mensaje legible para el usuario
   line: number; // número de línea donde ocurrió el error
}

export type ParseResult = ParseSuccess | ParseError;

// ── Colores asignados cíclicamente a los branches ────────────────────────────
const BRANCH_COLORS: BranchColor[] = ['blue', 'purple', 'pink'];

@Injectable({ providedIn: 'root' })
export class IndexParserService {
   // ── Método principal ───────────────────────────────────────────────────────
   // Recibe el texto completo del .txt y retorna ParseResult
   parse(text: string): ParseResult {
      const lines = text.split('\n');

      let courseTitle: string | null = null;
      let currentBranch: Branch | null = null;
      let currentModule: Module | null = null;
      const branches: Branch[] = [];
      let branchIndex = 0;

      for (let i = 0; i < lines.length; i++) {
         const raw = lines[i];
         const line = raw.trimEnd();
         const trimmed = line.trim();
         const lineNum = i + 1;

         // Línea vacía → ignorar
         if (!trimmed) continue;

         // ── COURSE ──────────────────────────────────────────────────────────
         if (trimmed.startsWith('COURSE:')) {
            courseTitle = trimmed.replace('COURSE:', '').trim();
            if (!courseTitle) {
               return this.error(lineNum, 'COURSE: no tiene nombre. Ejemplo: COURSE: Azure AZ-900');
            }

            // ── BRANCH ──────────────────────────────────────────────────────────
         } else if (trimmed.startsWith('BRANCH:')) {
            const label = trimmed.replace('BRANCH:', '').trim();
            if (!label) {
               return this.error(
                  lineNum,
                  'BRANCH: no tiene nombre. Ejemplo: BRANCH: Conceptos de Nube',
               );
            }
            currentBranch = {
               id: `b${branches.length + 1}`,
               label,
               color: BRANCH_COLORS[branchIndex % BRANCH_COLORS.length],
               modules: [],
            };
            currentModule = null;
            branches.push(currentBranch);
            branchIndex++;

            // ── MODULE ───────────────────────────────────────────────────────────
         } else if (trimmed.startsWith('MODULE:')) {
            if (!currentBranch) {
               return this.error(lineNum, 'MODULE sin BRANCH padre. Define un BRANCH antes.');
            }
            const label = trimmed.replace('MODULE:', '').trim();
            if (!label) {
               return this.error(lineNum, 'MODULE: no tiene nombre. Ejemplo: MODULE: Azure Policy');
            }
            const modIndex = currentBranch.modules.length + 1;
            currentModule = {
               id: `${currentBranch.id}-m${modIndex}`,
               label,
               units: [],
            };
            currentBranch.modules.push(currentModule);

            // ── UNIT (4 espacios de sangría) ──────────────────────────────────
         } else if (raw.startsWith('    ')) {
            if (!currentModule) {
               return this.error(
                  lineNum,
                  `Unidad "${trimmed}" sin MODULE padre. Define un MODULE antes.`,
               );
            }
            if (!trimmed) continue;
            const unitIndex = currentModule.units.length + 1;
            const unit: Unit = {
               id: `${currentModule.id}-u${unitIndex}`,
               label: trimmed,
               status: 'pending',
            };
            currentModule.units.push(unit);

            // ── Línea no reconocida ───────────────────────────────────────────
         } else {
            return this.error(
               lineNum,
               `Formato no reconocido: "${trimmed.substring(0, 40)}". ` +
                  `Usa COURSE:, BRANCH:, MODULE: o 4 espacios para unidades.`,
            );
         }
      }

      // ── Validaciones finales ──────────────────────────────────────────────
      if (!courseTitle) {
         return this.error(0, 'No se encontró COURSE: en el archivo.');
      }
      if (!branches.length) {
         return this.error(0, 'No se encontró ningún BRANCH: en el archivo.');
      }

      // ── Construir DashboardState ──────────────────────────────────────────
      const map: ConceptualMap = {
         title: courseTitle.toUpperCase(),
         branches,
      };

      const state: DashboardState = {
         course: {
            id: this.slugify(courseTitle),
            title: courseTitle,
            subtitle: 'Dashboard de aprendizaje',
            certCode: courseTitle,
         },
         map,
         sessions: [], // sin sesiones al inicio
      };

      return { ok: true, data: state };
   }

   // ── Helpers ───────────────────────────────────────────────────────────────

   private error(line: number, message: string): ParseError {
      const prefix = line > 0 ? `Línea ${line} — ` : '';
      return { ok: false, error: `${prefix}${message}`, line };
   }

   // Convierte "Azure AZ-900" → "azure-az-900" para usar como id
   private slugify(text: string): string {
      return text
         .toLowerCase()
         .replace(/\s+/g, '-')
         .replace(/[^a-z0-9-]/g, '');
   }
}
