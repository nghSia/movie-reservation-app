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
      class="mt-4 sm:mt-6 ml-4 sm:ml-6 inline-flex items-center justify-center px-4 py-2
         rounded-xl bg-primary-500 text-white hover:bg-primary-400 transition-colors"
    >
      ← Retour
    </a>

    <section class="px-4 sm:px-6 lg:px-10 py-6 max-w-6xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6 lg:gap-10 items-start">
        <img
          class="w-full rounded-2xl shadow object-cover aspect-[2/3]"
          [src]="v_posterUrl()"
          [alt]="m_movie()?.title || 'Affiche'"
        />

        <div class="space-y-4">
          <h1 class="text-2xl font-semibold text-secondary-800">{{ m_movie()?.title }}</h1>

          <div class="text-sm text-secondary-500 flex flex-wrap gap-3">
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
                  class="text-xs bg-secondary-50 border border-secondary-100 text-secondary-700 px-2 py-1 rounded-full"
                >
                  {{ g.name }}
                </span>
              }
            </div>
          }

          @if (m_movie()?.overview) {
            <p class="text-sm text-secondary-700 leading-relaxed">
              {{ m_movie()?.overview }}
            </p>
          }

          <div class="pt-2 flex items-center gap-2">
            <button
              class="rounded-full px-4 py-2 text-sm border transition-colors hover:bg-secondary-100 hover:text-secondary-900"
              [class.bg-primary-500]="m_tab() === 'today'"
              [class.border-primary-500]="m_tab() === 'today'"
              [class.text-white]="m_tab() === 'today'"
              [class.border-neutral-300]="m_tab() !== 'today'"
              (click)="m_tab.set('today')"
            >
              AUJOURD'HUI
            </button>

            <button
              class="rounded-full px-4 py-2 text-sm border transition-colors hover:bg-secondary-100 hover:text-secondary-900"
              [class.bg-primary-500]="m_tab() === 'tomorrow'"
              [class.border-primary-500]="m_tab() === 'tomorrow'"
              [class.text-white]="m_tab() === 'tomorrow'"
              [class.border-neutral-300]="m_tab() !== 'tomorrow'"
              (click)="m_tab.set('tomorrow')"
            >
              DEMAIN
            </button>
          </div>

          @if (m_movie()) {
            <div
              class="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
            >
              @for (
                v_session of m_tab() === 'today'
                  ? v_showtimes().obs_today
                  : v_showtimes().obs_tomorrow;
                track v_session.session.id
              ) {
                <button
                  class="rounded-2xl bg-secondary-100/70 text-secondary-900 text-left
                     px-4 py-3 sm:px-5 sm:py-4 shadow-soft
                     hover:bg-secondary-100 transition
                     disabled:opacity-40 disabled:cursor-not-allowed
                     disabled:hover:opacity-40 disabled:pointer-events-none disabled:grayscale
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                  [disabled]="isPastSession(v_session) || v_session.seatsLeft === 0"
                  [routerLink]="['/reservation']"
                  [queryParams]="{
                    tmdbId: v_session.session.tmdbId,
                    roomId: v_session.room.id,
                    start: v_session.session.start,
                    end: v_session.session.end,
                    version: v_session.session.version,
                  }"
                >
                  <div class="text-xs uppercase tracking-wide opacity-80">
                    {{ v_session.session.version }}
                  </div>

                  <div class="mt-1 font-semibold text-lg sm:text-xl text-secondary-900">
                    {{ v_session.session.start | date: 'EEE d MMM HH:mm' : 'Europe/Paris' }}
                  </div>

                  <div class="text-sm sm:text-base opacity-80">
                    fin {{ v_session.session.end | date: 'HH:mm' : 'Europe/Paris' }}
                  </div>

                  <div class="mt-2 text-xs sm:text-sm opacity-80">
                    {{ v_session.room.name }}
                  </div>

                  <div
                    class="text-xs sm:text-sm mt-1"
                    [class.text-rose-400]="v_session.seatsLeft === 0"
                  >
                    {{
                      v_session.seatsLeft === 0
                        ? 'Complet'
                        : v_session.seatsLeft + ' places restantes'
                    }}
                  </div>
                </button>
              }
            </div>
          }
        </div>
      </div>
    </section>
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
  isPastSession = (p_session: SessionView) => {
    return this.s_sessionService.isPastSession(p_session);
  };
}
