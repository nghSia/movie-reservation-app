import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { _environment } from '../../../../environment/environment';
import { TmdbMovieDetails } from '../models/movie-details.model';
import { TmdbListResponse, TmdbMovie } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private c_http = inject(HttpClient);
  private v_env = _environment;

  /** Get full poster URL from TMDB */
  image(
    path: string | null,
    size: 'w154' | 'w342' | 'w500' | 'w780' | 'original' = 'w342',
  ): string {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : 'assets/placeholder.png';
  }

  /** Get now playing movies */
  nowPlaying(page = 1): Observable<TmdbMovie[]> {
    return this.c_http
      .get<
        TmdbListResponse<TmdbMovie>
      >(`${this.v_env.tmdb.baseUrl}/movie/now_playing`, { params: { page } })
      .pipe(
        map((r) => r.results.slice(0, 12)),
        shareReplay(1),
      );
  }

  /** Get top rated movies */
  public getNowPlayingTopRated(): Observable<TmdbMovie[]> {
    return this.nowPlaying().pipe(
      map((movies) => [...movies].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))),
    );
  }

  /** Get movie details by id */
  movieDetails(id: number): Observable<TmdbMovieDetails> {
    return this.c_http.get<TmdbMovieDetails>(`${this.v_env.tmdb.baseUrl}/movie/${id}`, {
      params: { append_to_response: 'credits,videos' },
    });
  }
}
