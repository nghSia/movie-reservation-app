import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TmdbMovie } from '../../../home/models/movie.model';
import { TmdbService } from '../../../home/services/tmdb.service';
import { Reservation } from '../../../reservation/models/reservation.model';
import { ReservationService } from '../../../reservation/services/reservation.service';

interface Row {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  pendingRate: number;
  confirmedRate: number;
  cancelledRate: number;
}

@Component({
  standalone: true,
  selector: 'app-admin-stats',
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-6xl mx-auto text-secondary-900">
      <h1 class="text-2xl font-bold mb-6">Statistiques des films à l'affiche</h1>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 border border-secondary-200">
          <div class="text-sm text-secondary-600">Total réservations</div>
          <div class="text-2xl font-bold text-secondary-900">{{ m_totals().v_total }}</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-secondary-200">
          <div class="text-sm text-secondary-600">Confirmées</div>
          <div class="text-2xl font-bold text-secondary-900">{{ m_totals().v_confirmed }}</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-secondary-200">
          <div class="text-sm text-secondary-600">Annulées</div>
          <div class="text-2xl font-bold text-secondary-900">{{ m_totals().v_cancelled }}</div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-secondary-200 bg-white">
        <table class="w-full text-sm">
          <thead class="bg-secondary-50 text-secondary-700">
            <tr class="border-b border-secondary-200">
              <th class="text-left px-4 py-3">Film</th>
              <th class="text-right px-4 py-3">Total</th>
              <th class="text-right px-4 py-3">Pending</th>
              <th class="text-right px-4 py-3">Confirmées</th>
              <th class="text-right px-4 py-3">Annulées</th>
              <th class="text-right px-4 py-3">% Pending</th>
              <th class="text-right px-4 py-3">% Confirmées</th>
              <th class="text-right px-4 py-3">% Annulées</th>
            </tr>
          </thead>
          <tbody>
            @for (v_row of m_rows(); track v_row.tmdbId) {
              <tr
                class="border-t border-secondary-100 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    @if (v_row.posterUrl) {
                      <img
                        [src]="v_row.posterUrl!"
                        [alt]="v_row.title"
                        class="w-10 h-14 rounded-md object-cover"
                      />
                    }
                    <span class="font-medium">{{ v_row.title }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">{{ v_row.total }}</td>
                <td class="px-4 py-3 text-right">{{ v_row.pending }}</td>
                <td class="px-4 py-3 text-right">{{ v_row.confirmed }}</td>
                <td class="px-4 py-3 text-right">{{ v_row.cancelled }}</td>
                <td class="px-4 py-3 text-right">{{ v_row.pendingRate }}%</td>
                <td class="px-4 py-3 text-right">{{ v_row.confirmedRate }}%</td>
                <td class="px-4 py-3 text-right">{{ v_row.cancelledRate }}%</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="px-4 py-8 text-center text-secondary-500">Aucune donnée</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminStats {
  private s_tmdbService = inject(TmdbService);
  private s_reservationService = inject(ReservationService);

  /** Now playing movies signal */
  private m_nowPlaying = signal<TmdbMovie[]>([]);

  constructor() {
    this.loadNowPlaying();
  }

  /** Load now playing movies */
  private async loadNowPlaying() {
    const pages = await Promise.all([
      firstValueFrom(this.s_tmdbService.nowPlaying(1)),
      firstValueFrom(this.s_tmdbService.nowPlaying(2)),
      firstValueFrom(this.s_tmdbService.nowPlaying(3)),
    ]);

    const v_allMovies = pages.flat();
    const v_uniqueMovieIds = new Set<number>();
    const v_uniqueMovies = v_allMovies.filter((v_movie) => {
      if (v_uniqueMovieIds.has(v_movie.id)) return false;
      v_uniqueMovieIds.add(v_movie.id);
      return true;
    });

    this.m_nowPlaying.set(v_uniqueMovies);
  }

  /** Get existing reservations */
  private m_reservations = computed<Reservation[]>(() => {
    const v_fromSignal = this.s_reservationService.v_reservations$?.() ?? [];
    if (v_fromSignal.length) return v_fromSignal;
    try {
      return JSON.parse(localStorage.getItem('reservations') ?? '[]') as Reservation[];
    } catch {
      return [];
    }
  });

  /** Get TMDB poster */
  private posterUrl = (path?: string | null) =>
    path ? this.s_tmdbService.image(path, 'w154') : null;

  /** Rows of movies and their stats */
  m_rows = computed<Row[]>(() => {
    const v_movies: TmdbMovie[] = this.m_nowPlaying() ?? [];
    const v_all = this.m_reservations();

    const v_rows: Row[] = v_movies.map((m) => {
      const v_items = v_all.filter((r) => Number(r.tmdbId) === Number(m.id));

      const v_total = v_items.length;
      const v_pending = v_items.filter((i) => i.status === 'PENDING').length;
      const v_confirmed = v_items.filter((i) => i.status === 'CONFIRMED').length;
      const v_cancelled = v_items.filter((i) => i.status === 'CANCELLED').length;

      const pct = (n: number) => (v_total ? Math.round((n / v_total) * 100) : 0);

      return {
        tmdbId: m.id,
        title: m.title ?? `#${m.id}`,
        posterUrl: this.posterUrl(m.poster_path),
        total: v_total,
        pending: v_pending,
        confirmed: v_confirmed,
        cancelled: v_cancelled,
        pendingRate: pct(v_pending),
        confirmedRate: pct(v_confirmed),
        cancelledRate: pct(v_cancelled),
      };
    });

    v_rows.sort((v_a, v_b) => v_b.total - v_a.total || v_b.confirmed - v_a.confirmed);
    return v_rows;
  });

  /** Totals header */
  m_totals = computed(() => {
    const v_list = this.m_reservations();
    const v_total = v_list.length;
    const v_confirmed = v_list.filter((r) => r.status === 'CONFIRMED').length;
    const v_cancelled = v_list.filter((r) => r.status === 'CANCELLED').length;
    return { v_total, v_confirmed, v_cancelled };
  });
}
