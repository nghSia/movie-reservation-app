import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input } from '@angular/core';
import { TmdbMovie } from '../../../features/home/models/movie.model';
import { TmdbService } from '../../../features/home/services/tmdb.service';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="w-40 sm:w-48 shrink-0 snap-start">
      <div class="relative aspect-[2/3] overflow-hidden rounded-2xl shadow">
        <img
          [src]="m_img()"
          [alt]="i_movie.title || 'Movie Poster'"
          [attr.loading]="i_eager ? 'eager' : 'lazy'"
          [attr.fetchpriority]="i_eager ? 'high' : null"
          decoding="async"
          class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p class="line-clamp-2 text-xs text-white/90">{{ i_movie.title }}</p>
        </div>
      </div>
      <p class="mt-2 text-xs text-neutral-500 font-bold text-center">{{ i_movie.title }}</p>
    </article>
  `,
})
export class MovieCard {
  @Input() i_movie!: TmdbMovie;
  @Input() i_eager = false;
  private s_tmdbService = inject(TmdbService);

  /** Get poster Url */
  m_img = computed(() => this.s_tmdbService.image(this.i_movie?.poster_path ?? null, 'w342'));
}
