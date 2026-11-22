import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: number;
  kind: 'success' | 'error';
  title: string;
  text?: string;
  action?: { label: string; run: () => void };
}

@Injectable({ providedIn: 'root' })
export class Toast {
  items = signal<ToastItem[]>([]);
  private lastId = 0;

  success(title: string, text?: string, action?: ToastItem['action']) {
    this.add({ kind: 'success', title, text, action });
  }

  error(title: string, text = 'Check your connection and try again.') {
    this.add({ kind: 'error', title, text });
  }

  dismiss(id: number) {
    this.items.update((items) => items.filter((t) => t.id !== id));
  }

  private add(toast: Omit<ToastItem, 'id'>) {
    const id = ++this.lastId;
    // three on screen is plenty
    this.items.update((items) => [...items.slice(-2), { ...toast, id }]);
    // give people a bit longer when there's an Undo to press
    setTimeout(() => this.dismiss(id), toast.action ? 6000 : 4000);
  }
}
