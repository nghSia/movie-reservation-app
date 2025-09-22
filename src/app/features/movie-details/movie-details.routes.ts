import { Routes } from '@angular/router';
import { MovieDetails } from './components/movie-details';

export const MOVIE_DETAILS_ROUTES: Routes = [
  {
    path: ':id',
    component: MovieDetails,
  },
];
