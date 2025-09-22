import { Injectable, signal } from '@angular/core';
import { MovieRoom } from '../../../shared/model/movie-room.model';
import { Reservation } from '../models/reservation.model';
import { Session } from '../../../shared/model/session.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private v_reservations = signal<Reservation[]>([]);
  public v_reservations$ = this.v_reservations.asReadonly();

  /** Load reservations from local storage */
  private loadFromLocalStorage() {
    try {
      const v_data = localStorage.getItem('reservations');
      return v_data ? JSON.parse(v_data) : [];
    } catch {
      return [];
    }
  }

  /** Save reservations to local storage */
  private saveToLocalStorage() {
    localStorage.setItem('reservations', JSON.stringify(this.v_reservations()));
  }

  /** Check if two sessions overlap */
  private overlapsSession(
    p_firstSessionStartISO: string,
    p_firstSessionEndISO: string,
    p_secondSessionStartISO: string,
    p_secondSessionEndISO: string,
  ): boolean {
    const vfirstStart = new Date(p_firstSessionStartISO).getTime();
    const vfirstEnd = new Date(p_firstSessionEndISO).getTime();
    const vsecondStart = new Date(p_secondSessionStartISO).getTime();
    const vsecondEnd = new Date(p_secondSessionEndISO).getTime();
    return vfirstStart < vsecondEnd && vsecondStart < vfirstEnd;
  }

  /** Check how many seats are left in a room for a specific session */
  seatsLeft(p_room: MovieRoom, p_session: Session): number {
    const booked = this.v_reservations()
      .filter(
        (r) =>
          r.status === 'CONFIRMED' &&
          r.roomId === p_session.roomId &&
          r.startHour === p_session.start &&
          r.tmdbId === p_session.tmdbId,
      )
      .reduce((sum, r) => sum + r.quantity, 0);

    return Math.max(0, p_room.capacity - booked);
  }

  /** create a new reservation */
  createReservation(
    p_userId: string,
    p_session: Session,
    p_room: MovieRoom,
    p_version: 'VO' | 'VOSTFR' | 'VF',
    p_ticketType: '-16' | '-26' | 'STUDENT' | 'ADULT' | 'SENIOR',
    p_price: number,
    p_quantity: number,
    p_movieTitle?: string,
    p_moviePosterPath?: string,
  ): Reservation {
    if (p_quantity < 1) throw new Error('No more seats available');

    const now = Date.now();
    const startMs = new Date(p_session.start).getTime();
    if (Number.isNaN(startMs) || startMs <= now) {
      throw new Error('Session is already passed');
    }

    const v_endISO = p_session.end;
    const v_hasOverlap = this.v_reservations().some(
      (r) =>
        r.userId === p_userId &&
        r.status === 'CONFIRMED' &&
        this.overlapsSession(p_session.start, v_endISO, r.startHour, r.endHour),
    );
    if (v_hasOverlap) {
      throw new Error('You already have a reservation that overlaps with this schedule');
    }

    const v_leftSeats = this.seatsLeft(p_room, p_session);
    if (v_leftSeats < p_quantity) {
      throw new Error('Not more seats available');
    }

    const v_newRes: Reservation = {
      id: crypto.randomUUID(),
      userId: p_userId,
      tmdbId: p_session.tmdbId,
      roomId: p_session.roomId,
      startHour: p_session.start,
      endHour: p_session.end,
      version: p_version,
      ticketType: p_ticketType,
      price: p_price,
      quantity: p_quantity,
      movieTitle: p_movieTitle,
      moviePosterPath: p_moviePosterPath,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
    };

    this.v_reservations.update((reservations) => [...reservations, v_newRes]);
    this.saveToLocalStorage();
    return v_newRes;
  }
}
