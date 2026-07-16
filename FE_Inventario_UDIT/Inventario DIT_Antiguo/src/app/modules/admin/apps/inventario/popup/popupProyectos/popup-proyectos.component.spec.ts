import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupProyectosComponent } from './popup-proyectos.component';

describe('PopupProyectosComponent', () => {
  let component: PopupProyectosComponent;
  let fixture: ComponentFixture<PopupProyectosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupProyectosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupProyectosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
