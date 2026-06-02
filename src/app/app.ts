/*
import { Component, signal } from '@angular/core';
import { Az900DashboardComponent } from './features/roadmap-final/roadmap-final.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Az900DashboardComponent], // Añade el componente aquí
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('azure-roadmap');
}
*/

/*
import { Component, signal } from '@angular/core';
import { Az900Component } from './features/az900/az900.component';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Az900Component],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('azure-roadmap');
}*/

// app.ts — actualizado para usar router
// Reemplaza el import de Az900Component por RouterOutlet

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
   selector: 'app-root',
   standalone: true,
   imports: [RouterOutlet],
   template: `<router-outlet />`,
})
export class App {}
