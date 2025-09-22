import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationFilm } from './reservation-film';

describe('Reservation', () => {
  let component: ReservationFilm;
  let fixture: ComponentFixture<ReservationFilm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationFilm],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationFilm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
