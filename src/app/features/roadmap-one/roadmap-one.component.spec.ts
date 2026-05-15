import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoadmapOneComponent } from './roadmap-one.component';

describe('RoadmapOneComponent', () => {
  let component: RoadmapOneComponent;
  let fixture: ComponentFixture<RoadmapOneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoadmapOneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoadmapOneComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
