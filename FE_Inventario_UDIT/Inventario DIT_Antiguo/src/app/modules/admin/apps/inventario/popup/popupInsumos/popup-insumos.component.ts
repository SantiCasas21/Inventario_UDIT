import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
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
  fuseConfirmation = inject(FuseConfirmationService);

  form: FormGroup;
  categorias: CatalogoDto[] = [];
  empaquetamientos: CatalogoDto[] = [];
  todasLasUnidades: any[] = [];

  filteredCategorias!: Observable<CatalogoDto[]>;
  filteredEmpaquetamientos!: Observable<CatalogoDto[]>;

  unidadesDisponibles: string[] = [];

  monedasOpciones: string[] = ['COP', 'USD', 'EUR'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<PopupInsumosComponent>,
    private fb: FormBuilder,
    private insumoService: InsumoService,
    private catalogoService: CatalogoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      idCategoria: ['', Validators.required],
      codigoFabrica: ['', Validators.required],
      idEmpaquetamiento: ['', Validators.required],
      descripcion: ['', [Validators.maxLength(500)]],
      precioReferencia: [null],
      moneda: ['COP'],
      // Dimensiones físicas (condicional)
      valorMedida: [null],
      unidadMedida: [''],
      // Helpers for Autocomplete display
      categoriaObj: [''],
      empaquetamientoObj: ['']
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

      // En modo edición, filtrar los empaquetamientos por la categoría ya cargada
      const idCat = this.form.get('idCategoria')?.value;
      if (idCat) {
        this.actualizarEmpaquetamientosDisponiblesPorId(idCat);
      }
    });
    this.catalogoService.getAll('unidad-medida').subscribe((r: any[]) => {
      this.todasLasUnidades = r;
      const idCat = this.form.get('idCategoria')?.value;
      if (idCat) {
        this.actualizarUnidadesDisponiblesPorId(idCat);
      }
    });

    if (this.data?.data) {
      this.form.patchValue(this.data.data);
      if (!this.data.data.moneda) {
        this.form.get('moneda')?.setValue('COP');
      }
    }
  }

  private patchInitialData(fieldSuffix: string, list: CatalogoDto[]) {
    if (this.data?.data) {
      // Intentar leer tanto en camelCase como en PascalCase por si el backend serializa distinto
      const rawData = this.data.data as any;
      const id = rawData[`id${fieldSuffix}`] || rawData[`Id${fieldSuffix}`];
      
      console.log(`Patching ${fieldSuffix}... ID from data:`, id, 'List count:', list.length);
      if (id) {
        const obj = list.find(x => x.id === id || x.id == id);
        console.log(`Found obj for ${fieldSuffix}:`, obj);
        if (obj) {
          // Set value without emitting event to avoid triggering _filter unnecessarily
          this.form.get(`${fieldSuffix.toLowerCase()}Obj`)?.setValue(obj, { emitEvent: false });
          // Ensure the ID control is explicitly set to valid
          this.form.get(`id${fieldSuffix}`)?.setValue(id);
          this.cdr.detectChanges(); // Fix Angular Material floating label overlap
        } else {
          console.warn(`Object not found in list for ${fieldSuffix} with ID ${id}`);
        }
      }
    }
  }

  initCategoriasFilter() {
    this.filteredCategorias = this.form.get('categoriaObj')!.valueChanges.pipe(
      startWith(''),
      map(val => this._filter(val, this.categorias))
    );
    this.setupControlSync('categoriaObj', 'idCategoria', this.categorias, true);
  }

  actualizarUnidadesDisponiblesPorId(idCategoria: number | null) {
    if (idCategoria) {
      this.unidadesDisponibles = this.todasLasUnidades
        .filter(u => u.idCategoria === idCategoria)
        .map(u => u.nombre);
    } else {
      this.unidadesDisponibles = [];
    }

    const currentUnidad = this.form.get('unidadMedida')?.value;
    if (currentUnidad && this.unidadesDisponibles.length > 0 && !this.unidadesDisponibles.includes(currentUnidad)) {
      this.form.get('unidadMedida')?.setValue(null);
    }
  }

  /** Carga los empaquetamientos válidos para la categoría seleccionada. */
  actualizarEmpaquetamientosDisponiblesPorId(idCategoria: number | null) {
    const cargar = (list: any[]) => {
      // En modo edición, conservar el empaquetamiento actual aunque no esté en la lista filtrada
      const currentEmp = this.form.get('idEmpaquetamiento')?.value;
      if (currentEmp && !list.find(x => x.id === currentEmp)) {
        const cur = { id: currentEmp, nombre: this.data?.data?.empaquetamientoNombre || ('Empaque ' + currentEmp) };
        list = [...list, cur];
      }
      this.empaquetamientos = list;
      this.initEmpaquetamientosFilter();
    };

    if (idCategoria) {
      this.catalogoService.getByCategoria('empaquetamiento', idCategoria).subscribe(cargar);
    } else {
      this.catalogoService.getAll('empaquetamiento').subscribe(cargar);
    }
  }

  initEmpaquetamientosFilter() {
    this.filteredEmpaquetamientos = this.form.get('empaquetamientoObj')!.valueChanges.pipe(
      startWith(''),
      map(val => this._filter(val, this.empaquetamientos))
    );
    this.setupControlSync('empaquetamientoObj', 'idEmpaquetamiento', this.empaquetamientos);
  }

  private setupControlSync(objControlName: string, idControlName: string, list: CatalogoDto[], isCategoria = false) {
    this.form.get(objControlName)!.valueChanges.subscribe(val => {
      let matchedId = null;
      if (typeof val === 'string') {
        const exactMatch = list.find(x => x.nombre.toLowerCase() === val.toLowerCase().trim());
        if (exactMatch) matchedId = exactMatch.id;
      } else if (val && val.id) {
        matchedId = val.id;
      }

      const currentId = this.form.get(idControlName)?.value;
      if (currentId !== matchedId) {
        this.form.get(idControlName)?.setValue(matchedId);
        if (isCategoria) {
          this.actualizarUnidadesDisponiblesPorId(matchedId);
          this.actualizarEmpaquetamientosDisponiblesPorId(matchedId);
        }
      }
    });
  }

  private _filter(val: string | CatalogoDto, list: CatalogoDto[]): CatalogoDto[] {
    const text = typeof val === 'string' ? val : (val?.nombre || '');
    const filterValue = text.toLowerCase().trim();
    return list.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }

  displayFn(item?: CatalogoDto): string {
    return item && item.nombre ? item.nombre : '';
  }

  cerrarPopup(): void {
    this.ref.close();
  }

  guardarInsumo(): void {
    if (this.form.invalid) {
      this.mostrarCamposRequeridos();
      return;
    }
    const req: InsumoRequest = this.form.value;
    this.insumoService.create(req).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.mostrarErrorValidacion(err)
    });
  }

  actualizarInsumo(): void {
    if (this.form.invalid) {
      this.mostrarCamposRequeridos();
      return;
    }
    const id = this.data.data.id;
    const req: InsumoRequest = this.form.value;
    this.insumoService.update(id, req).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.mostrarErrorValidacion(err)
    });
  }

  private mostrarCamposRequeridos(): void {
    this.form.markAllAsTouched();
    const invalidControls: string[] = [];
    Object.keys(this.form.controls).forEach(key => {
      if (this.form.controls[key].invalid) {
        invalidControls.push(key);
      }
    });
    console.log('Controles inválidos:', invalidControls, this.form.value);

    this.fuseConfirmation.open({
      title: 'Formulario Incompleto',
      message: 'Por favor completa todos los campos requeridos y selecciona opciones válidas del buscador. Campos faltantes: ' + invalidControls.join(', '),
      icon: { show: true, name: 'heroicons_outline:exclamation-circle', color: 'warn' },
      actions: { confirm: { show: true, label: 'Entendido', color: 'primary' }, cancel: { show: false, label: 'Cancelar' } }
    });
  }

  private mostrarErrorValidacion(err: any): void {
    console.error('Error de validación:', err);
    const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'Ocurrió un error al guardar el registro.');
    
    // Si es error de duplicado
    if (msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('duplicado')) {
      const dialogRef = this.fuseConfirmation.open({
        title: 'Código de Fábrica Duplicado',
        message: msg + '<br/><br/>¿Deseas ir a la sección de Ingresos para registrar stock de este insumo?',
        icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
        actions: { 
          confirm: { show: true, label: 'Ir a ingresos', color: 'primary' }, 
          cancel: { show: true, label: 'Entendido' } 
        }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'confirmed') {
          this.ref.close();
          const codigo = this.form.get('codigoFabrica')?.value;
          this.router.navigate(['/movimientos'], { queryParams: { tab: 'ingresos', q: codigo } });
        }
      });
    } else {
      this.fuseConfirmation.open({
        title: 'Error de validación',
        message: msg,
        icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
        actions: { confirm: { show: true, label: 'Entendido', color: 'primary' }, cancel: { show: false, label: 'Cancelar' } }
      });
    }
  }
}
