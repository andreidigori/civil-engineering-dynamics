import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeterminantPlotComponent } from './determinant-plot.component';

describe('DeterminantPlotComponent', () => {
  let component: DeterminantPlotComponent;
  let fixture: ComponentFixture<DeterminantPlotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeterminantPlotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeterminantPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
