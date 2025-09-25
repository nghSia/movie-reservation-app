import { Routes } from '@angular/router';
import { AdminStats } from './components/admin-stats/admin-stats';
import { AdminUsers } from './components/admin-user';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminUsers,
  },
  {
    path: 'stats',
    component: AdminStats,
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
