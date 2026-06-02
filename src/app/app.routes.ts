// ─────────────────────────────────────────────────────────────────────────────
// app.routes.ts
//
// Dos rutas principales:
//   /           → OnboardingComponent (subir .txt)
//   /dashboard  → Az900Component      (dashboard)
//
// Lógica de entrada:
//   Si el usuario va a / pero ya tiene data en localStorage
//   → se redirige automáticamente a /dashboard
//
//   Si el usuario va a /dashboard pero NO tiene data
//   → se redirige automáticamente a /
// ─────────────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';

// ── Guards ────────────────────────────────────────────────────────────────────
// Funciones simples que verifican el localStorage antes de activar una ruta.
// En Angular 17+ los guards pueden ser funciones puras (sin clases).

// Redirige a /dashboard si ya existe data guardada
const redirectIfLoaded = () => {
   const hasData = !!localStorage.getItem('dashboard_map');
   return hasData ? ['/dashboard'] : true;
};

// Redirige a / si no existe data guardada
const requireData = () => {
   const hasData = !!localStorage.getItem('dashboard_map');
   return hasData ? true : ['/'];
};

// ── Rutas ─────────────────────────────────────────────────────────────────────
export const routes: Routes = [
   {
      path: '',
      loadComponent: () =>
         import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
      canActivate: [redirectIfLoaded],
   },
   {
      path: 'dashboard',
      loadComponent: () => import('./features/az900/az900.component').then((m) => m.Az900Component),
      canActivate: [requireData],
   },
   {
      // Cualquier ruta desconocida → onboarding
      path: '**',
      redirectTo: '',
   },
];
