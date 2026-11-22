import { Component, input } from '@angular/core';

type IconName = 'search' | 'sort' | 'arrow-up' | 'arrow-down' | 'check' | 'alert' | 'x';

// the handful of lucide.dev icons we use, pasted in so we don't ship all 1,700 of them
@Component({
  selector: 'app-icon',
  host: { class: 'inline-block shrink-0' },
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="size-full"
    >
      @switch (name()) {
        @case ('search') {
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.34-4.34" />
        }
        @case ('sort') {
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        }
        @case ('arrow-up') {
          <path d="m5 12 7-7 7 7" />
          <path d="M12 19V5" />
        }
        @case ('arrow-down') {
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        }
        @case ('check') {
          <circle cx="12" cy="12" r="10" />
          <path d="m16 9-5.5 5.5L8 12" />
        }
        @case ('alert') {
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        }
        @case ('x') {
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        }
      }
    </svg>
  `,
})
export class Icon {
  name = input.required<IconName>();
}
