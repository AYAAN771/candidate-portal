import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Appear } from '../animations';
import { API, Api, Candidate, tones } from '../api';
import { Toast } from '../toast';

@Component({
  imports: [RouterLink, DatePipe, Appear],
  templateUrl: './deleted.html',
})
export default class Deleted {
  private api = inject(Api);
  private toast = inject(Toast);

  tones = tones;
  placeholders = [1, 2, 3, 4];
  list = httpResource<Candidate[]>(() => `${API}/candidates/deleted`);

  restore(c: Candidate) {
    // drop the row straight away, put it back if the server says no
    this.list.update((rows) => rows?.filter((r) => r.id !== c.id));

    this.api.restore(c.id).subscribe({
      next: () => this.toast.success('Candidate restored', `${c.name} is back in the list.`),
      error: () => {
        this.toast.error(`Couldn't restore ${c.name}`);
        this.list.reload();
      },
    });
  }
}
