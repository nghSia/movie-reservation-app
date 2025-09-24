import { Routes } from '@angular/router';
import { ReservationFilm } from './components/reservation-film';
import { MyReservation } from './components/my-reservation/my-reservation';

export const RESERVATION_ROUTES: Routes = [
  {
    path: '',
    component: ReservationFilm,
  },
  {
    path: 'my-reservation',
    component: MyReservation,
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
