import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/components/footer/footer';
import { Header } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  styleUrl: './app.scss',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col bg-secondary-50">
      <app-header></app-header>

      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <app-footer></app-footer>
    </div>
  `,
})
export class App {
  protected readonly title = signal('movie-reservation-app');
}
