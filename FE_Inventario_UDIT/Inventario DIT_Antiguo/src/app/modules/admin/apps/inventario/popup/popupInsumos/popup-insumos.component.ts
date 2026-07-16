import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InsumosService } from '../../../../../../../@fuse/services/inventario/insumos/insumos.service';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-popup-insumos',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule],
  templateUrl: './popup-insumos.component.html',
  styleUrl: './popup-insumos.component.scss'
})
export class PopupInsumosComponent {
  inputData: any;
  form: FormGroup;
  datoscompletos: any;
  listadoubicaciones: any;
  ubicaciones: any[] = [];
  listadoinsumos: any;
  insumos: any[] = [];
  listadoempaquetamiento: any;
  empaquetamientos: any[] = [];

  filteredUbicaciones: any[] = [];
  filteredEmpaquetamientos: any[] = [];
  filteredInsumos: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<PopupInsumosComponent>,
    private formBuilder: FormBuilder,
    private service: InsumosService
  ) {
    this.form = this.formBuilder.group({
      nombreInsumo: ['', Validators.required],
      idNombreInsumo: ['', Validators.required],
      codFabrica: ['', Validators.required],
      valor: ['', Validators.required],
      idEmpaquetamiento: ['', Validators.required],
      tipo: ['', Validators.required],
      descripcion: ['', Validators.required],
      idUbicacion: ['', Validators.required],
      ubicacion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    //debugger;
    this.loadData();
  }

  /*ngAfterViewInit(): void {
    const appRoot = document.querySelector('app-root');
    const focusedElement = document.activeElement;
  
    console.log('Elemento con foco:', focusedElement);
  
    if (appRoot && appRoot.hasAttribute('aria-hidden')) {
      console.error('Ancestro con aria-hidden encontrado:', appRoot);
    }
  }*/

  loadData(): void {
    this.service.listarInsumos()
      .then((datos) => {
        debugger;
        this.datoscompletos = datos;
        this.insumos = this.datoscompletos.listaInsumos || [];
        this.empaquetamientos = this.datoscompletos.listaEmpaquetamiento || [];
        this.ubicaciones = this.datoscompletos.listaUbicacion || [];
  
        // Sincronizar datos iniciales del formulario
        if (this.data?.data) {
          this.form.patchValue(this.data.data);
        }
  
        // Inicializar filtros
        this.filterInsumos('');
        this.filterEmpaquetamientos('');
        this.filterUbicaciones('');/**/
      })
      .catch((error) => {
        console.error('Error al cargar los datos:', error);
      });
  }

  guardarInsumos(): void {
    debugger;
    console.log(this.filteredInsumos);
    this.service.guardarInsumos(this.form.value).subscribe({
      next: (res: any) => {
        alert(res.mensaje);
        this.cerrarPopup();
      },
      error: (error) => {
        console.error('Error al guardar insumos:', error);
      }
    });
  }

  actualizarInsumos(): void {
    const edit = {
      id: this.data?.data?.id,
      ...this.form.value
    };
    this.service.actualizarInsumos(edit.id, edit).subscribe({
      next: (res) => {
        alert(res.mensaje);
        this.cerrarPopup();
      },
      error: (error) => {
        console.error('Error al actualizar insumos:', error);
      }
    });
  }

  cerrarPopup(): void {
    this.ref.close();
  }

  filterItems(items: any[], query: string, key: string): any[] {
    debugger;
    if (query) return items;
  
    query = query.toLowerCase();
    const filtered = items.filter(item => item[key]?.toLowerCase().includes(query));
  
    // Usar un Set para eliminar duplicados
    debugger;
    const uniqueItems = Array.from(new Map(filtered.map(item => [item[key], item])).values());
  
    return uniqueItems;
  }

  filterInsumos(query: string): void {
    this.filteredInsumos = this.filterItems(this.datoscompletos.listaInsumos, query, 'nombreInsumo');
  }

  filterEmpaquetamientos(query: string): void {
    this.filteredEmpaquetamientos = this.filterItems(this.datoscompletos.listaEmpaquetamiento, query, 'tipo');
  }

  filterUbicaciones(query: string): void {
    this.filteredUbicaciones = this.filterItems(this.datoscompletos.listaUbicacion, query, 'ubicacion');
  }


  filterItems2(items: any[], query: string, key: string): any[] {
    debugger;
    //if (query) return items;
  
    query = query.toLowerCase();
    const filtered = items.filter(item => item[key]?.toLowerCase().includes(query));
  
    // Usar un Set para eliminar duplicados
    debugger;
    const uniqueItems = Array.from(new Map(filtered.map(item => [item[key], item])).values());
  
    return uniqueItems;
  }

  filterInsumos2(query: string): void {
    this.filteredInsumos = this.filterItems2(this.datoscompletos.listaInsumos, query, 'nombreInsumo');
  }

  filterEmpaquetamientos2(query: string): void {
    this.filteredEmpaquetamientos = this.filterItems2(this.datoscompletos.listaEmpaquetamiento, query, 'tipo');
  }

  filterUbicaciones2(query: string): void {
    this.filteredUbicaciones = this.filterItems2(this.datoscompletos.listaUbicacion, query, 'ubicacion');
  }
}
