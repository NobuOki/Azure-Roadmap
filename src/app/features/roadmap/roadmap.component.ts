import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AZURE_ROADMAP_DATA } from '../../core/constants/roadmap-data';
import { RoadmapNode } from '../../core/models/roadmap.model';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roadmap.component.html',
  styleUrls: ['./roadmap.component.scss'],
})
export class RoadmapComponent {

  roadmap = AZURE_ROADMAP_DATA;

  toggleNode(node: RoadmapNode): void {
    node.expanded = !node.expanded;
  }

}