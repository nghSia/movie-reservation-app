import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieCard } from '../../../shared/components/movie-card/movie-card';
import { TmdbMovie } from '../models/movie.model';
import { TmdbService } from '../services/tmdb.service';

type TabKey = 'now' | 'top';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, MovieCard, RouterLink],
  template: `
    <section class="px-4 sm:px-6 lg:px-10 py-6 space-y-10">
      <div class="flex items-center gap-2">
        @for (t of m_tabs; track t.key) {
          <button
            (click)="m_activeTab.set(t.key)"
            class="rounded-full px-4 py-2 text-sm border transition-colors duration-200
               hover:bg-secondary-100 hover:text-secondary-900"
            [class.bg-primary-500]="m_activeTab() === t.key"
            [class.border-primary-500]="m_activeTab() === t.key"
            [class.text-white]="m_activeTab() === t.key"
            [class.border-neutral-300]="m_activeTab() !== t.key"
          >
            {{ t.label }}
          </button>
        }
      </div>

      <div class="grid grid-cols-[auto,1fr,auto] items-center gap-3">
        <button
          (click)="scrollCarousel(-1)"
          class="hidden sm:flex h-10 w-10 items-center justify-center rounded-full
             bg-black/70 text-white hover:bg-black transition-colors"
          aria-label="Défiler vers la gauche"
        >
          ‹
        </button>

        <div
          #carouselRail
          class="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory
             pb-3 pr-2 pl-1 sm:pl-0"
          [class.opacity-50]="m_isLoading()"
          [class.pointer-events-none]="m_isLoading()"
        >
          @if (m_visibleMovies().length) {
            @for (movie of m_visibleMovies(); track movie.id; let index = $index) {
              <a
                [routerLink]="['/movie', movie.id]"
                class="shrink-0 snap-start block rounded-2xl focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-accent-300
                   hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              >
                <div class="min-w-[170px] sm:min-w-[190px] md:min-w-[210px]">
                  <app-movie-card [i_movie]="movie" [i_eager]="index === 0"></app-movie-card>
                </div>
              </a>
            }
          } @else {
            <div class="flex gap-3 sm:gap-4 md:gap-6 pl-1 sm:pl-0">
              @for (s of [0, 1, 2, 3, 4, 5, 6, 7]; track s) {
                <div
                  class="w-40 sm:w-48 h-[300px] shrink-0 rounded-2xl bg-neutral-200 animate-pulse"
                ></div>
              }
            </div>
          }
        </div>

        <button
          (click)="scrollCarousel(1)"
          class="hidden sm:flex h-10 w-10 items-center justify-center rounded-full
             bg-black/70 text-white hover:bg-black transition-colors"
          aria-label="Défiler vers la droite"
        >
          ›
        </button>
      </div>

      <div>
        <h2 class="mb-3 text-lg font-semibold text-secondary-700">Aperçu</h2>

        <div
          class="grid
             grid-cols-2 sm:grid-cols-3
             md:[grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]
             lg:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]
             xl:[grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]
             2xl:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]
             gap-x-4 sm:gap-x-5 md:gap-x-6 lg:gap-x-6 xl:gap-x-5 2xl:gap-x-4
             gap-y-6 sm:gap-y-8 md:gap-y-10 lg:gap-y-10 xl:gap-y-8 2xl:gap-y-6
             px-2 sm:px-0 md:px-2"
        >
          @for (movie of m_visibleMovies(); track movie.id; let index = $index) {
            <a
              [routerLink]="['/movie', movie.id]"
              class="block mx-auto rounded-2xl focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-accent-300
                 hover:bg-secondary-100 hover:text-secondary-900 transition-colors
                 w-[180px] sm:w-[190px] md:w-[210px] lg:w-[200px] xl:w-[190px] 2xl:w-[180px]"
            >
              <app-movie-card [i_movie]="movie" />
            </a>
          }
        </div>
      </div>
    </section>
  `,
})
export class HomePage {
  private s_tmdbService = inject(TmdbService);

  @ViewChild('carouselRail', { static: true }) m_carouselRailRef!: ElementRef<HTMLDivElement>;

  m_activeTab = signal<TabKey>('now');
  m_isLoading = signal(false);
  m_visibleMovies = computed(() => this.m_moviesByTab()[this.m_activeTab()]);

  /** Define available tabs */
  m_tabs: { key: TabKey; label: string }[] = [
    { key: 'now', label: 'À l’affiche' },
    { key: 'top', label: 'Mieux notés' },
  ];

  /** Movies grouped by tab */
  private m_moviesByTab = signal<Record<TabKey, TmdbMovie[]>>({
    now: [],
    top: [],
  });

  /** constructor of the component */
  constructor() {
    effect(() => {
      const m_tab = this.m_activeTab();
      this.loadMoviesIfNeeded(m_tab);
    });
  }

  /** Load movies for the given tab if not already loaded */
  private loadMoviesIfNeeded(p_tab: TabKey) {
    if (this.m_moviesByTab()[p_tab].length) return;
    this.m_isLoading.set(true);
    const v_obs =
      p_tab === 'now'
        ? this.s_tmdbService.nowPlaying()
        : this.s_tmdbService.getNowPlayingTopRated();
    v_obs.subscribe({
      next: (obs_movies) => {
        const v_nextCache = { ...this.m_moviesByTab() };
        v_nextCache[p_tab] = obs_movies;
        this.m_moviesByTab.set(v_nextCache);
        this.m_isLoading.set(false);
      },
      error: () => this.m_isLoading.set(false),
    });
  }

  /** Scroll the carousel left or right */
  scrollCarousel(dir: -1 | 1) {
    const v_rail = this.m_carouselRailRef?.nativeElement;
    if (!v_rail) return;
    v_rail.scrollBy({ left: dir * v_rail.clientWidth * 0.9, behavior: 'smooth' });
  }
}
