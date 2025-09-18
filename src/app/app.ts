import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { _environment } from '../environment/environment';
import { Header } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  styleUrl: './app.scss',
  standalone: true,
  template: `
    <app-header></app-header>
    <main class="container mx-auto p-4">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class App {
  protected readonly title = signal('movie-reservation-app');
  private c_http = inject(HttpClient);

  constructor() {
    this.c_http.get(`${_environment.tmdb.baseUrl}/genre/movie/list`).subscribe({
      next: (res) => console.log('OK TMDB : ' + JSON.stringify(res)),
      error: (e) => console.error('TMDB Error : ' + JSON.stringify(e)),
    });
  }
}
