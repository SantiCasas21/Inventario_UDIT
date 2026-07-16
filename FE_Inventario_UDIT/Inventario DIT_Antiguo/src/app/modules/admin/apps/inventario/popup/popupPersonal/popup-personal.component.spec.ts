import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupPersonalComponent } from './popup-personal.component';

describe('PopupPersonalComponent', () => {
  let component: PopupPersonalComponent;
  let fixture: ComponentFixture<PopupPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupPersonalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
