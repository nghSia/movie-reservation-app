import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { TmdbService } from '../../home/services/tmdb.service';

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
      @if (m_error()) {
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
            [src]="m_posterUrl()"
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

            <div class="pt-4 flex items-center gap-3">
              <a
                routerLink="/reservation"
                class="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-pink-600 text-white hover:bg-pink-700"
              >
                Réserver
              </a>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class MovieDetails {
  private c_route = inject(ActivatedRoute);
  private s_tmdbService = inject(TmdbService);

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
  readonly m_error = computed(() => this.m_movie() === null);

  /** Get poster Url if movie exists */
  readonly m_posterUrl = computed(() =>
    this.s_tmdbService.image(this.m_movie()?.poster_path ?? null, 'w500'),
  );
}
