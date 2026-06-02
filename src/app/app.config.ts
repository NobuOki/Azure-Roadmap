/*import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    
  ]
};*/

// ─────────────────────────────────────────────────────────────────────────────
// app.config.ts
//
// Configuración principal de la app.
// provideRouter activa el sistema de rutas definido en app.routes.ts
// withComponentInputBinding permite pasar query params como inputs
// ─────────────────────────────────────────────────────────────────────────────

import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
   providers: [provideRouter(routes, withComponentInputBinding())],
};
