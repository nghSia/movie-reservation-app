import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { MovieVersion } from '../../../shared/model/session.model';
import { AuthService } from '../../auth/services/auth-service';
import { TmdbService } from '../../home/services/tmdb.service';
import { Reservation, TicketType } from '../models/reservation.model';
import { ReservationService } from '../services/reservation.service';
import { ReservationFilm } from './reservation-film';

describe('ReservationFilm (integration)', () => {
  let component: ReservationFilm;

  // ---- Spies / stubs ----
  const reservationService = jasmine.createSpyObj<ReservationService>('ReservationService', [
    'isPast',
    'updateReservation',
    'getPriceForCustomerType',
  ]);

  // AuthService : seulement ce dont on a besoin (userId), sans any
  const authServiceStub = { userId: 1 } as const;

  const tmdbService = jasmine.createSpyObj<TmdbService>('TmdbService', ['image', 'movieDetails']);
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

  // ActivatedRoute mock strict sans any
  interface RouteSnapshotLike {
    params: Record<string, string | number>;
  }
  const activatedRouteMock: { params: ActivatedRoute['params']; snapshot: RouteSnapshotLike } = {
    params: of({ id: 123 }),
    snapshot: { params: { id: 123 } },
  };

  beforeEach(async () => {
    reservationService.getPriceForCustomerType.and.callFake((type: TicketType, qty: number) => {
      const unit =
        type === 'ADULT'
          ? 10
          : type === 'SENIOR'
            ? 6
            : type === 'STUDENT'
              ? 8
              : type === '-26'
                ? 7
                : 5; // '-16'
      return unit * qty;
    });

    await TestBed.configureTestingModule({
      imports: [ReservationFilm], // composant standalone
      providers: [
        { provide: ReservationService, useValue: reservationService },
        { provide: AuthService, useValue: authServiceStub as unknown as AuthService },
        { provide: TmdbService, useValue: tmdbService },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
        // On cast en ActivatedRoute via unknown (pas de any)
        { provide: ActivatedRoute, useValue: activatedRouteMock as unknown as ActivatedRoute },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReservationFilm);
    component = fixture.componentInstance;
  });

  /** Fabrique une réservation complète conforme au modèle de l’app */
  function makeReservation(startISO: string, overrides: Partial<Reservation> = {}): Reservation {
    const start = new Date(startISO);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h

    const base: Reservation = {
      id: 1,
      userId: 1,
      tmdbId: 550,
      roomId: 1,
      startHour: start.toISOString(),
      endHour: end.toISOString(),
      // si MovieVersion est un enum/union, on force une valeur valide sans any
      version: '2D' as unknown as MovieVersion,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      ticketType: 'ADULT',
      quantity: 1,
      price: 10,
    };

    return { ...base, ...overrides };
  }

  it('validateReservation appelle updateReservation pour une séance future', () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = makeReservation(start);

    reservationService.isPast.and.returnValue(false);

    component.validateReservation(res, 'ADULT', 2);

    expect(reservationService.isPast).toHaveBeenCalledWith(res.startHour);
    expect(reservationService.updateReservation).toHaveBeenCalledWith(
      { id: res.id, userId: res.userId, tmdbId: res.tmdbId },
      { status: 'CONFIRMED', ticketType: 'ADULT', quantity: 2, price: 20 },
    );
  });

  it('validateReservation n’appelle pas updateReservation pour une séance passée', () => {
    const start = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const res = makeReservation(start);

    reservationService.isPast.and.returnValue(true);

    component.validateReservation(res, 'ADULT', 1);

    expect(reservationService.isPast).toHaveBeenCalledWith(res.startHour);
    expect(reservationService.updateReservation).not.toHaveBeenCalled();
  });

  it('cancelReservation appelle updateReservation si séance future', () => {
    const start = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const res = makeReservation(start);

    reservationService.isPast.and.returnValue(false);

    component.cancelReservation(res);

    expect(reservationService.updateReservation).toHaveBeenCalledWith(
      { id: res.id, userId: res.userId, tmdbId: res.tmdbId },
      { status: 'CANCELLED' },
    );
  });

  it('cancelReservation n’appelle pas updateReservation si séance passée', () => {
    const start = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const res = makeReservation(start);

    reservationService.isPast.and.returnValue(true);

    component.cancelReservation(res);

    expect(reservationService.updateReservation).not.toHaveBeenCalled();
  });
});
