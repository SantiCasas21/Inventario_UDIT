import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
﻿import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiClientService } from '@app/core/http/api-client.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto } from '@app/core/models';
import { UnidadMedidaDto, UnidadMedidaService } from '@app/core/services/unidad-medida.service';

@Component({
  selector: 'app-popup-unidad-medida',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, MatDialogModule],
  templateUrl: './popup-unidad-medida.component.html',
  styleUrl: './popup-unidad-medida.component.scss'
})
export class PopupUnidadMedidaComponent implements OnInit {
  fuseConfirmation = inject(FuseConfirmationService);


  form: FormGroup;
  estado: any;
  endpoint: string;
  categorias: CatalogoDto[] = [];
  
  constructor(
    private dialog: MatDialogRef<PopupUnidadMedidaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private builder: FormBuilder,
    private api: ApiClientService,
    private service: UnidadMedidaService,
    private catalogoService: CatalogoService
  ) { 
    this.form = this.builder.group({
      nombre: ['', Validators.required],
      idCategoria: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.estado = this.data.estado;
    this.endpoint = this.data.endpoint || 'unidad-medida';
    
    this.catalogoService.getAll('categoria-insumo').subscribe(res => {
      this.categorias = res;
    });

    if (this.estado === 2 && this.data.data) {
      this.form.patchValue({
        nombre: this.data.data.nombre,
        idCategoria: this.data.data.idCategoria
      });
    }
  }

  cerrar() {
    this.dialog.close();
  }

  guardar() {
    if (this.form.valid) {
      if (this.estado === 1) {
        this.api.post(this.endpoint, this.form.value).subscribe(res => {
          this.cerrar();
        });
      } else if (this.estado === 2) {
        this.api.put(`${this.endpoint}/${this.data.data.id}`, this.form.value).subscribe(res => {
          this.cerrar();
        });
      }
    }
  }
}



