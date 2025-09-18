import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { MovieCard } from '../../../shared/components/movie-card/movie-card';
import { TmdbMovie } from '../models/movie.model';
import { TmdbService } from '../services/movie.service';

type TabKey = 'now' | 'popular' | 'top';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, MovieCard],
  template: `
    <section class="px-4 sm:px-6 lg:px-10 py-6 space-y-10">
      <div class="flex items-center gap-2">
        @for (t of m_tabs; track t.key) {
          <button
            (click)="m_activeTab.set(t.key)"
            class="rounded-full px-4 py-2 text-sm border transition"
            [class.bg-pink-600]="m_activeTab() === t.key"
            [class.border-pink-600]="m_activeTab() === t.key"
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
          class="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
          aria-label="Défiler vers la gauche"
        >
          ‹
        </button>

        <div
          #carouselRail
          class="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pr-2"
          [class.opacity-50]="m_isLoading()"
          [class.pointer-events-none]="m_isLoading()"
        >
          @if (m_visibleMovies().length) {
            @for (movie of m_visibleMovies(); track movie.id; let index = $index) {
              <app-movie-card [i_movie]="movie" [i_eager]="index === 0"></app-movie-card>
            }
          } @else {
            <div class="flex gap-4">
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
          class="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
          aria-label="Défiler vers la droite"
        >
          ›
        </button>
      </div>

      <div>
        <h2 class="mb-3 text-lg font-semibold">Aperçu</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          @for (movie of m_visibleMovies() | slice: 0 : 10; track movie.id) {
            <app-movie-card [i_movie]="movie" [i_eager]="true"></app-movie-card>
          }
        </div>
      </div>
    </section>
  `,
})
export class HomePage {
  private s_tmdbService = inject(TmdbService);

  @ViewChild('carouselRail', { static: true }) m_carouselRailRef!: ElementRef<HTMLDivElement>;

  m_tabs: { key: TabKey; label: string }[] = [
    { key: 'now', label: 'À l’affiche' },
    { key: 'popular', label: 'Populaires' },
    { key: 'top', label: 'Mieux notés' },
  ];

  m_activeTab = signal<TabKey>('now');
  m_isLoading = signal(false);
  private m_moviesByTab = signal<Record<TabKey, TmdbMovie[]>>({
    now: [],
    popular: [],
    top: [],
  });

  m_visibleMovies = computed(() => this.m_moviesByTab()[this.m_activeTab()]);

  constructor() {
    effect(() => {
      const m_tab = this.m_activeTab();
      this.loadMoviesIfNeeded(m_tab);
    });
  }

  private loadMoviesIfNeeded(p_tab: TabKey) {
    if (this.m_moviesByTab()[p_tab].length) return;
    this.m_isLoading.set(true);
    const v_obs =
      p_tab === 'now'
        ? this.s_tmdbService.nowPlaying()
        : p_tab === 'popular'
          ? this.s_tmdbService.popular()
          : this.s_tmdbService.topRated();
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

  scrollCarousel(dir: -1 | 1) {
    const v_rail = this.m_carouselRailRef?.nativeElement;
    if (!v_rail) return;
    v_rail.scrollBy({ left: dir * v_rail.clientWidth * 0.9, behavior: 'smooth' });
  }
}
