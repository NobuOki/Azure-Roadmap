import { Component, signal } from '@angular/core';
import { RoadmapComponent } from './features/roadmap/roadmap.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RoadmapComponent], // Añade el componente aquí
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('azure-roadmap');
}
