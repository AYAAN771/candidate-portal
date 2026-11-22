import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { catchError, tap, throwError } from 'rxjs';
import { API } from './api';
import { Toast } from './toast';

interface User {
  email: string;
  role: 'admin' | 'recruiter';
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(Toast);
  private timer?: ReturnType<typeof setTimeout>;

  token = signal<string | null>(null);
  user = computed(() => {
    const token = this.token();
    return token ? jwtDecode<User>(token) : null;
  });

  constructor() {
    const saved = localStorage.getItem('token');
    if (saved && jwtDecode<User>(saved).exp * 1000 > Date.now()) this.start(saved);
    else localStorage.removeItem('token');
  }

  login(email: string, password: string) {
    return this.http
      .post<{ token: string }>(`${API}/auth/login`, { email, password })
      .pipe(tap((res) => this.start(res.token)));
  }

  logout(why: 'manual' | 'expired') {
    clearTimeout(this.timer);
    localStorage.removeItem('token');
    this.token.set(null);
    this.router.navigate(['/login']);

    if (why === 'expired') this.toast.error('Your session expired', 'Log in again to keep going.');
    else this.toast.success('Logged out');
  }

  private start(token: string) {
    localStorage.setItem('token', token);
    this.token.set(token);
    clearTimeout(this.timer);
    const msLeft = jwtDecode<User>(token).exp * 1000 - Date.now();
    this.timer = setTimeout(() => this.logout('expired'), msLeft);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.token();
  if (token) req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && token) auth.logout('expired');
      return throwError(() => err);
    }),
  );
};

export const authGuard: CanActivateFn = (_route, state) =>
  !!inject(Auth).user() ||
  inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

export const adminGuard: CanActivateFn = () =>
  inject(Auth).user()?.role === 'admin' || inject(Router).createUrlTree(['/candidates']);
