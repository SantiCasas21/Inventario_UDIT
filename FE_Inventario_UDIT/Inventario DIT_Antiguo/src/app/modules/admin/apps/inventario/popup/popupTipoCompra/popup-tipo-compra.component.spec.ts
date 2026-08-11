import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupTipoCompraComponent } from './popup-tipo-compra.component';

describe('PopupTipoCompraComponent', () => {
  let component: PopupTipoCompraComponent;
  let fixture: ComponentFixture<PopupTipoCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupTipoCompraComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupTipoCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
