import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoadmapFinalComponent } from './roadmap-final.component';

describe('RoadmapFinalComponent', () => {
  let component: RoadmapFinalComponent;
  let fixture: ComponentFixture<RoadmapFinalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoadmapFinalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoadmapFinalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
