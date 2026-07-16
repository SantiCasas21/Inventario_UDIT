import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupEstadoSalidaComponent } from './popup-estado-salida.component';

describe('PopupEstadoSalidaComponent', () => {
  let component: PopupEstadoSalidaComponent;
  let fixture: ComponentFixture<PopupEstadoSalidaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupEstadoSalidaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupEstadoSalidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
