import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize, firstValueFrom } from 'rxjs';

import type { NpsResultsDto } from '../models/nps-results.models';
import { NpsService } from '../services/nps.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  private readonly nps = inject(NpsService);

  protected readonly data = signal<NpsResultsDto | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    void this.refresh();
  }

  protected refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    void firstValueFrom(
      this.nps.getResults().pipe(
        finalize(() => this.loading.set(false)),
      ),
    ).then((out) => {
      if (out.ok) {
        this.data.set(out.data);
        this.error.set(null);
      } else {
        this.error.set(out.reason);
      }
    });
  }
}
