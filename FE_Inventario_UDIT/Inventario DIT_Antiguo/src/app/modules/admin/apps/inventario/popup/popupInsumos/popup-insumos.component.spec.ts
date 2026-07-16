import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupInsumosComponent } from './popup-insumos.component';

describe('PopupInsumosComponent', () => {
  let component: PopupInsumosComponent;
  let fixture: ComponentFixture<PopupInsumosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupInsumosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupInsumosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
