import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupIngresoInsumoComponent } from './popup-ingreso-insumo.component';

describe('IngresoInsumoComponent', () => {
  let component: PopupIngresoInsumoComponent;
  let fixture: ComponentFixture<PopupIngresoInsumoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupIngresoInsumoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupIngresoInsumoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
