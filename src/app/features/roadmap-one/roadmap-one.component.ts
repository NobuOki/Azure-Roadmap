import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule],
  // Relación: Enlaza el HTML y SCSS que acabamos de editar
  templateUrl: './roadmap-one.component.html',
  styleUrls: ['./roadmap-one.component.scss']
})
export class RoadmapComponent {
  // Por ahora no necesitamos lógica para el Main Chip estático
}