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

type ReservationMutableFields =
  | 'roomId'
  | 'startHour'
  | 'endHour'
  | 'version'
  | 'ticketType'
  | 'price'
  | 'quantity'
  | 'movieTitle'
  | 'moviePosterPath'
  | 'createdAt'
  | 'status';
type ReservationPatch = Partial<Pick<Reservation, ReservationMutableFields>>;

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private v_reservations = signal<Reservation[]>([]);
  public v_reservations$ = this.v_reservations.asReadonly();

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
    const vfirstStart = this.epochLocal(this.toLocalMinuteISO(p_firstSessionStartISO));
    const vfirstEnd = this.epochLocal(this.toLocalMinuteISO(p_firstSessionEndISO));
    const vsecondStart = this.epochLocal(this.toLocalMinuteISO(p_secondSessionStartISO));
    const vsecondEnd = this.epochLocal(this.toLocalMinuteISO(p_secondSessionEndISO));
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
    const v_startLocal = this.toLocalMinuteISO(p_startISO);
    const v_endLocal = this.toLocalMinuteISO(p_endISO);

    const v_start = Date.parse(v_startLocal),
      v_end = Date.parse(v_endLocal);
    if (!Number.isFinite(v_start) || !Number.isFinite(v_end) || v_start >= v_end) return false;

    const statusesToCheck = p_statuses ?? (['PENDING', 'CONFIRMED'] as Reservation['status'][]);
    return this.v_reservations().some((r) => {
      if (r.userId !== p_userId) return false;
      if (p_excludeId && r.id === p_excludeId) return false;
      if (!statusesToCheck.includes(r.status)) return false;
      return this.overlapsSession(v_startLocal, v_endLocal, r.startHour, r.endHour);
    });
  }

  /** Check how many seats are left in a room for a specific session */
  seatsLeft(p_room: MovieRoom, p_session: Session): number {
    const booked = this.v_reservations()
      .filter(
        (r) =>
          r.status === 'CONFIRMED' &&
          r.roomId === p_session.roomId &&
          r.startHour === this.toLocalMinuteISO(p_session.start) &&
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
    const v_startLocal = this.toLocalMinuteISO(p_session.start);
    const v_endLocal = this.toLocalMinuteISO(p_session.end);

    if (this.hasTimeConflict(p_userId, v_startLocal, v_endLocal)) {
      throw new Error('You already have a reservation at this time.');
    }
    const v_clash = this.findByComposite(p_userId, p_session.tmdbId, v_startLocal);
    if (v_clash) {
      if (v_clash.status === 'CANCELLED') {
        return this.updateReservation(
          { id: v_clash.id, userId: v_clash.userId, tmdbId: v_clash.tmdbId },
          {
            roomId: p_session.roomId,
            startHour: v_startLocal,
            endHour: v_endLocal,
            version: p_session.version,
            quantity: 1,
            ticketType: 'ADULT',
            price: this.getPriceForCustomerType('ADULT', 1),
            status: 'PENDING',
            createdAt: this.toLocalMinuteISO(new Date()),
            movieTitle: p_movieTitle ?? v_clash.movieTitle,
            moviePosterPath: p_moviePosterPath ?? v_clash.moviePosterPath,
          },
        )!;
      }
      throw new Error('DUPLICATE_RESERVATION');
    }

    const v_pending: Reservation = {
      id: this.nextId(),
      userId: p_userId,
      tmdbId: p_session.tmdbId,
      roomId: p_session.roomId,
      startHour: v_startLocal,
      endHour: v_endLocal,
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

  /** Find pending reservation by user*/
  findPendingReservationBySession(p_userId: number, p_session: Session) {
    return this.v_reservations().find(
      (v_res) =>
        v_res.userId === p_userId &&
        v_res.tmdbId === p_session.tmdbId &&
        v_res.roomId === p_session.roomId &&
        v_res.startHour === this.toLocalMinuteISO(p_session.start) &&
        v_res.status === 'PENDING',
    );
  }

  /** Normalise une ISO (UTC) à la minute, ex: 2025-09-24T16:00 */
  private toMinuteKey(p_iso: string): string {
    return this.toLocalMinuteISO(p_iso);
  }

  /** Convert any date input (ISO string or Date) to a *local wall time* ISO */
  public isPast(startISO: string): boolean {
    return this.epochLocal(this.toLocalMinuteISO(startISO)) < Date.now();
  }

  /** Convert any date input (ISO string or Date) to a *local wall time* ISO */
  public toLocalMinuteISO(p_iso: string | Date): string {
    const v_d = typeof p_iso === 'string' ? new Date(p_iso) : p_iso;
    const v_yyyy = v_d.getFullYear();
    const v_mm = String(v_d.getMonth() + 1).padStart(2, '0');
    const v_dd = String(v_d.getDate()).padStart(2, '0');
    const v_hh = String(v_d.getHours()).padStart(2, '0');
    const v_mi = String(v_d.getMinutes()).padStart(2, '0');
    return `${v_yyyy}-${v_mm}-${v_dd}T${v_hh}:${v_mi}`;
  }

  /** Epoch time (ms) from an ISO or Date interpreted in *local time* */
  public epochLocal(p_iso: string | Date): number {
    const v_date = typeof p_iso === 'string' ? new Date(p_iso) : p_iso;
    return v_date.getTime();
  }

  /** Find an existing reservation for the same user + movie (tmdbId) + local start minute. */
  private findByComposite(p_userId: number, p_tmdbId: number, p_startISO: string) {
    const v_key = this.toMinuteKey(p_startISO);
    return this.v_reservations().find(
      (r) =>
        Number(r.userId) === Number(p_userId) &&
        Number(r.tmdbId) === Number(p_tmdbId) &&
        this.toMinuteKey(r.startHour) === v_key,
    );
  }

  /** Find a reservation by key information */
  private findReservationByKeys(p_match: { id: number; userId: number; tmdbId: number }) {
    const v_listRes = this.v_reservations();
    const v_index = v_listRes.findIndex(
      (v_res) =>
        Number(v_res.id) === Number(p_match.id) &&
        Number(v_res.userId) === Number(p_match.userId) &&
        Number(v_res.tmdbId) === Number(p_match.tmdbId),
    );
    if (v_index < 0) return null;
    return { v_index, v_current: v_listRes[v_index], v_listRes };
  }

  /** update a specific reservation by given values*/
  public updateReservation(
    p_match: { id: number; userId: number; tmdbId: number },
    p_patch: ReservationPatch,
  ): Reservation | undefined {
    const v_found = this.findReservationByKeys(p_match);
    if (!v_found) return;

    const { v_index, v_current, v_listRes } = v_found;

    if ('id' in p_patch || 'userId' in p_patch || 'tmdbId' in p_patch) {
      throw new Error('IMMUTABLE_KEYS');
    }

    const v_updated: Reservation = {
      ...v_current,
      ...p_patch,
      startHour: p_patch.startHour ? this.toLocalMinuteISO(p_patch.startHour) : v_current.startHour,
      endHour: p_patch.endHour ? this.toLocalMinuteISO(p_patch.endHour) : v_current.endHour,
      createdAt: p_patch.createdAt ? this.toLocalMinuteISO(p_patch.createdAt) : v_current.createdAt,
      id: v_current.id,
      userId: v_current.userId,
      tmdbId: v_current.tmdbId,
    };

    const v_newList = [...v_listRes];
    v_newList[v_index] = v_updated;

    this.v_reservations.set(v_newList);
    this.saveToLocalStorage();
    return v_updated;
  }
}
