import { Routes } from '@angular/router';

export const MOVIE_DETAILS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./components/movie-details').then((m) => m.MovieDetails),
  },
];
