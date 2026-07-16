import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupEstadoProyectoComponent } from './popup-estado-proyecto.component';

describe('PopupEstadoProyectoComponent', () => {
  let component: PopupEstadoProyectoComponent;
  let fixture: ComponentFixture<PopupEstadoProyectoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupEstadoProyectoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupEstadoProyectoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
