import { Directive, ElementRef, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

type Field = 'phone' | 'salary' | 'years';

// keeps number inputs clean while people type or paste: <input numeric="phone">
@Directive({
  selector: 'input[numeric]',
  host: { '(input)': 'tidy()', '[attr.inputmode]': 'keyboard()', autocomplete: 'off' },
})
export class Numeric {
  numeric = input.required<Field>();
  private input: HTMLInputElement = inject(ElementRef).nativeElement;
  private control = inject(NgControl);

  keyboard() {
    if (this.numeric() === 'phone') return 'tel';
    if (this.numeric() === 'salary') return 'decimal';
    return 'numeric';
  }

  tidy() {
    const typed = this.input.value;
    let cleaned = cleanYears(typed);
    if (this.numeric() === 'phone') cleaned = cleanPhone(typed);
    if (this.numeric() === 'salary') cleaned = cleanSalary(typed);

    if (cleaned !== typed) this.control.control?.setValue(cleaned);
  }
}

export function cleanPhone(value: string) {
  let phone = value.replace(/[^\d+]/g, '');
  const startsWithPlus = phone.startsWith('+');
  phone = phone.replaceAll('+', '');

  // +91 is India, so we just drop it
  if (startsWithPlus && phone.startsWith('91')) return phone.slice(2, 12);
  // some other country code half typed, leave it so they can see what they typed
  if (startsWithPlus) return '+' + phone.slice(0, 2);

  // pasted with a 0 / 91 / 091 / 0091 in front
  for (const prefix of ['0091', '091', '91', '0']) {
    if (phone.length === prefix.length + 10 && phone.startsWith(prefix)) {
      return phone.slice(prefix.length);
    }
  }
  return phone.slice(0, 10);
}

export function cleanSalary(value: string) {
  const text = value.replace(/[^\d.]/g, '');
  const dot = text.indexOf('.');
  if (dot === -1) return text.slice(0, 4);

  const lakhs = text.slice(0, dot).slice(0, 4) || '0';
  const decimals = text
    .slice(dot + 1)
    .replaceAll('.', '')
    .slice(0, 2);
  return `${lakhs}.${decimals}`;
}

export function cleanYears(value: string) {
  return value.replace(/\D/g, '').slice(0, 2);
}
