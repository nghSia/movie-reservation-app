import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieVersion, Session } from '../../../shared/model/session.model';
import { AuthService } from '../../auth/services/auth-service';
import { Reservation, TicketType } from '../models/reservation.model';
import { ReservationService } from '../services/reservation.service';

@Component({
  standalone: true,
  selector: 'app-reservation-film',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-gray-950 text-white">
      @if (m_reservation(); as r) {
        <div class="w-full max-w-2xl bg-gray-900 rounded-2xl p-6 shadow-lg">
          <div class="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
            <div
              class="w-[120px] h-[180px] bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden"
            >
              @if (r.moviePosterPath) {
                <img
                  class="w-full h-full object-cover"
                  [src]="r.moviePosterPath!"
                  [alt]="r.movieTitle || 'Poster'"
                />
              } @else {
                <span class="text-gray-500 text-sm">No Poster</span>
              }
            </div>

            <div>
              <h2 class="text-xl font-bold mb-1">{{ r.movieTitle || 'Film' }}</h2>
              <p class="text-gray-300 text-sm">
                {{ r.startHour | date: 'EEEE d MMMM • HH:mm' : 'Europe/Paris' }} —
                {{ r.endHour | date: 'HH:mm' : 'Europe/Paris' }} • Salle #{{ r.roomId }} • Version
                {{ r.version }}
              </p>
            </div>

            <button class="text-red-400 hover:text-red-500 text-2xl" (click)="onCancel()">
              🗑️
            </button>
          </div>

          <div class="mt-6 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1" [for]="typeId"
                >Catégorie de client</label
              >
              <select
                [ngModel]="m_selectedType()"
                (ngModelChange)="m_selectedType.set($event)"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
              >
                <option [ngValue]="undefined" disabled>Choisir...</option>

                @for (entry of m_priceTable | keyvalue; track trackByKey($index, entry)) {
                  <option [ngValue]="entry.key">
                    {{ entry.key }} — {{ entry.value | currency: 'EUR' }}
                  </option>
                }
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1 mt-4" [for]="qtyId">Quantité</label>
              <select
                [ngModel]="m_quantity()"
                (ngModelChange)="m_quantity.set($event)"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
              >
                @for (q of [1, 2, 3, 4, 5, 6, 7, 8]; track q) {
                  <option [ngValue]="q">{{ q }}</option>
                }
              </select>
            </div>

            @if (m_selectedType(); as type) {
              <div class="bg-gray-800 rounded-lg p-3">
                <p>
                  Prix unitaire : <b>{{ m_unitPrice() | currency: 'EUR' }}</b>
                </p>
                <p>
                  Total : <b>{{ m_totalPrice() | currency: 'EUR' }}</b>
                </p>
              </div>
            }

            <div class="flex justify-end">
              <button
                class="px-4 py-2 bg-teal-400 text-black font-bold rounded-lg hover:bg-teal-300 disabled:opacity-50"
                [disabled]="!m_selectedType()"
                (click)="onConfirm()"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      } @else {
        <p>Aucune réservation trouvée.</p>
      }
    </div>
  `,
})
export class ReservationFilm {
  private c_route = inject(ActivatedRoute);
  private c_router = inject(Router);
  private s_reservationService = inject(ReservationService);
  private s_authService = inject(AuthService);

  private m_userId = 0;

  m_reservation = signal<Reservation | null>(null);
  m_priceTable = this.s_reservationService.getPriceTable();

  m_selectedType = signal<TicketType | undefined>(undefined);
  m_quantity = signal<number>(1);

  m_unitPrice = computed(() =>
    this.m_selectedType() ? this.m_priceTable[this.m_selectedType()!] : 0,
  );
  m_totalPrice = computed(() => this.m_unitPrice() * (this.m_unitPrice() || 1));

  constructor() {
    this.m_userId = this.s_authService.getCurrentUser()!.id;
    const qp = this.c_route.snapshot.queryParamMap;
    const v_tmdbId = Number(qp.get('tmdbId'));
    const v_roomId = Number(qp.get('roomId'));
    const v_start = qp.get('start')!;
    const v_end = qp.get('end')!;
    const v_version = (qp.get('version') as MovieVersion)!;

    const v_session: Session = {
      id: 0,
      tmdbId: v_tmdbId,
      roomId: v_roomId,
      start: v_start,
      end: v_end,
      version: v_version,
    };

    let v_pendingReservation = this.s_reservationService.findPendingReservationBySession(
      this.m_userId,
      v_session,
    );
    if (!v_pendingReservation) {
      const v_title = qp.get('title') || undefined;
      const v_poster = qp.get('poster') || undefined;

      v_pendingReservation = this.s_reservationService.createPendingReservation(
        this.m_userId,
        v_session,
        v_title,
        v_poster,
      );
    }

    this.m_reservation.set(v_pendingReservation);
    this.m_selectedType.set(v_pendingReservation.ticketType);
    this.m_quantity.set(v_pendingReservation.quantity ?? 1);

    effect(() => {
      const v_current = this.m_reservation();
      if (!v_current) return;
      this.s_reservationService.updatePartial(v_current.id, {
        ticketType: this.m_selectedType(),
        quantity: this.m_quantity(),
      });
    });
  }

  onCancel() {
    const v_res = this.m_reservation();
    if (!v_res) return;
    this.s_reservationService.cancelReservation(v_res.id);
    this.c_router.navigateByUrl('/home');
  }

  onConfirm() {
    const v_res = this.m_reservation();
    if (!v_res) return;
    const v_type = this.m_selectedType();
    if (!v_type) {
      alert('Select a client type');
      return;
    }
    const qty = Math.max(1, Number(this.m_quantity()) || 1);
    this.s_reservationService.confirmReservation(v_res.id, v_type, qty);
    this.c_router.navigateByUrl('/my-reservation');
  }

  trackByKey(p_index: number, p_entry: { key: string; value: number }) {
    return p_entry.key;
  }

  typeId = `ticketType-${Math.random().toString(36).slice(2)}`;
  qtyId = `quantity-${Math.random().toString(36).slice(2)}`;
}
