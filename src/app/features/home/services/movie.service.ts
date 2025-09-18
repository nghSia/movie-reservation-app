import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { _environment } from '../../../../environment/environment';
import { TmdbListResponse, TmdbMovie } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private c_http = inject(HttpClient);
  private v_env = _environment;

  image(
    path: string | null,
    size: 'w154' | 'w342' | 'w500' | 'w780' | 'original' = 'w342',
  ): string {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : 'assets/placeholder.png';
  }

  nowPlaying(page = 1): Observable<TmdbMovie[]> {
    return this.c_http
      .get<
        TmdbListResponse<TmdbMovie>
      >(`${this.v_env.tmdb.baseUrl}/movie/now_playing`, { params: { page } })
      .pipe(
        map((r) => r.results),
        shareReplay(1),
      );
  }

  popular(page = 1): Observable<TmdbMovie[]> {
    return this.c_http
      .get<
        TmdbListResponse<TmdbMovie>
      >(`${this.v_env.tmdb.baseUrl}/movie/popular`, { params: { page } })
      .pipe(
        map((r) => r.results),
        shareReplay(1),
      );
  }

  topRated(page = 1): Observable<TmdbMovie[]> {
    return this.c_http
      .get<
        TmdbListResponse<TmdbMovie>
      >(`${this.v_env.tmdb.baseUrl}/movie/top_rated`, { params: { page } })
      .pipe(
        map((r) => r.results),
        shareReplay(1),
      );
  }
}
