import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupProveedoresComponent } from './popup-proveedores.component';

describe('PopupProveedoresComponent', () => {
  let component: PopupProveedoresComponent;
  let fixture: ComponentFixture<PopupProveedoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupProveedoresComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupProveedoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
