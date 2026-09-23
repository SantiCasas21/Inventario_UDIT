import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reportes-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <nav class="reportes-nav-bar flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 mb-6 border-b border-gray-200 dark:border-gray-700" aria-label="Navegación de Reportes">
      <a
        routerLink="/reportes"
        [routerLinkActiveOptions]="{ exact: true }"
        routerLinkActive="active-tab"
        class="nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-indigo-400 whitespace-nowrap">
        <mat-icon class="tab-icon">grid_view</mat-icon>
        <span>Centro de Reportes</span>
      </a>

      <a
        routerLink="/reportes/kardex"
        routerLinkActive="active-tab"
        class="nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-indigo-400 whitespace-nowrap">
        <mat-icon class="tab-icon">receipt_long</mat-icon>
        <span>Kardex por Insumo</span>
      </a>

      <a
        routerLink="/reportes/stock-critico"
        routerLinkActive="active-tab"
        class="nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-indigo-400 whitespace-nowrap">
        <mat-icon class="tab-icon">warning_amber</mat-icon>
        <span>Stock Crítico</span>
      </a>

      <a
        routerLink="/reportes/movimientos"
        routerLinkActive="active-tab"
        class="nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-indigo-400 whitespace-nowrap">
        <mat-icon class="tab-icon">swap_horiz</mat-icon>
        <span>Movimientos por Período</span>
      </a>

      <a
        routerLink="/reportes/proyectos"
        routerLinkActive="active-tab"
        class="nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-indigo-400 whitespace-nowrap">
        <mat-icon class="tab-icon">folder_special</mat-icon>
        <span>Consumo por Proyecto</span>
      </a>
    </nav>
  `,
  styles: [`
    .tab-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .active-tab {
      color: #4f46e5 !important;
      border-bottom: 2px solid #4f46e5;
      background-color: rgba(79, 70, 229, 0.08);
      font-weight: 700;
    }
    :host-context(.dark) .active-tab {
      color: #818cf8 !important;
      border-bottom-color: #818cf8;
      background-color: rgba(129, 140, 248, 0.12);
    }
  `]
})
export class ReportesNavComponent {}
