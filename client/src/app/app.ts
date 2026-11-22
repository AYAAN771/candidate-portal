import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Appear, fadeOut } from './animations';
import { Auth } from './auth';
import { Icon } from './icon';
import { Toast } from './toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Appear, Icon],
  template: `
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-8 px-4 sm:px-6">
        <a routerLink="/candidates" class="flex items-center gap-2 font-semibold">
          <span
            class="grid size-7 place-items-center rounded bg-blue-600 text-xs font-bold text-white"
          >
            CP
          </span>
          Candidate Portal
        </a>

        <nav class="hidden h-full text-sm sm:flex">
          <a
            routerLink="/candidates"
            routerLinkActive="border-blue-600! text-gray-900"
            class="flex items-center border-b-2 border-transparent px-1 font-medium text-gray-600 hover:text-gray-900"
          >
            Candidates
          </a>
        </nav>

        <div class="ml-auto flex items-center gap-4 text-sm">
          @if (auth.user(); as user) {
            <span class="hidden text-gray-600 sm:inline">{{ user.email }}</span>
            <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 capitalize">
              {{ user.role }}
            </span>
            <button
              (click)="auth.logout('manual')"
              class="font-medium text-gray-700 hover:text-gray-900"
            >
              Log out
            </button>
          } @else {
            <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-700">Log in</a>
          }
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <router-outlet />
    </main>

    <div
      class="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto"
    >
      @for (t of toast.items(); track t.id) {
        <div
          appear
          (animate.leave)="fadeOut($event)"
          role="status"
          class="pointer-events-auto flex w-full gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-lg sm:w-96"
        >
          <app-icon
            [name]="t.kind === 'success' ? 'check' : 'alert'"
            class="mt-px size-5"
            [class]="t.kind === 'success' ? 'text-green-600' : 'text-red-600'"
          />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900">{{ t.title }}</p>
            @if (t.text) {
              <p class="mt-0.5 text-gray-500">{{ t.text }}</p>
            }
            @if (t.action; as action) {
              <button
                (click)="action.run(); toast.dismiss(t.id)"
                class="mt-2 font-medium text-blue-600 hover:text-blue-800"
              >
                {{ action.label }}
              </button>
            }
          </div>
          <button
            (click)="toast.dismiss(t.id)"
            class="-m-1 self-start rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <app-icon name="x" class="size-4" />
          </button>
        </div>
      }
    </div>
  `,
})
export class App {
  auth = inject(Auth);
  toast = inject(Toast);
  fadeOut = fadeOut;
}
