import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { InsumoService } from '@app/core/services/insumo.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto, InsumoRequest } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'app-popup-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDialogModule, MatAutocompleteModule, MatIconModule],
  templateUrl: './popup-insumos.component.html',
  styleUrl: './popup-insumos.component.scss'
})
export class PopupInsumosComponent implements OnInit {
  form: FormGroup;
  categorias: CatalogoDto[] = [];
  empaquetamientos: CatalogoDto[] = [];
  ubicaciones: CatalogoDto[] = [];

  filteredCategorias!: Observable<CatalogoDto[]>;
  filteredEmpaquetamientos!: Observable<CatalogoDto[]>;
  filteredUbicaciones!: Observable<CatalogoDto[]>;

  unidadesPorCategoria: { [key: string]: string[] } = {
    'resistencia': ['OHM', 'KOHM', 'MOHM'],
    'condensador': ['PF', 'NF', 'UF', 'MF', 'F'],
    'inductor': ['NH', 'UH', 'MH', 'H'],
    'bobina': ['NH', 'UH', 'MH', 'H'],
    'transistor': ['NPN', 'PNP', 'MOSFET'],
    'diodo': ['V', 'A', 'W'],
    'bateria': ['V', 'MAH', 'AH'],
    'pila': ['V', 'MAH', 'AH'],
    'motor': ['RPM', 'V', 'W'],
    'display': ['PULGADAS', 'PIXELES', 'CARACTERES'],
    'pantalla': ['PULGADAS', 'PIXELES', 'CARACTERES'],
    'cable': ['M', 'CM', 'MM', 'AWG', 'CALIBRE'],
    'microcontrolador': ['BITS', 'MHZ', 'KB', 'MB'],
    'integrado': ['PINS', 'BITS', 'MHZ'],
    'potenciometro': ['OHM', 'KOHM', 'MOHM']
  };
  unidadesDisponibles: string[] = [];

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
      valorMedida: [null],
      unidadMedida: [null],
      // Helpers for Autocomplete display
      categoriaObj: [''],
      empaquetamientoObj: [''],
      ubicacionObj: [''],
    });
  }

  ngOnInit(): void {
    this.catalogoService.getAll('categoria-insumo').subscribe(r => {
      this.categorias = r;
      this.initCategoriasFilter();
      this.patchInitialData('Categoria', this.categorias);
    });
    this.catalogoService.getAll('empaquetamiento').subscribe(r => {
      this.empaquetamientos = r;
      this.initEmpaquetamientosFilter();
      this.patchInitialData('Empaquetamiento', this.empaquetamientos);
    });
    this.catalogoService.getAll('ubicacion').subscribe(r => {
      this.ubicaciones = r;
      this.initUbicacionesFilter();
      this.patchInitialData('Ubicacion', this.ubicaciones);
    });

    if (this.data?.data) {
      this.form.patchValue(this.data.data);
    }
  }

  private patchInitialData(fieldSuffix: string, list: CatalogoDto[]) {
    if (this.data?.data) {
      const id = this.data.data[`id${fieldSuffix}`];
      if (id) {
        const obj = list.find(x => x.id === id);
        if (obj) this.form.get(`${fieldSuffix.toLowerCase()}Obj`)?.setValue(obj);
      }
    }
  }

  initCategoriasFilter() {
    this.filteredCategorias = this.form.get('categoriaObj')!.valueChanges.pipe(
      startWith(''),
      map(val => {
        const results = this._filter(val, this.categorias, 'idCategoria');
        this.actualizarUnidadesDisponibles(val);
        return results;
      })
    );
  }

  actualizarUnidadesDisponibles(val: string | CatalogoDto | null) {
    let catName = '';
    if (val && typeof val !== 'string' && val.nombre) {
      catName = val.nombre;
    } else if (this.form.get('categoriaObj')?.value?.nombre) {
       catName = this.form.get('categoriaObj')?.value?.nombre;
    }

    if (catName) {
      const lowerCatName = catName.toLowerCase();
      // Buscar coincidencia parcial (ej. "Resistencias de precisión" debe coincidir con "resistencia")
      // Primero intenta coincidencia directa, luego por keywords parciales
      const key = Object.keys(this.unidadesPorCategoria).find(k => lowerCatName.includes(k));
      // Si no hay coincidencia directa, intentar con keywords adicionales
      const extendedKey = !key ? this._findExtendedKey(lowerCatName) : key;
      this.unidadesDisponibles = extendedKey ? this.unidadesPorCategoria[extendedKey] : ['UN', 'M', 'CM', 'MM', 'G', 'KG', 'L', 'ML', 'V', 'A', 'W', 'HZ'];
    } else {
      this.unidadesDisponibles = [];
    }

    // Limpiar si la unidad actual ya no está disponible
    const currentUnidad = this.form.get('unidadMedida')?.value;
    if (currentUnidad && this.unidadesDisponibles.length > 0 && !this.unidadesDisponibles.includes(currentUnidad)) {
      this.form.get('unidadMedida')?.setValue(null);
    }
  }

  initEmpaquetamientosFilter() {
    this.filteredEmpaquetamientos = this.form.get('empaquetamientoObj')!.valueChanges.pipe(
      startWith(''),
      map(val => this._filter(val, this.empaquetamientos, 'idEmpaquetamiento'))
    );
  }

  initUbicacionesFilter() {
    this.filteredUbicaciones = this.form.get('ubicacionObj')!.valueChanges.pipe(
      startWith(''),
      map(val => this._filter(val, this.ubicaciones, 'idUbicacion'))
    );
  }

  /** Buscar keywords extendidos para coincidencia parcial con nombres de categorías */
  private _findExtendedKey(lowerCatName: string): string | undefined {
    const extendedKeywords: { keywords: string[]; target: string }[] = [
      { keywords: ['resist', 'potenciomet'], target: 'resistencia' },
      { keywords: ['condens', 'capacit'], target: 'condensador' },
      { keywords: ['induct', 'bobina'], target: 'inductor' },
      { keywords: ['transist'], target: 'transistor' },
      { keywords: ['diodo', 'led'], target: 'diodo' },
      { keywords: ['bateria', 'pila', 'battery'], target: 'bateria' },
      { keywords: ['motor'], target: 'motor' },
      { keywords: ['display', 'pantalla', 'lcd', 'oled'], target: 'display' },
      { keywords: ['cable', 'alambre', 'wire'], target: 'cable' },
      { keywords: ['microcontro', 'mcu', 'arduino', 'esp'], target: 'microcontrolador' },
      { keywords: ['integrado', 'ic', 'chip'], target: 'integrado' },
    ];
    for (const entry of extendedKeywords) {
      if (entry.keywords.some(kw => lowerCatName.includes(kw))) {
        return entry.target;
      }
    }
    return undefined;
  }

  private _filter(val: string | CatalogoDto, list: CatalogoDto[], targetControl: string): CatalogoDto[] {
    let name = '';
    if (typeof val === 'string') {
      name = val;
      if (name === '') this.form.get(targetControl)?.setValue(null); // Clear ID if text is empty
    } else if (val && val.nombre) {
      name = val.nombre;
      this.form.get(targetControl)?.setValue(val.id); // Set ID
    }

    const filterValue = name.toLowerCase();
    return list.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }

  displayFn(item?: CatalogoDto): string {
    return item && item.nombre ? item.nombre : '';
  }

  cerrarPopup(): void {
    this.ref.close();
  }

  guardarInsumo(): void {
    if (this.form.invalid) return;
    const req: InsumoRequest = this.form.value;
    this.insumoService.create(req).subscribe({
      next: () => this.ref.close(true),
      error: (err) => console.error('Error al guardar insumo:', err)
    });
  }

  actualizarInsumo(): void {
    if (this.form.invalid) return;
    const id = this.data.data.id;
    const req: InsumoRequest = this.form.value;
    this.insumoService.update(id, req).subscribe({
      next: () => this.ref.close(true),
      error: (err) => console.error('Error al actualizar insumo:', err)
    });
  }
}
