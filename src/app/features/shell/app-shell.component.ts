import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);

  protected readonly displayName = () => this.auth.displayName();
  protected readonly showDashboard = () => this.auth.isAdmin();
  protected readonly showVote = () => this.auth.isVoter();

  logout(): void {
    this.auth.logout();
  }
}
