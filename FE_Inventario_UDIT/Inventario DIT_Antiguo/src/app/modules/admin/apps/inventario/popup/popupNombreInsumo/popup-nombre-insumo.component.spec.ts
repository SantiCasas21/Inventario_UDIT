import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupNombreInsumoComponent } from './popup-nombre-insumo.component';

describe('PopupNombreInsumoComponent', () => {
  let component: PopupNombreInsumoComponent;
  let fixture: ComponentFixture<PopupNombreInsumoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupNombreInsumoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupNombreInsumoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
