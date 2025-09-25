import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HighlightDirective } from '../../../../shared/directives/highlight.directive';
import { DateFrPipe } from '../../../../shared/pipes/date-fr.pipe';
import { AuthService } from '../../../auth/services/auth-service';
import { TmdbService } from '../../../home/services/tmdb.service';
import { Reservation } from '../../models/reservation.model';
import { ReservationService } from '../../services/reservation.service';

@Component({
  standalone: true,
  selector: 'app-my-reservation',
  imports: [CommonModule, HighlightDirective, DateFrPipe],
  template: `
    <div class="py-8">
      <div
        class="bg-secondary-50 text-secondary-900 p-6 space-y-8 max-w-5xl mx-auto rounded-3xl shadow-soft border border-secondary-100"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">Mes réservations</h2>

          <div class="inline-flex rounded-xl overflow-hidden border border-secondary-200 bg-white">
            <button
              class="px-3 py-1 text-sm transition-colors hover:bg-secondary-100 hover:text-secondary-900"
              [class.bg-accent-100]="!showCancelled()"
              (click)="showCancelled.set(false)"
            >
              Actives
            </button>
            <button
              class="px-3 py-1 text-sm transition-colors hover:bg-secondary-100 hover:text-secondary-900"
              [class.bg-accent-100]="showCancelled()"
              (click)="showCancelled.set(true)"
            >
              Annulées ({{ cancelled().length }})
            </button>
          </div>
        </div>

        @if (!showCancelled()) {
          <section class="space-y-3">
            <h3 class="text-lg font-semibold text-secondary-800">En attente de confirmation</h3>
            @if (pending().length) {
              <div class="space-y-3">
                @for (v_res of pending(); track v_res.id) {
                  <div
                    class="flex justify-between items-center p-4 bg-secondary-800 rounded-2xl"
                    [appHighlight]="
                      v_res.status === 'CONFIRMED'
                        ? '#d1fae5'
                        : v_res.status === 'CANCELLED'
                          ? '#fecaca'
                          : null
                    "
                  >
                    <div class="flex items-start gap-3">
                      @if (getPoster(v_res); as p) {
                        <img
                          [src]="p"
                          class="w-16 h-24 rounded-lg object-cover shrink-0"
                          alt="{{ getTitle(v_res) }}"
                        />
                      } @else {
                        <div class="w-16 h-24 rounded-lg bg-secondary-700 shrink-0"></div>
                      }
                      <div class="flex-1">
                        <div class="font-bold text-secondary-100">{{ getTitle(v_res) }}</div>
                        <div class="text-sm text-secondary-200">
                          {{ v_res.startHour | dateFr }}
                          • Salle #{{ v_res.roomId }} • {{ v_res.version }}
                        </div>
                      </div>
                    </div>

                    <div class="flex gap-2">
                      @if (!isPastSession(v_res.startHour)) {
                        <button
                          class="px-3 py-1 rounded-lg bg-primary-500 text-white transition-colors
                             hover:bg-secondary-100 hover:text-secondary-900 focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-primary-300"
                          (click)="validateReservation(v_res)"
                        >
                          Finaliser
                        </button>
                        <button
                          class="px-3 py-1 rounded-lg border border-secondary-300 bg-white text-secondary-900 transition-colors
                             hover:bg-secondary-100 hover:text-secondary-900 focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-primary-200"
                          (click)="cancelReservation(v_res)"
                        >
                          Annuler
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-secondary-500">Aucune réservation en attente.</p>
            }
          </section>

          <section class="space-y-3">
            <h3 class="text-lg font-semibold text-black">Confirmées</h3>
            @if (confirmed().length) {
              <div class="space-y-3">
                @for (v_res of confirmed(); track v_res.id) {
                  <div
                    class="p-4 bg-secondary-800 rounded-2xl"
                    [appHighlight]="
                      v_res.status === 'CONFIRMED'
                        ? '#d1fae5'
                        : v_res.status === 'CANCELLED'
                          ? '#fecaca'
                          : null
                    "
                  >
                    <div class="flex items-start gap-3">
                      @if (getPoster(v_res); as p) {
                        <img
                          [src]="p"
                          class="w-16 h-24 rounded-lg object-cover shrink-0"
                          alt="{{ getTitle(v_res) }}"
                        />
                      } @else {
                        <div class="w-16 h-24 rounded-lg bg-secondary-700 shrink-0"></div>
                      }
                      <div class="flex-1">
                        <div class="font-bold text-black">{{ getTitle(v_res) }}</div>
                        <div class="text-sm text-black">
                          {{ v_res.startHour | dateFr }}
                          • Salle #{{ v_res.roomId }} • {{ v_res.version }}
                        </div>

                        @if (v_res.price !== undefined) {
                          <div class="mt-1 text-black">
                            {{ v_res.quantity || 1 }} ×
                            {{ v_res.price! / (v_res.quantity || 1) | currency: 'EUR' }}
                            <span class="opacity-60 mx-1">•</span>
                            <b>{{ v_res.price | currency: 'EUR' }}</b>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-secondary-500">Aucune réservation confirmée.</p>
            }
          </section>
        }

        @if (showCancelled()) {
          <section class="space-y-3">
            <h3 class="text-lg font-semibold text-secondary-800">Annulées</h3>
            @if (cancelled().length) {
              <div class="space-y-3">
                @for (v_res of cancelled(); track v_res.id) {
                  <div
                    class="flex justify-between items-center p-4 bg-secondary-800 rounded-2xl"
                    [appHighlight]="
                      v_res.status === 'CONFIRMED'
                        ? '#d1fae5'
                        : v_res.status === 'CANCELLED'
                          ? '#fecaca'
                          : null
                    "
                  >
                    <div class="flex items-start gap-3">
                      @if (getPoster(v_res); as p) {
                        <img
                          [src]="p"
                          class="w-16 h-24 rounded-lg object-cover shrink-0"
                          alt="{{ getTitle(v_res) }}"
                        />
                      } @else {
                        <div class="w-16 h-24 rounded-lg bg-secondary-700 shrink-0"></div>
                      }
                      <div class="flex-1">
                        <div class="font-bold text-secondary-100">{{ getTitle(v_res) }}</div>
                        <div class="text-sm text-secondary-200">
                          {{ v_res.startHour | dateFr }}
                          • Salle #{{ v_res.roomId }} • {{ v_res.version }}

                          @if (v_res.price !== undefined) {
                            <div class="mt-1 text-secondary-100">
                              {{ v_res.quantity || 1 }} ×
                              {{ v_res.price! / (v_res.quantity || 1) | currency: 'EUR' }}
                              <span class="opacity-60 mx-1">•</span>
                              <b>{{ v_res.price | currency: 'EUR' }}</b>
                            </div>
                          }
                        </div>
                      </div>
                    </div>

                    @if (!isPastSession(v_res.startHour)) {
                      <button
                        class="px-3 py-1 rounded-lg bg-primary-500 text-white transition-colors
                           hover:bg-secondary-100 hover:text-secondary-900 focus:outline-none
                           focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-50"
                        (click)="validateReservation(v_res)"
                      >
                        Reserve again
                      </button>
                    }
                  </div>
                }
              </div>
            } @else {
              <p class="text-secondary-500">Aucune réservation annulée.</p>
            }
          </section>
        }
      </div>
    </div>
  `,
})
export class MyReservation {
  private s_reservationService = inject(ReservationService);
  private s_authService = inject(AuthService);
  private s_tmdbService = inject(TmdbService);
  showCancelled = signal(false);

  private m_currentUser = computed(() => {
    const v_user = this.s_authService.v_currentUser$?.();
    if (v_user) return v_user;
    try {
      return JSON.parse(localStorage.getItem('currentUser') ?? 'null');
    } catch {
      return null;
    }
  });

  /** Current user id */
  private m_userId = computed(() => Number(this.m_currentUser()?.id ?? NaN));

  /** Get all reservations */
  private m_listReservation = computed<Reservation[]>(() => {
    const s = this.s_reservationService.v_reservations$?.() ?? [];
    if (s.length) return s;
    try {
      return JSON.parse(localStorage.getItem('reservations') ?? '[]') as Reservation[];
    } catch {
      return [];
    }
  });

  /** Get all reservation of current user */
  private m_allUserRes = computed<Reservation[]>(() =>
    this.m_listReservation().filter((v_res) => Number(v_res.userId) === this.m_userId()),
  );

  private byStart(a: Reservation, b: Reservation) {
    return new Date(a.startHour).getTime() - new Date(b.startHour).getTime();
  }

  /** Sort pending reservation */
  pending = computed(() =>
    this.m_allUserRes()
      .filter((v_res) => v_res.status === 'PENDING')
      .slice()
      .sort(this.byStart),
  );

  /** Sort confirmed reservation */
  confirmed = computed(() =>
    this.m_allUserRes()
      .filter((v_res) => v_res.status === 'CONFIRMED')
      .slice()
      .sort(this.byStart),
  );

  /** Sort cancelled reservation */
  cancelled = computed(() =>
    this.m_allUserRes()
      .filter((v_res) => v_res.status === 'CANCELLED')
      .slice()
      .sort(this.byStart),
  );

  private m_moviesById = signal<Record<number, { title: string; posterUrl: string | null }>>({});

  /**
   * Verify we have all film information
   */
  constructor() {
    effect(() => {
      const v_idRes = Array.from(new Set(this.m_allUserRes().map((v_res) => v_res.tmdbId)));
      const v_missing = v_idRes.filter((v_id) => !this.m_moviesById()[v_id]);
      if (!v_missing.length) return;

      v_missing.forEach(async (v_id) => {
        try {
          const movie = await firstValueFrom(this.s_tmdbService.movieDetails(v_id));
          const title = movie?.title ?? '(Sans titre)';
          const posterUrl = movie?.poster_path
            ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
            : null;
          this.m_moviesById.update((m) => ({ ...m, [v_id]: { title, posterUrl } }));
        } catch {
          this.m_moviesById.update((m) => ({
            ...m,
            [v_id]: { title: '(Film indisponible)', posterUrl: null },
          }));
        }
      });
    });
  }

  /** Get Movie Title */
  getTitle = (p_reservation: Reservation) =>
    p_reservation.movieTitle ?? this.m_moviesById()[p_reservation.tmdbId]?.title ?? 'Film';

  /** Get Movie Poster */
  getPoster = (p_reservation: Reservation) =>
    p_reservation.moviePosterPath ?? this.m_moviesById()[p_reservation.tmdbId]?.posterUrl ?? null;

  /** Validate reservation */
  validateReservation(p_reservation: Reservation) {
    if (this.s_reservationService.isPast(p_reservation.startHour)) return;
    this.s_reservationService.updateReservation(
      { id: p_reservation.id, userId: p_reservation.userId, tmdbId: p_reservation.tmdbId },
      { status: 'CONFIRMED' },
    );
  }

  /** Cancel reservation */
  cancelReservation(p_reservation: Reservation) {
    if (this.s_reservationService.isPast(p_reservation.startHour)) return;
    this.s_reservationService.updateReservation(
      { id: p_reservation.id, userId: p_reservation.userId, tmdbId: p_reservation.tmdbId },
      { status: 'CANCELLED' },
    );
  }

  /** Verify if the session is passed */
  isPastSession(p_startHour: string) {
    return this.s_reservationService.isPast(p_startHour);
  }
}
