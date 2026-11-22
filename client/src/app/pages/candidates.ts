import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { Appear, fadeOut } from '../animations';
import {
  API,
  Api,
  Candidate,
  Page,
  STATUSES,
  Status,
  clean,
  formatPhone,
  initials,
  tones,
} from '../api';
import { Auth } from '../auth';
import { Icon } from '../icon';
import { Toast } from '../toast';

type SortBy = 'name' | 'experience' | 'createdAt';

@Component({
  imports: [RouterLink, ReactiveFormsModule, DatePipe, Appear, Icon],
  templateUrl: './candidates.html',
  host: { '(document:keydown.escape)': 'deleting.set(null)' },
})
export default class Candidates {
  private api = inject(Api);
  private toast = inject(Toast);

  user = inject(Auth).user;
  isAdmin = computed(() => this.user()?.role === 'admin');
  statuses = STATUSES;
  tones = tones;
  initials = initials;
  formatPhone = formatPhone;
  fadeOut = fadeOut;
  placeholders = Array.from({ length: 10 }, (_, i) => i);

  filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    skillId: new FormControl<number | null>(null),
  });
  // only the search box waits for you to stop typing, the dropdown applies straight away
  search = toSignal(this.filters.controls.search.valueChanges.pipe(debounceTime(250)), {
    initialValue: '',
  });
  skillId = toSignal(this.filters.controls.skillId.valueChanges, { initialValue: null });
  status = signal<Status | null>(null);
  sort = signal<{ by: SortBy; order: 'ASC' | 'DESC' }>({ by: 'createdAt', order: 'DESC' });
  page = linkedSignal({
    source: () => [this.search(), this.skillId(), this.status(), this.sort()],
    computation: () => 1,
  });

  skills = this.api.skills;
  stats = httpResource<Record<string, number>>(() => `${API}/candidates/stats`);
  deleted = httpResource<Candidate[]>(() =>
    this.isAdmin() ? `${API}/candidates/deleted` : undefined,
  );
  list = httpResource<Page>(() => ({
    url: `${API}/candidates`,
    params: clean({
      page: this.page(),
      limit: 10,
      search: this.search(),
      skillId: this.skillId(),
      status: this.status(),
      sortBy: this.sort().by,
      order: this.sort().order,
    }),
  }));

  // keeps showing the old page while the next one loads
  data = linkedSignal<Page | undefined, Page | undefined>({
    source: () => (this.list.hasValue() ? this.list.value() : undefined),
    computation: (next, prev) => next ?? prev?.value,
  });

  counts = computed(() => (this.stats.hasValue() ? this.stats.value() : {}));
  deletedCount = computed(() => (this.deleted.hasValue() ? this.deleted.value().length : 0));
  total = computed(() => Object.values(this.counts()).reduce((a, b) => a + b, 0));
  filtered = computed(() => !!(this.search() || this.skillId() || this.status()));
  pages = computed(() => {
    const total = this.data()?.meta.totalPages ?? 0;
    const start = Math.max(1, Math.min(this.page() - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });

  deleting = signal<Candidate | null>(null);

  sortBy(by: SortBy) {
    this.sort.update((s) => ({ by, order: s.by === by && s.order === 'ASC' ? 'DESC' : 'ASC' }));
  }

  skillNames(c: Candidate) {
    return c.skills.map((s) => s.name).join(', ');
  }

  clearFilters() {
    this.filters.reset();
    this.status.set(null);
  }

  remove(c: Candidate) {
    this.deleting.set(null);

    // take them off the screen right away, the server catches up in the background
    this.list.update(
      (page) =>
        page && {
          data: page.data.filter((x) => x.id !== c.id),
          meta: { ...page.meta, totalItems: page.meta.totalItems - 1 },
        },
    );
    this.stats.update((counts) => counts && { ...counts, [c.status]: counts[c.status] - 1 });
    this.deleted.update((rows) => rows && [c, ...rows]);

    this.api.remove(c.id).subscribe({
      next: () => {
        this.toast.success('Candidate deleted', `${c.name} moved to Recently deleted.`, {
          label: 'Undo',
          run: () => this.undo(c),
        });
        this.refresh();
      },
      error: () => {
        this.toast.error(`Couldn't delete ${c.name}`);
        this.refresh();
      },
    });
  }

  undo(c: Candidate) {
    this.api.restore(c.id).subscribe({
      next: () => {
        this.toast.success('Delete undone', `${c.name} is back in the list.`);
        this.refresh();
      },
      error: () => this.toast.error(`Couldn't bring ${c.name} back`),
    });
  }

  private refresh() {
    this.list.reload();
    this.stats.reload();
    this.deleted.reload();
  }
}
