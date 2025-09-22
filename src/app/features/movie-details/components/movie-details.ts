import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { TmdbService } from '../../home/services/tmdb.service';
import { SessionServices, SessionView } from '../services/session.service.ts';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <a
      routerLink="/"
      class="text-align-center"
      class="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-pink-600 text-white hover:bg-pink-700"
      >← Retour</a
    >
    <section class="px-4 sm:px-6 lg:px-10 py-6 max-w-6xl mx-auto">
      @if (v_error()) {
        <p class="text-red-600">Impossible de charger ce film.</p>
      } @else if (!m_movie()) {
        <div class="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <div class="aspect-[2/3] rounded-2xl bg-neutral-200 animate-pulse"></div>
          <div class="space-y-4">
            <div class="h-8 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
            <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
            <div class="h-24 w-full bg-neutral-200 rounded animate-pulse"></div>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <img
            class="w-full rounded-2xl shadow object-cover aspect-[2/3]"
            [src]="v_posterUrl()"
            [alt]="m_movie()?.title || 'Affiche'"
          />

          <div class="space-y-4">
            <h1 class="text-2xl font-semibold">{{ m_movie()?.title }}</h1>

            <div class="text-sm text-neutral-500 flex flex-wrap gap-3">
              <span>{{ m_movie()?.release_date | date: 'longDate' }}</span>
              @if (m_movie()?.runtime) {
                <span>• {{ m_movie()?.runtime }} min</span>
              }
              @if (m_movie()?.vote_average) {
                <span>• ★ {{ m_movie()?.vote_average | number: '1.1-1' }}/10</span>
              }
            </div>

            @if (m_movie()?.genres?.length) {
              <div class="flex gap-2 flex-wrap">
                @for (g of m_movie()!.genres; track g.id) {
                  <span
                    class="text-xs bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-full"
                  >
                    {{ g.name }}
                  </span>
                }
              </div>
            }

            @if (m_movie()?.overview) {
              <p class="text-sm text-neutral-700 leading-relaxed">{{ m_movie()?.overview }}</p>
            }
          </div>
        </div>
      }
    </section>

    <div class="flex gap-3">
      <button
        class="px-4 py-2 rounded-xl"
        [class.bg-pink-600]="m_tab() === 'today'"
        (click)="m_tab.set('today')"
      >
        AUJOURD'HUI
      </button>
      <button
        class="px-4 py-2 rounded-xl"
        [class.bg-pink-600]="m_tab() === 'tomorrow'"
        (click)="m_tab.set('tomorrow')"
      >
        DEMAIN
      </button>
    </div>

    @if (m_movie()) {
      <div class="mt-6 grid gap-4 md:grid-cols-3">
        @for (
          v_session of m_tab() === 'today' ? v_showtimes().obs_today : v_showtimes().obs_tomorrow;
          track v_session.session.id
        ) {
          <button
            class="rounded-xl bg-pink-500 text-white p-4 text-left hover:opacity-90
              disabled:opacity-40 disabled:cursor-not-allowed
              disabled:hover:opacity-40 disabled:pointer-events-none
              disabled:grayscale"
            [disabled]="v_isPastSession(v_session) || v_session.seatsLeft === 0"
            [routerLink]="['/reservation']"
            [queryParams]="{
              tmdbId: v_session.session.tmdbId,
              roomId: v_session.room.id,
              start: v_session.session.start,
              end: v_session.session.end,
              version: v_session.session.version,
            }"
          >
            <div class="text-sm">{{ v_session.session.version }}</div>
            <div class="text-2xl font-bold">
              {{ v_session.session.start | date: 'EEE d MMM HH:mm' : 'Europe/Paris' }}
            </div>
            <div class="text-2xl opacity-80">
              fin {{ v_session.session.end | date: 'HH:mm' : 'Europe/Paris' }}
            </div>
            <div class="mt-2 text-sm">{{ v_session.room.name }}</div>
            <div class="text-xs mt-1" [class.text-rose-300]="v_session.seatsLeft === 0">
              {{
                v_session.seatsLeft === 0 ? 'Complet' : v_session.seatsLeft + ' places restantes'
              }}
            </div>
          </button>
        }
      </div>
    }
  `,
})
export class MovieDetails {
  private c_route = inject(ActivatedRoute);
  private s_tmdbService = inject(TmdbService);
  private s_sessionService = inject(SessionServices);

  m_tab = signal<'today' | 'tomorrow'>('today');

  /** check id param in Url and get movie details */
  readonly m_movie = toSignal(
    this.c_route.paramMap.pipe(
      map((pm) => Number(pm.get('id'))),
      filter((id): id is number => !!id && !Number.isNaN(id)),
      switchMap((id) => this.s_tmdbService.movieDetails(id).pipe(catchError(() => of(null)))),
    ),
    { initialValue: null },
  );

  /** set error state */
  readonly v_error = computed(() => this.m_movie() === null);

  /** Get poster Url if movie exists */
  readonly v_posterUrl = computed(() =>
    this.s_tmdbService.image(this.m_movie()?.poster_path ?? null, 'w500'),
  );

  /** Tab state: today / tomorrow */
  readonly v_showtimes = computed(() => {
    const m_movie = this.m_movie();
    if (!m_movie) return { obs_today: [], obs_tomorrow: [] };
    const v_runtime = m_movie.runtime ?? 120;
    const v_showtimes = this.s_sessionService.getSessionTimesForMovie(m_movie.id, v_runtime);
    return {
      obs_today: v_showtimes.obs_today ?? [],
      obs_tomorrow: v_showtimes.obs_tomorrow ?? [],
    };
  });

  /** Check if a session is in the past */
  v_isPastSession = (p_session: SessionView) => {
    return this.s_sessionService.isPastSession(p_session);
  };
}
