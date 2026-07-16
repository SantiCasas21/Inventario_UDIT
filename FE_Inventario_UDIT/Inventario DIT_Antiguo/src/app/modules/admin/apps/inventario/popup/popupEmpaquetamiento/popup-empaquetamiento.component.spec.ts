import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupEmpaquetamientoComponent } from './popup-empaquetamiento.component';

describe('PopupEmpaquetamientoComponent', () => {
  let component: PopupEmpaquetamientoComponent;
  let fixture: ComponentFixture<PopupEmpaquetamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupEmpaquetamientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupEmpaquetamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
