import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ConfirmacionMetrica {
  label: string;
  value: string | number;
  icon?: string;
  colorClass?: string;
}

export interface ConfirmacionItem {
  codigo: string;
  descripcion?: string | null;
  cantidad: number;
  ubicacion?: string | null;
  precioUnitario?: number | null;
  proveedor?: string | null;
  tipoCompra?: string | null;
}

export interface ConfirmacionAccionData {
  titulo?: string;
  subtitulo?: string;
  icono?: string;
  tipo?: 'ingreso' | 'salida' | 'ajuste' | 'crear' | 'editar' | 'eliminar' | 'advertencia' | 'error' | 'info' | 'general';
  metricas?: ConfirmacionMetrica[];
  items?: ConfirmacionItem[];
  mensajePrincipal?: string;
  mensajeAdvertencia?: string;
  btnConfirmarTexto?: string;
  btnCancelarTexto?: string;
  soloAceptar?: boolean;
  btnAccionAdicionalTexto?: string;
}

@Component({
  selector: 'app-modal-confirmacion-accion',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './modal-confirmacion-accion.component.html',
  styleUrls: ['./modal-confirmacion-accion.component.scss']
})
export class ModalConfirmacionAccionComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmacionAccionData,
    private dialogRef: MatDialogRef<ModalConfirmacionAccionComponent>
  ) {}

  confirmar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  accionAdicional(): void {
    this.dialogRef.close('accion_adicional');
  }
}
