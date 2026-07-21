import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { InsumoService } from '@app/core/services/insumo.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto, InsumoRequest } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-popup-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDialogModule],
  templateUrl: './popup-insumos.component.html',
  styleUrl: './popup-insumos.component.scss'
})
export class PopupInsumosComponent implements OnInit {
  form: FormGroup;
  categorias: CatalogoDto[] = [];
  empaquetamientos: CatalogoDto[] = [];
  ubicaciones: CatalogoDto[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<PopupInsumosComponent>,
    private fb: FormBuilder,
    private insumoService: InsumoService,
    private catalogoService: CatalogoService
  ) {
    this.form = this.fb.group({
      idCategoria: ['', Validators.required],
      codigoFabrica: ['', Validators.required],
      idEmpaquetamiento: ['', Validators.required],
      idUbicacion: ['', Validators.required],
      descripcion: [''],
      precioReferencia: [null],
    });
  }

  ngOnInit(): void {
    if (this.data?.data) {
      this.form.patchValue(this.data.data);
    }
    this.catalogoService.getAll('categoria-insumo').subscribe(r => this.categorias = r);
    this.catalogoService.getAll('empaquetamiento').subscribe(r => this.empaquetamientos = r);
    this.catalogoService.getAll('ubicacion').subscribe(r => this.ubicaciones = r);
  }

  cerrarPopup(): void {
    this.ref.close();
  }

  guardarInsumo(): void {
    if (this.form.invalid) return;
    const req: InsumoRequest = this.form.value;
    this.insumoService.create(req).subscribe({
      next: () => {
        this.ref.close(true);
      },
      error: (err) => {
        console.error('Error al guardar insumo:', err);
      }
    });
  }

  actualizarInsumo(): void {
    if (this.form.invalid) return;
    const id = this.data.data.id;
    const req: InsumoRequest = this.form.value;
    this.insumoService.update(id, req).subscribe({
      next: () => {
        this.ref.close(true);
      },
      error: (err) => {
        console.error('Error al actualizar insumo:', err);
      }
    });
  }
}
