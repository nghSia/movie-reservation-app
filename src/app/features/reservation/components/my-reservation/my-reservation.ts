import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { AuthService } from '../../../auth/services/auth-service';
import { TmdbService } from '../../../home/services/tmdb.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-my-reservation',
  imports: [CommonModule],
  template: `
    <div class="py-8">
      <div class="bg-gray-100 text-black p-6 space-y-8 max-w-5xl mx-auto rounded-3xl shadow-lg">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">Mes réservations</h2>

          <div class="inline-flex rounded-xl overflow-hidden border border-gray-700">
            <button
              class="px-3 py-1 text-sm"
              [class.bg-blue-200]="!showCancelled()"
              (click)="showCancelled.set(false)"
            >
              Actives
            </button>
            <button
              class="px-3 py-1 text-sm"
              [class.bg-blue-200]="showCancelled()"
              (click)="showCancelled.set(true)"
            >
              Annulées ({{ cancelled().length }})
            </button>
          </div>
        </div>

        <!-- Actives: Pending + Confirmed -->
        @if (!showCancelled()) {
          <section class="space-y-3">
            <h3 class="text-lg font-semibold">En attente de confirmation</h3>
            @if (pending().length) {
              <div class="space-y-3">
                @for (r of pending(); track r.id) {
                  <div class="flex justify-between items-center p-4 bg-gray-900 rounded-2xl">
                    <!-- LEFT: poster + infos -->
                    <div class="flex items-start gap-3">
                      @if (getMoviePoster(r.tmdbId); as p) {
                        <img
                          [src]="p"
                          class="w-16 h-24 rounded-lg object-cover shrink-0"
                          alt="{{ getMovieTitle(r.tmdbId) }}"
                        />
                      } @else {
                        <div class="w-16 h-24 rounded-lg bg-gray-800 shrink-0"></div>
                      }
                      <div class="flex-1">
                        <div class="font-bold">{{ getMovieTitle(r.tmdbId) }}</div>
                        <div class="text-sm text-gray-400">
                          {{ r.startHour | date: 'EEE d MMM HH:mm' : 'Europe/Paris' }}
                          • Salle #{{ r.roomId }} • {{ r.version }}
                        </div>
                      </div>
                    </div>

                    <!-- RIGHT: actions -->
                    <div class="flex gap-2">
                      <button
                        class="px-3 py-1 bg-teal-400 text-black rounded-lg hover:bg-teal-300"
                        (click)="goFinalize(r)"
                      >
                        Finaliser
                      </button>
                      <button
                        class="px-3 py-1 border border-gray-600 rounded-lg hover:bg-gray-800"
                        (click)="cancel(r)"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500">Aucune réservation en attente.</p>
            }
          </section>

          <section class="space-y-3">
            <h3 class="text-lg font-semibold">Confirmées</h3>
            @if (confirmed().length) {
              <div class="space-y-3">
                @for (r of confirmed(); track r.id) {
                  <div class="p-4 bg-gray-900 rounded-2xl">
                    <div class="flex items-start gap-3">
                      @if (getMoviePoster(r.tmdbId); as p) {
                        <img
                          [src]="p"
                          class="w-16 h-24 rounded-lg object-cover shrink-0"
                          alt="{{ getMovieTitle(r.tmdbId) }}"
                        />
                      } @else {
                        <div class="w-16 h-24 rounded-lg bg-gray-800 shrink-0"></div>
                      }
                      <div class="flex-1">
                        <div class="font-bold">{{ getMovieTitle(r.tmdbId) }}</div>
                        <div class="text-sm text-gray-400">
                          {{ r.startHour | date: 'EEE d MMM HH:mm' : 'Europe/Paris' }}
                          • Salle #{{ r.roomId }} • {{ r.version }}
                        </div>

                        @if (r.price !== undefined) {
                          <div class="mt-1 text-gray-300">
                            {{ r.quantity || 1 }} ×
                            {{ r.price! / (r.quantity || 1) | currency: 'EUR' }}
                            <span class="opacity-60 mx-1">•</span>
                            <b>{{ r.price | currency: 'EUR' }}</b>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500">Aucune réservation confirmée.</p>
            }
          </section>
        }

        <!-- Onglet Annulées -->
        @if (showCancelled()) {
          <section class="space-y-3">
            <h3 class="text-lg font-semibold">Annulées</h3>
            @if (cancelled().length) {
              <div class="space-y-3">
                @for (r of cancelled(); track r.id) {
                  <div class="flex justify-between items-center p-4 bg-gray-900 rounded-2xl">
                    <div class="flex items-start gap-3">
                      @if (getMoviePoster(r.tmdbId); as p) {
                        <img
                          [src]="p"
                          class="w-16 h-24 rounded-lg object-cover shrink-0"
                          alt="{{ getMovieTitle(r.tmdbId) }}"
                        />
                      } @else {
                        <div class="w-16 h-24 rounded-lg bg-gray-800 shrink-0"></div>
                      }
                      <div class="flex-1">
                        <div class="font-bold">{{ getMovieTitle(r.tmdbId) }}</div>
                        <div class="text-sm text-gray-400">
                          {{ r.startHour | date: 'EEE d MMM HH:mm' : 'Europe/Paris' }}
                          • Salle #{{ r.roomId }} • {{ r.version }}
                        </div>
                      </div>
                    </div>

                    <button
                      class="px-3 py-1 bg-teal-400 text-black rounded-lg hover:bg-teal-300 disabled:opacity-50"
                      [disabled]="isPast(r)"
                      (click)="reserveAgain(r)"
                    >
                      Reserve again
                    </button>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500">Aucune réservation annulée.</p>
            }
          </section>
        }
      </div>
    </div>
  `,
})
export class MyReservation {
  private c_router = inject(Router);
  private s_reservationService = inject(ReservationService);
  private s_authService = inject(AuthService);
  private s_tmdbService = inject(TmdbService);

  showCancelled = signal(false);

  /** Get current user */
  private currentUser = computed(() => {
    const u = this.s_authService.v_currentUser$?.();
    if (u) return u;
    try {
      return JSON.parse(localStorage.getItem('currentUser') ?? 'null');
    } catch {
      return null;
    }
  });

  /** Current user id */
  private userId = computed(() => Number(this.currentUser()?.id ?? NaN));

  private listReservation = computed<Reservation[]>(() => {
    const s = this.s_reservationService.v_reservations$?.() ?? [];
    if (s.length) return s;
    try {
      return JSON.parse(localStorage.getItem('reservations') ?? '[]') as Reservation[];
    } catch {
      return [];
    }
  });

  private all = computed<Reservation[]>(() =>
    this.listReservation().filter((v_res) => Number(v_res.userId) === this.userId()),
  );

  private byStart(a: Reservation, b: Reservation) {
    return new Date(a.startHour).getTime() - new Date(b.startHour).getTime();
  }

  pending = computed(() =>
    this.all()
      .filter((r) => r.status === 'PENDING')
      .slice()
      .sort(this.byStart),
  );
  confirmed = computed(() =>
    this.all()
      .filter((r) => r.status === 'CONFIRMED')
      .slice()
      .sort(this.byStart),
  );
  cancelled = computed(() =>
    this.all()
      .filter((r) => r.status === 'CANCELLED')
      .slice()
      .sort(this.byStart),
  );

  private moviesById = signal<Record<number, { title: string; posterUrl: string | null }>>({});

  constructor() {
    effect(() => {
      const ids = Array.from(new Set(this.all().map((r) => r.tmdbId)));
      const missing = ids.filter((id) => !this.moviesById()[id]);
      if (!missing.length) return;

      missing.forEach(async (id) => {
        try {
          const movie = await firstValueFrom(this.s_tmdbService.movieDetails(id));
          const title = movie?.title ?? '(Sans titre)';
          const posterUrl = movie?.poster_path
            ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
            : null;
          this.moviesById.update((m) => ({ ...m, [id]: { title, posterUrl } }));
        } catch {
          this.moviesById.update((m) => ({
            ...m,
            [id]: { title: '(Film indisponible)', posterUrl: null },
          }));
        }
      });
    });
  }

  getMovieTitle = (tmdbId: number) => this.moviesById()[tmdbId]?.title ?? 'Film';
  getMoviePoster = (tmdbId: number) => this.moviesById()[tmdbId]?.posterUrl ?? null;

  /** Finalize pending reservation */
  goFinalize(p_reservation: Reservation) {
    if (
      !p_reservation.tmdbId ||
      !p_reservation.roomId ||
      !p_reservation.startHour ||
      !p_reservation.endHour ||
      !p_reservation.version
    ) {
      alert('Infos de séance manquantes pour cette réservation.');
      return;
    }

    this.c_router.navigate(['/reservation'], {
      queryParams: {
        tmdbId: p_reservation.tmdbId,
        roomId: p_reservation.roomId,
        start: p_reservation.startHour,
        end: p_reservation.endHour,
        version: p_reservation.version,
      },
    });
  }

  /** Cancel reservation */
  cancel(p_reservation: Reservation) {
    this.s_reservationService.cancelReservation(p_reservation.id);
  }

  /** Reserve again */
  reserveAgain(r: Reservation) {
    try {
      this.s_reservationService.reserveAgain(r.id);
    } catch (obs_ex) {
      alert((obs_ex as Error).message);
    }
  }

  /** check if reservation is in past */
  isPast(p_reservation: Reservation): boolean {
    return new Date(p_reservation.startHour).getTime() < Date.now();
  }
}
