import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: '',
})
export class HomeRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    if (this.auth.isAdmin()) {
      void this.router.navigate(['/home/dashboard'], { replaceUrl: true });
      return;
    }
    if (this.auth.isVoter()) {
      void this.router.navigate(['/home/vote'], { replaceUrl: true });
      return;
    }
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}
