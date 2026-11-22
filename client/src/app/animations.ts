import { AnimationCallbackEvent, Directive, ElementRef, inject } from '@angular/core';
import { animate } from 'motion';

@Directive({ selector: '[appear]' })
export class Appear {
  private el = inject(ElementRef).nativeElement;

  ngOnInit() {
    animate(this.el, { opacity: [0, 1], y: [4, 0] }, { duration: 0.15, ease: 'easeOut' });
  }
}

export const fadeOut = (e: AnimationCallbackEvent) =>
  animate(e.target, { opacity: 0 }, { duration: 0.12 }).then(() => e.animationComplete());
