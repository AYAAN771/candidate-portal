import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { animate } from 'motion';
import { Appear } from '../animations';
import { Auth } from '../auth';
import { Toast } from '../toast';

@Component({
  imports: [ReactiveFormsModule, Appear],
  templateUrl: './login.html',
})
export default class Login {
  private auth = inject(Auth);
  private router = inject(Router);
  private toast = inject(Toast);
  private card = viewChild.required<ElementRef>('card');

  returnUrl = input<string>();
  error = signal('');
  loading = signal(false);
  showPassword = signal(false);

  form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });

  demo(email: string, password: string) {
    this.form.setValue({ email, password });
    this.submit();
  }

  submit() {
    if (this.form.invalid) return this.shake();
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');

    this.auth.login(email, password).subscribe({
      next: () => {
        this.toast.success('Logged in', `You're signed in as ${email}.`);
        this.router.navigateByUrl(this.returnUrl() ?? '/candidates');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.status === 401 ? 'Wrong email or password.' : "Can't reach the server right now.",
        );
        this.shake();
      },
    });
  }

  private shake() {
    this.form.markAllAsTouched();
    animate(this.card().nativeElement, { x: [0, -6, 6, -3, 3, 0] }, { duration: 0.3 });
  }
}
