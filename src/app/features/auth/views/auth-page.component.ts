import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [FormsModule],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css',
})
export class AuthPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected onUsernameInput(value: string): void {
    this.username.set(value);
  }

  protected onPasswordInput(value: string): void {
    this.password.set(value);
  }

  protected submit(): void {
    const u = this.username().trim();
    const p = this.password();
    this.error.set(null);
    if (!u || !p) {
      this.error.set('Usuario y contraseña son obligatorios');
      return;
    }

    this.loading.set(true);
    this.auth
      .login(u, p)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((r) => {
        if (r.ok) {
          void this.router.navigate(['/home']);
        } else {
          this.error.set(r.reason);
        }
      });
  }
}
