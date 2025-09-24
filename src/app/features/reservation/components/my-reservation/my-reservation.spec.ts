import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyReservation } from './my-reservation';

describe('MyReservation', () => {
  let component: MyReservation;
  let fixture: ComponentFixture<MyReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyReservation],
    }).compileComponents();

    fixture = TestBed.createComponent(MyReservation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
