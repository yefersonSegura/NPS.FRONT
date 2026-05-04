import { Component, computed, inject, signal } from '@angular/core';
import { finalize, firstValueFrom } from 'rxjs';

import { VoteService } from '../services/vote.service';

@Component({
  selector: 'app-vote-page',
  standalone: true,
  imports: [],
  templateUrl: './vote-page.component.html',
  styleUrl: './vote-page.component.css',
})
export class VotePageComponent {
  private readonly voteSvc = inject(VoteService);

  readonly scale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  readonly score = signal<number | null>(null);
  readonly okMessage = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly alreadyVoted = signal(false);

  /** Tras votar válido o “ya votaste”: bloquear UI */
  readonly voteLocked = computed(
    () => this.alreadyVoted() || this.okMessage() !== null,
  );

  tierClass(n: number): 'detractor' | 'passive' | 'promoter' {
    if (n <= 6) return 'detractor';
    if (n <= 8) return 'passive';
    return 'promoter';
  }

  selectScore(n: number): void {
    if (this.voteLocked()) return;
    this.okMessage.set(null);
    this.error.set(null);
    this.score.set(n);
  }

  submitVote(): void {
    if (this.voteLocked()) return;
    const s = this.score();
    if (s === null) return;

    this.submitting.set(true);
    this.okMessage.set(null);
    this.error.set(null);

    void firstValueFrom(this.voteSvc.submitVote(s).pipe(finalize(() => this.submitting.set(false)))).then(
      (out) => {
        if (out.ok) {
          this.error.set(null);
          this.okMessage.set(out.message);
          return;
        }
        const duplicate =
          out.status === 400 &&
          (/ya\b/i.test(out.reason) ||
            out.reason.toLowerCase().includes('participado'));
        if (duplicate) {
          this.alreadyVoted.set(true);
          this.error.set(null);
          this.okMessage.set('Ya votaste en esta encuesta. ¡Gracias!');
        } else {
          this.okMessage.set(null);
          this.error.set(out.reason);
        }
      },
    );
  }
}
