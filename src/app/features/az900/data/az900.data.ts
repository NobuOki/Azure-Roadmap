// ─────────────────────────────────────────────────────────────────────────────
// az900.data.ts
//
// Datos del curso Azure AZ-900 hardcodeados.
// Cumple las interfaces definidas en core/models.
//
// Este archivo es el punto de entrada de datos mientras no exista API.
// Cuando conectes el backend, el DashboardService leerá de la API
// en vez de importar desde aquí — este archivo se vuelve obsoleto.
//
// Ubicación: src/app/features/az900/data/az900.data.ts
// ─────────────────────────────────────────────────────────────────────────────

import { DashboardState } from '../../../core/models';

export const AZ900_DEFAULT_STATE: DashboardState = {

  // ── Información general del curso ─────────────────────────────────────────
  // Alimenta: header del dashboard, stat cards
  course: {
    id:       'az900',
    title:    'Azure AZ-900',
    subtitle: 'Microsoft Azure Fundamentals',
    certCode: 'AZ-900',
  },

  // ── Mapa conceptual ───────────────────────────────────────────────────────
  // Alimenta: el componente ConceptualMapComponent
  // Estructura: Branch → Module → Unit (3 niveles fijos)
  //
  // IMPORTANTE: ningún nodo tiene 'progress' hardcodeado.
  // El progreso se calcula en cascada desde Unit.status hacia arriba:
  //   Unit.status   → manual (el usuario lo actualiza)
  //   Module.progress → % de units con status 'done'
  //   Branch.progress → promedio de sus modules
  //   overallProgress → promedio de todos los branches
  map: {
    title: 'AZURE AZ-900',
    branches: [

      // ── Branch 1: Conceptos de Nube (blue) ────────────────────────────────
      {
        id:    'b1',
        label: 'Conceptos de Nube',
        color: 'blue',
        modules: [
          {
            id:    'b1-m1',
            label: 'Fundamentos de la Nube',
            units: [
              { id: 'b1-m1-u1', label: 'Beneficios de la nube',    status: 'done'        },
              { id: 'b1-m1-u2', label: 'Modelos de servicio',       status: 'done'        },
              { id: 'b1-m1-u3', label: 'Modelos de implementación', status: 'done'        },
            ],
          },
          {
            id:    'b1-m2',
            label: 'Azure Policy',
            units: [
              { id: 'b1-m2-u1', label: 'Definiciones de política',  status: 'done'        },
              { id: 'b1-m2-u2', label: 'Iniciativas',               status: 'in-progress' },
            ],
          },
          {
            id:    'b1-m3',
            label: 'Cost Management',
            units: [
              { id: 'b1-m3-u1', label: 'Calculadora de precios',    status: 'in-progress' },
              { id: 'b1-m3-u2', label: 'TCO Calculator',            status: 'pending'     },
            ],
          },
        ],
      },

      // ── Branch 2: Arquitectura y Servicios (purple) ───────────────────────
      {
        id:    'b2',
        label: 'Arquitectura y Servicios',
        color: 'purple',
        modules: [
          {
            id:    'b2-m1',
            label: 'Arquitectura Azure',
            units: [
              { id: 'b2-m1-u1', label: 'Regiones y zonas',        status: 'done'    },
              { id: 'b2-m1-u2', label: 'Resource Groups',         status: 'done'    },
              { id: 'b2-m1-u3', label: 'Azure Resource Manager',  status: 'pending' },
            ],
          },
          {
            id:    'b2-m2',
            label: 'Cómputo y Redes',
            units: [
              { id: 'b2-m2-u1', label: 'Azure VMs',               status: 'pending' },
              { id: 'b2-m2-u2', label: 'Azure App Service',       status: 'pending' },
              { id: 'b2-m2-u3', label: 'Azure Functions',         status: 'pending' },
            ],
          },
        ],
      },

      // ── Branch 3: Administración y Gobernanza (pink) ──────────────────────
      {
        id:    'b3',
        label: 'Administración y Gobernanza',
        color: 'pink',
        modules: [
          {
            id:    'b3-m1',
            label: 'Seguridad e Identidad',
            units: [
              { id: 'b3-m1-u1', label: 'Azure Active Directory',  status: 'pending' },
              { id: 'b3-m1-u2', label: 'RBAC',                    status: 'pending' },
              { id: 'b3-m1-u3', label: 'Zero Trust',              status: 'pending' },
            ],
          },
          {
            id:    'b3-m2',
            label: 'Cumplimiento',
            units: [
              { id: 'b3-m2-u1', label: 'Azure Blueprints',        status: 'pending' },
              { id: 'b3-m2-u2', label: 'SLA y ciclo de vida',     status: 'pending' },
            ],
          },
        ],
      },

    ],
  },

  // ── Sesiones de estudio ───────────────────────────────────────────────────
  // Alimenta: tiempo total, racha de estudio, velocidad de aprendizaje
  // Formato de date: ISO "YYYY-MM-DD"
  // durationMins: minutos dedicados en esa sesión
  sessions: [
    { date: '2026-05-18', nodeId: 'b1-m1', durationMins: 45 },
    { date: '2026-05-19', nodeId: 'b1-m1', durationMins: 60 },
    { date: '2026-05-20', nodeId: 'b1-m2', durationMins: 30 },
    { date: '2026-05-21', nodeId: 'b1-m2', durationMins: 50 },
    { date: '2026-05-22', nodeId: 'b1-m3', durationMins: 40 },
    { date: '2026-05-23', nodeId: 'b2-m1', durationMins: 55 },
    { date: '2026-05-24', nodeId: 'b2-m1', durationMins: 35 },
    { date: '2026-05-25', nodeId: 'b2-m1', durationMins: 45 },
  ],

};