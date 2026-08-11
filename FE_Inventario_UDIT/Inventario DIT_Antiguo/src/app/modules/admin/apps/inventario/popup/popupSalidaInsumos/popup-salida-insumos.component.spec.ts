import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupSalidaInsumosComponent } from './popup-salida-insumos.component';

describe('PopupSalidaInsumosComponent', () => {
  let component: PopupSalidaInsumosComponent;
  let fixture: ComponentFixture<PopupSalidaInsumosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupSalidaInsumosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupSalidaInsumosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
