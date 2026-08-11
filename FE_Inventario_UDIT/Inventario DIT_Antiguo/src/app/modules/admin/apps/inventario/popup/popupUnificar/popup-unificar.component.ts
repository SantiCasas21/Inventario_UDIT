import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
﻿import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { InsumoService } from '@app/core/services/insumo.service';
import { InsumoDto } from '@app/core/models';

import { IrregularidadDto } from '@app/core/models';

export interface PopupUnificarData {
  irr: IrregularidadDto;
}

@Component({
  selector: 'app-popup-unificar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatInputModule, MatSelectModule
  ],
  template: `
    <div class="flex flex-col bg-white rounded-lg">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-udit-verde text-white">
        <h2 class="m-0 text-xl font-bold flex items-center shadow-text">
          <mat-icon class="mr-2">merge_type</mat-icon>
          Unificar Duplicados
        </h2>
        <button mat-icon-button (click)="cerrar()" class="text-white hover:bg-white/20 transition-colors">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <mat-dialog-content class="p-6">
        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-2">Se unificar\u00e1n todos los insumos con el c\u00f3digo de f\u00e1brica:</p>
          <div class="px-3 py-2 bg-gray-100 rounded-md font-mono font-bold text-center text-lg">
            {{ data.irr.insumoRef }}
          </div>
        </div>

        <div *ngIf="loading" class="text-center py-4 text-gray-500">
          <mat-icon class="animate-spin mb-2">sync</mat-icon>
          <p>Buscando duplicados...</p>
        </div>

        <div *ngIf="error" class="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {{ error }}
        </div>

        <div *ngIf="!loading && duplicados.length > 0">
          <p class="text-sm text-gray-600 mb-3">Se encontraron {{ duplicados.length }} registros. Seleccione cu\u00e1l ser\u00e1 el Insumo Principal (el que conservar\u00e1 la descripci\u00f3n y atributos generales). Las ubicaciones de los dem\u00e1s se mantendr\u00e1n agregando stock al historial.</p>
          
          <form [formGroup]="form" (ngSubmit)="unificar()">
            <mat-form-field appearance="outline" class="w-full mb-2">
              <mat-label>Insumo Principal</mat-label>
              <mat-select formControlName="idInsumoPrincipal">
                <mat-option *ngFor="let insumo of duplicados" [value]="insumo.id">
                  [ID: {{ insumo.id }}] - (Stock: {{ insumo.stock }} | Ubicaci\u00f3n: {{ insumo.ubicacion || '-' }})
                </mat-option>
              </mat-select>
              <mat-error>Requerido</mat-error>
            </mat-form-field>

            <div class="bg-blue-50 text-blue-800 p-3 rounded-md mb-6 text-sm flex gap-2">
              <mat-icon class="text-blue-600">info</mat-icon>
              <div>
                <strong>Importante:</strong> Esta acci\u00f3n mover\u00e1 todos los movimientos del Kardex hacia el Insumo Principal y eliminar\u00e1 los registros duplicados.
              </div>
            </div>

            <!-- Actions embedded in form for submit -->
            <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button mat-button type="button" (click)="cerrar()" class="rounded-full text-gray-600 hover:bg-gray-200">Cancelar</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || submitting" class="btn-gloss shadow-md">
                <mat-icon class="mr-2" *ngIf="submitting">sync</mat-icon>
                {{ submitting ? 'Unificando...' : 'Confirmar Unificaci\u00f3n' }}
              </button>
            </div>
          </form>
        </div>

        <div *ngIf="!loading && duplicados.length <= 1" class="text-center py-6 text-gray-500">
          <mat-icon class="text-4xl text-udit-verde mb-2">check_circle</mat-icon>
          <p>No se encontraron duplicados para este c\u00f3digo.</p>
          <button mat-button color="primary" (click)="cerrar()" class="mt-4 rounded-full">Cerrar</button>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class PopupUnificarComponent implements OnInit, OnDestroy {
  fuseConfirmation = inject(FuseConfirmationService);

  form: FormGroup;
  loading = true;
  submitting = false;
  error: string | null = null;
  duplicados: any[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<PopupUnificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PopupUnificarData,
    private fb: FormBuilder,
    private insumoService: InsumoService
  ) {
    this.form = this.fb.group({
      idInsumoPrincipal: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.buscarDuplicados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buscarDuplicados(): void {
    this.duplicados = this.data.irr.detalles || [];
    if (this.duplicados.length > 0) {
      this.form.patchValue({ idInsumoPrincipal: this.duplicados[0].id });
    }
    this.loading = false;
  }

  unificar(): void {
    if (this.form.invalid) return;
    
    this.submitting = true;
    this.error = null;
    
    const idPrincipal = this.form.get('idInsumoPrincipal')?.value;
    
    this.insumoService.unificarDuplicados({
      codigoFabrica: this.data.irr.insumoRef!,
      idInsumoPrincipal: idPrincipal
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.submitting = false;
        this.dialogRef.close(true); // Retorna true para indicar \u00e9xito
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.message || 'Ocurri\u00f3 un error al unificar los registros.';
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}





