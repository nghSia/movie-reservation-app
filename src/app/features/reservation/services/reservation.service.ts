import { Injectable, signal } from '@angular/core';
import { MovieRoom } from '../../../shared/model/movie-room.model';
import { Session } from '../../../shared/model/session.model';
import { Reservation, ReservationStatus, TicketType } from '../models/reservation.model';

type PriceTable = Record<TicketType, number>;

const PRICE_TABLE: PriceTable = {
  '-16': 5,
  '-26': 7,
  STUDENT: 8,
  ADULT: 10,
  SENIOR: 6,
};

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private v_reservations = signal<Reservation[]>([]);
  public v_reservations$ = this.v_reservations.asReadonly();

  /** Load reservations from local storage */
  loadFromLocalStorage(): Reservation[] {
    try {
      const v_data = localStorage.getItem('reservations');
      if (!v_data) return [];
      const v_parsedData = JSON.parse(v_data) as Reservation[];
      if (Array.isArray(v_parsedData)) {
        this.v_reservations.set(v_parsedData);
        return v_parsedData;
      }
      return [];
    } catch {
      return [];
    }
  }

  /** Get price table */
  getPriceTable(): PriceTable {
    return PRICE_TABLE;
  }

  /** Get price for 1 type customer ticket */
  getPriceForCustomerType(p_type: TicketType, p_quantity = 1): number {
    const v_unit = PRICE_TABLE[p_type] ?? 0;
    return v_unit * (p_quantity || 1);
  }

  /** Generate next Id for reservation */
  private nextId(): number {
    const v_items = this.v_reservations();
    if (!v_items.length) return 1;
    return Math.max(...v_items.map((v_res) => v_res.id)) + 1;
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

  /** Check if user have session conflitcs */
  private hasTimeConflict(
    p_userId: number,
    p_startISO: string,
    p_endISO: string,
    p_excludeId?: number,
    p_statuses?: Reservation['status'][],
  ): boolean {
    const s = Date.parse(p_startISO),
      e = Date.parse(p_endISO);
    if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) return false;

    const statusesToCheck = p_statuses ?? (['PENDING', 'CONFIRMED'] as Reservation['status'][]);
    return this.v_reservations().some((r) => {
      if (r.userId !== p_userId) return false;
      if (p_excludeId && r.id === p_excludeId) return false;
      if (!statusesToCheck.includes(r.status)) return false;
      return this.overlapsSession(p_startISO, p_endISO, r.startHour, r.endHour);
    });
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

  /** create a new pending reservation */
  createPendingReservation(
    p_userId: number,
    p_session: Session,
    p_movieTitle?: string,
    p_moviePosterPath?: string,
  ): Reservation {
    const v_pending: Reservation = {
      id: this.nextId(),
      userId: p_userId,
      tmdbId: p_session.tmdbId,
      roomId: p_session.roomId,
      startHour: p_session.start,
      endHour: p_session.end,
      version: p_session.version,
      quantity: 1,
      ticketType: 'ADULT',
      price: this.getPriceForCustomerType('ADULT', 1),
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      movieTitle: p_movieTitle,
      moviePosterPath: p_moviePosterPath,
    };

    this.v_reservations.update((reservations) => [...reservations, v_pending]);
    this.saveToLocalStorage();
    return v_pending;
  }

  /** Get reservation by Id */
  getReservationById(p_id: number): Reservation | undefined {
    return this.v_reservations().find((v_res) => v_res.id === p_id);
  }

  /** Get reservations by USER */
  getUsersReservations(p_userId: number): Reservation[] {
    return this.v_reservations().filter((v_res) => v_res.userId === p_userId);
  }

  /** Get user's reservation by status */
  getByStatus(p_userId: number, p_status: ReservationStatus): Reservation[] {
    return this.getUsersReservations(p_userId).filter((v_res) => v_res.status === p_status);
  }

  /** Confirm a pending reservation */
  confirmReservation(
    p_id: number,
    p_ticketType: TicketType,
    p_quantity = 1,
  ): Reservation | undefined {
    const v_listRes = this.v_reservations();
    const v_index = v_listRes.findIndex((v_res) => v_res.id === p_id);
    if (v_index < 0) return;

    if (!p_ticketType) {
      throw new Error('Ticket type missing');
    }
    if (!Number.isFinite(p_quantity) || p_quantity < 1) {
      throw new Error('quantity invalide (at least 1)');
    }

    const v_current = v_listRes[v_index];

    if (
      this.hasTimeConflict(v_current.userId, v_current.startHour, v_current.endHour, v_current.id)
    ) {
      throw new Error('You already have a reservation at this time.');
    }

    const v_sameRes =
      v_current.status === 'CONFIRMED' &&
      v_current.ticketType === p_ticketType &&
      (v_current.quantity ?? 1) === p_quantity;

    if (v_sameRes) return v_current;

    const v_price = this.getPriceForCustomerType(p_ticketType, p_quantity);

    const updated: Reservation = {
      ...v_current,
      ticketType: p_ticketType,
      quantity: p_quantity,
      price: v_price,
      status: 'CONFIRMED',
    };

    const v_newList = [...v_listRes];
    v_newList[v_index] = updated;
    this.v_reservations.set(v_newList);
    this.saveToLocalStorage();

    return updated;
  }

  /** Cancel a reservation */
  cancelReservation(id: number): Reservation | undefined {
    const v_listRes = this.v_reservations();
    const v_index = v_listRes.findIndex((v_res) => Number(v_res.id) === Number(id));
    if (v_index < 0) return;

    const v_current = v_listRes[v_index];
    const v_updated: Reservation = { ...v_current, status: 'CANCELLED' };

    const v_newList = [...v_listRes];
    v_newList[v_index] = v_updated;

    this.v_reservations.set(v_newList);
    this.saveToLocalStorage();
    return v_updated;
  }

  /** Reserve again after cancel */
  reserveAgain(id: number): Reservation | undefined {
    const v_listRes = this.v_reservations();
    const v_index = v_listRes.findIndex((v_res) => Number(v_res.id) === Number(id));
    if (v_index < 0) return;

    const v_current = v_listRes[v_index];
    if (new Date(v_current.startHour).getTime() < Date.now()) {
      throw new Error('La séance est déjà passée');
    }

    const updated: Reservation = { ...v_current, status: 'CONFIRMED' };

    const newList = [...v_listRes];
    newList[v_index] = updated;

    this.v_reservations.set(newList);
    this.saveToLocalStorage();
    return updated;
  }

  /** save update pending reservation */
  updatePartial(id: number, patch: Partial<Reservation>): Reservation | undefined {
    const v_listReservation = this.v_reservations();
    const v_index = v_listReservation.findIndex((v_res) => v_res.id === id);
    if (v_index < 0) return;

    const v_prev = v_listReservation[v_index];
    const v_next: Reservation = { ...v_prev, ...patch };

    const v_sameRes =
      (v_next.ticketType ?? null) === (v_prev.ticketType ?? null) &&
      (v_next.quantity ?? 1) === (v_prev.quantity ?? 1);

    if (v_sameRes) return v_prev;

    const v_newList = [...v_listReservation];
    v_newList[v_index] = v_next;
    this.v_reservations.set(v_newList);
    this.saveToLocalStorage();
    return v_next;
  }

  /** Find pending reservation by user*/
  findPendingReservationBySession(p_userId: number, p_session: Session) {
    return this.v_reservations().find(
      (v_res) =>
        v_res.userId === p_userId &&
        v_res.tmdbId === p_session.tmdbId &&
        v_res.roomId === p_session.roomId &&
        v_res.startHour === p_session.start &&
        v_res.status === 'PENDING',
    );
  }
}
