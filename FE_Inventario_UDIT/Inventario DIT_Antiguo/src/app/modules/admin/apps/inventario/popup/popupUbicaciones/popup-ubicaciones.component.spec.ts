import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupUbicacionesComponent } from './popup-ubicaciones.component';

describe('PopupUbicacionesComponent', () => {
  let component: PopupUbicacionesComponent;
  let fixture: ComponentFixture<PopupUbicacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupUbicacionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupUbicacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
