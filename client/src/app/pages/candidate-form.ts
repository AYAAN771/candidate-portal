import { Component, inject, input, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Appear } from '../animations';
import { Api, STATUSES, Status } from '../api';
import { Numeric } from '../numeric';
import { Toast } from '../toast';

const PHONE = /^[6-9]\d{9}$/;
const LPA = /^\d{1,4}(\.\d{1,2})?$/;

const lpa = (value: string) => (value === '' ? null : Number(value));

@Component({
  imports: [ReactiveFormsModule, RouterLink, TitleCasePipe, Appear, Numeric],
  templateUrl: './candidate-form.html',
})
export default class CandidateForm {
  private api = inject(Api);
  private router = inject(Router);
  private toast = inject(Toast);

  id = input<string>();
  statuses = STATUSES;

  loading = signal(false);
  saving = signal(false);
  error = signal('');
  skills = this.api.skills;

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE)],
    }),
    status: new FormControl<Status>('applied', { nonNullable: true }),
    experience: new FormControl('0', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{1,2}$/), Validators.max(60)],
    }),
    expectedSalary: new FormControl('', { nonNullable: true, validators: Validators.pattern(LPA) }),
    assignedSalary: new FormControl('', { nonNullable: true, validators: Validators.pattern(LPA) }),
    skillIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  ngOnInit() {
    const id = Number(this.id());
    if (!id) return;

    this.loading.set(true);
    this.api.get(id).subscribe({
      next: (c) => {
        this.form.patchValue({
          ...c,
          phone: c.phone ?? '',
          experience: String(c.experience),
          expectedSalary: c.expectedSalary?.toString() ?? '',
          assignedSalary: c.assignedSalary?.toString() ?? '',
          skillIds: c.skills.map((s) => s.id),
        });
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Candidate not found', 'They may have been deleted in the meantime.');
        this.router.navigate(['/candidates']);
      },
    });
  }

  has(skillId: number) {
    return this.form.controls.skillIds.value.includes(skillId);
  }

  toggle(skillId: number) {
    const ids = this.form.controls.skillIds.value;
    this.form.controls.skillIds.setValue(
      ids.includes(skillId) ? ids.filter((x) => x !== skillId) : [...ids, skillId],
    );
  }

  invalid(field: keyof typeof this.form.controls) {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  save() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.saving.set(true);
    this.error.set('');

    const v = this.form.getRawValue();
    const body = {
      ...v,
      experience: Number(v.experience),
      expectedSalary: lpa(v.expectedSalary),
      assignedSalary: lpa(v.assignedSalary),
    };

    this.api.save(body, Number(this.id()) || undefined).subscribe({
      next: () => {
        if (this.id()) this.toast.success('Changes saved', `${v.name}'s details are up to date.`);
        else this.toast.success('Candidate added', `${v.name} is now in the list.`);
        this.router.navigate(['/candidates']);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'Saving failed. Try again.');
      },
    });
  }
}
