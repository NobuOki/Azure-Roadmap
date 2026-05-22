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
