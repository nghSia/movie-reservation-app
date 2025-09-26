import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../auth/services/auth-service';
import { TmdbService } from '../../home/services/tmdb.service';
import { MovieVersion, Session } from '../../movie-details/models/session.model';
import { Reservation, TicketType } from '../models/reservation.model';
import { ReservationService } from '../services/reservation.service';

@Component({
  standalone: true,
  selector: 'app-reservation-film',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center py-8">
      @if (m_reservation(); as v_res) {
        <div
          class="w-full max-w-2xl bg-secondary-50 border border-secondary-100 rounded-2xl p-6 shadow-soft"
        >
          <div class="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
            <div
              class="w-[120px] h-[180px] bg-white border border-secondary-100 rounded-xl flex items-center justify-center overflow-hidden"
            >
              @if (v_posterUrl()) {
                <img
                  class="w-full h-full object-cover"
                  [src]="v_posterUrl()!"
                  [alt]="v_movieDetails()?.title || 'Poster'"
                />
              } @else {
                <span class="text-secondary-500 text-sm">No Poster</span>
              }
            </div>

            <div>
              <h2 class="text-xl font-bold mb-1 text-secondary-900">
                {{ v_movieDetails()?.title || 'Film' }}
              </h2>
              <p class="text-secondary-700 text-sm font-bold">
                @if (v_res.startHour && v_res.endHour) {
                  {{ v_res.startHour | date: 'EEEE d MMMM • HH:mm' : 'Europe/Paris' }} —
                  {{ v_res.endHour | date: 'HH:mm' : 'Europe/Paris' }}
                } @else {
                  Horaire indisponible
                }
              </p>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-secondary-800" for="ticketType">
                Catégorie de client
              </label>
              <select
                id="ticketType"
                [ngModel]="m_selectedType()"
                (ngModelChange)="m_selectedType.set($event)"
                class="w-full bg-white border border-secondary-200 rounded-lg px-3 py-2
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300
                   hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              >
                <option [ngValue]="undefined" disabled>Choisir...</option>
                @for (entry of m_priceTable | keyvalue; track entry.key) {
                  <option [ngValue]="entry.key">
                    {{ entry.key }} — {{ entry.value | currency: 'EUR' }}
                  </option>
                }
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1 mt-4 text-secondary-800" for="quantity">
                Quantité
              </label>
              <select
                id="quantity"
                [ngModel]="m_quantity()"
                (ngModelChange)="m_quantity.set($event)"
                class="w-full bg-white border border-secondary-200 rounded-lg px-3 py-2
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300
                   hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              >
                @for (q of [1, 2, 3, 4, 5, 6, 7, 8]; track q) {
                  <option [ngValue]="q">{{ q }}</option>
                }
              </select>
            </div>

            @if (m_selectedType(); as type) {
              <div class="bg-white border border-secondary-100 rounded-lg p-3">
                <p class="text-secondary-800">
                  Prix unitaire :
                  <b class="text-secondary-900">{{ m_unitPrice() | currency: 'EUR' }}</b>
                </p>
                <p class="text-secondary-800">
                  Total :
                  <b class="text-secondary-900">{{ m_totalPrice() | currency: 'EUR' }}</b>
                </p>
              </div>
            }

            <div class="flex justify-end gap-3">
              <button
                class="px-4 py-2 rounded-lg bg-primary-500 text-white font-semibold
                   hover:bg-secondary-100 hover:text-secondary-900 transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300
                   disabled:opacity-50"
                (click)="onCancel()"
              >
                Cancel
              </button>

              <button
                class="px-4 py-2 rounded-lg bg-primary-500 text-white font-semibold
                   hover:bg-secondary-100 hover:text-secondary-900 transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300
                   disabled:opacity-50"
                [disabled]="!m_selectedType()"
                (click)="onConfirm()"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      } @else {
        <p class="text-secondary-700">Aucune réservation trouvée.</p>
      }
    </div>
  `,
})
export class ReservationFilm {
  private c_route = inject(ActivatedRoute);
  private c_router = inject(Router);
  private s_reservationService = inject(ReservationService);
  private s_authService = inject(AuthService);
  private s_tmdbService = inject(TmdbService);
  private c_snackBar = inject(MatSnackBar);
  private m_userId = 0;
  private v_tmdbId = signal(0);

  m_reservation = signal<Reservation | null>(null);
  m_priceTable = this.s_reservationService.getPriceTable();

  m_selectedType = signal<TicketType | undefined>(undefined);
  m_quantity = signal<number>(1);

  m_unitPrice = computed(() =>
    this.m_selectedType() ? this.m_priceTable[this.m_selectedType()!] : 0,
  );
  m_totalPrice = computed(() => this.m_unitPrice() * (this.m_quantity() || 1));

  /**
   * Constructor of component
   * - Get user Id
   * - Get Data from query
   * - Verify and create pending reservation
   * - Save and verify partial patch
   */
  constructor() {
    const v_user = this.s_authService.getCurrentUser();
    if (!v_user) {
      this.c_router.navigateByUrl('/auth/login');
      return;
    }
    this.m_userId = v_user.id;

    const v_qp = this.c_route.snapshot.queryParamMap;
    const v_movieId = Number(v_qp.get('tmdbId')) || 0;
    const v_roomId = Number(v_qp.get('roomId'));
    const v_start = v_qp.get('start')!;
    const v_end = v_qp.get('end')!;
    const v_version = (v_qp.get('version') as MovieVersion | null)!;
    this.v_tmdbId.set(v_movieId);

    if (v_movieId === 0 || !v_roomId || !v_start || !v_end || !v_version) {
      this.c_router.navigateByUrl('/home');
      return;
    }
    const v_session: Session = {
      id: 0,
      tmdbId: v_movieId,
      roomId: v_roomId,
      start: v_start,
      end: v_end,
      version: v_version,
    };

    let v_pendingReservation = this.s_reservationService.findPendingReservationBySession(
      this.m_userId,
      v_session,
    );

    if (!v_pendingReservation) {
      const v_title = v_qp.get('title') || undefined;
      const v_poster = v_qp.get('poster') || undefined;

      try {
        v_pendingReservation = this.s_reservationService.createPendingReservation(
          this.m_userId,
          v_session,
          v_title,
          v_poster,
        );
      } catch {
        this.c_snackBar.open('You already have a reservation at this time', 'Fermer', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.c_router.navigateByUrl('/home');
        return;
      }
    }

    this.m_reservation.set(v_pendingReservation);
    this.m_selectedType.set(v_pendingReservation.ticketType);
    this.m_quantity.set(v_pendingReservation.quantity ?? 1);

    effect(() => {
      const v_current = this.m_reservation();
      if (!v_current) return;
      const v_type = this.m_selectedType();
      const v_qty = this.m_quantity() || 1;
      if (v_current.ticketType === v_type && (v_current.quantity ?? 1) === v_qty) {
        return;
      }
      untracked(() => {
        this.s_reservationService.updateReservation(
          { id: v_current.id, userId: v_current.userId, tmdbId: v_current.tmdbId },
          { ticketType: v_type, quantity: v_qty },
        );
      });
    });
  }

  /** Cancel reservation */
  onCancel() {
    const v_res = this.m_reservation();
    if (!v_res) return;

    this.cancelReservation(v_res);
    this.c_router.navigateByUrl('/home');
  }

  /** Confirm reservation */
  onConfirm() {
    const v_res = this.m_reservation();
    if (!v_res) return;

    const v_type = this.m_selectedType();
    if (!v_type) {
      alert('Select a client type');
      return;
    }
    const v_qty = Math.max(1, Number(this.m_quantity()) || 1);

    this.validateReservation(v_res, v_type, v_qty);
    untracked(() => this.c_router.navigateByUrl('/home'));
  }

  /** Get movie details */
  readonly v_movieDetails = toSignal(
    toObservable(this.v_tmdbId).pipe(
      filter((id) => id > 0),
      switchMap((id) => this.s_tmdbService.movieDetails(id)),
    ),
    { initialValue: null },
  );

  /** Get film poster */
  readonly v_posterUrl = computed(() => {
    const path = this.v_movieDetails()?.poster_path ?? null;
    return path ? this.s_tmdbService.image(path, 'w500') : null;
  });

  /** Validate reservation */
  public validateReservation(p_reservation: Reservation, p_type: TicketType, p_qty: number) {
    if (this.s_reservationService.isPast(p_reservation.startHour)) return;

    this.s_reservationService.updateReservation(
      { id: p_reservation.id, userId: p_reservation.userId, tmdbId: p_reservation.tmdbId },
      {
        status: 'CONFIRMED',
        ticketType: p_type,
        quantity: p_qty,
        price: this.s_reservationService.getPriceForCustomerType(p_type, p_qty),
      },
    );
  }

  /** Cancel reservation */
  public cancelReservation(p_reservation: Reservation) {
    if (this.s_reservationService.isPast(p_reservation.startHour)) return;
    this.s_reservationService.updateReservation(
      { id: p_reservation.id, userId: p_reservation.userId, tmdbId: p_reservation.tmdbId },
      { status: 'CANCELLED' },
    );
  }
}
