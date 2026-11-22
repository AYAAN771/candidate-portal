import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './auth';

export const routes: Routes = [
  { path: '', redirectTo: 'candidates', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login') },
  { path: 'candidates', loadComponent: () => import('./pages/candidates') },
  {
    path: 'candidates/new',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/candidate-form'),
  },
  {
    path: 'candidates/deleted',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/deleted'),
  },
  {
    path: 'candidates/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/candidate-form'),
  },
  { path: '**', redirectTo: 'candidates' },
];
