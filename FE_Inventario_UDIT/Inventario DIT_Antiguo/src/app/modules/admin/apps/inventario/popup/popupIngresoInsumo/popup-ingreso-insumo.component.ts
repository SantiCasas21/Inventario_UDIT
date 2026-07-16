import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IngresoinsumoService } from '../../../../../../../@fuse/services/inventario/ingresoinsumo/ingresoinsumo.service';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-ingreso-insumo',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDatepickerModule],
  templateUrl: './popup-ingreso-insumo.component.html',
  styleUrl: './popup-ingreso-insumo.component.scss'
})
export class PopupIngresoInsumoComponent {
  inputData:any;
  form:FormGroup;
  datoscompletos:any;
  listadoproveedores:any;
  proveedores: any;
  listadoinsumos:any;
  insumos: any;
  listadoinsumosCorta:any;
  insumosCorta: any;
  insumosCortaaux: any;
  listadotipocompra:any;
  tipocompras: any;
  listadoproyectos:any;
  proyectos: any;
  filteredCodigo: any[]; // Lista de ubicaciones filtradas

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupIngresoInsumoComponent>, private formBuilder:FormBuilder, private service:IngresoinsumoService) {
    this.form = this.formBuilder.group({
      idProveedor: ['', Validators.required],
      nombreProveedor: ['', Validators.required],
      idInsumo: ['', Validators.required],
      nombreInsumo: ['', Validators.required],
      cantidad: ['', Validators.required],
      idTipoCompra: ['', Validators.required],
      nombreTipoCompra: ['', Validators.required],
      idProyecto: ['', Validators.required],
      nombreProyecto: ['', Validators.required],
      fecha: ['', Validators.required],
      precioUnit: ['', Validators.required],
      restante: [0 , Validators.required],
      idInsumoTabla: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    this.form.patchValue(this.data.data);
    this.listarProveedores();
    this.listarInsumos();
    this.listarInsumosCorta();
    this.listarTipoCompra();
    this.listaProyectos();


    this.datoscompletos = await this.service.listarIngresoInsumo();
    this.listadoinsumosCorta = this.datoscompletos.listaInsumosCorta;
    this.insumosCorta = this.listadoinsumosCorta;
    this.insumosCortaaux = this.insumosCorta;
    this.filteredCodigo = this.insumosCortaaux ;

  }

  async listarProveedores(){

    this.datoscompletos = await this.service.listarIngresoInsumo();
    this.listadoproveedores = this.datoscompletos.listaProveedores;
    this.proveedores = this.listadoproveedores;

  }

  async listarInsumos(){

    this.datoscompletos = await this.service.listarIngresoInsumo();
    this.listadoinsumos = this.datoscompletos.listaNombreInsumos;
    this.insumos = this.listadoinsumos;

  }

  async listarInsumosCorta(){

    this.datoscompletos = await this.service.listarIngresoInsumo();
    this.listadoinsumosCorta = this.datoscompletos.listaInsumosCorta;
    this.insumosCorta = this.listadoinsumosCorta;
    this.insumosCortaaux = this.insumosCorta;
    console.log(this.insumosCorta);
  }

  async listarTipoCompra(){

    this.datoscompletos = await this.service.listarIngresoInsumo();
    this.listadotipocompra = this.datoscompletos.listaTipoCompra;
    this.tipocompras = this.listadotipocompra;
  }

  async listaProyectos(){

    this.datoscompletos = await this.service.listarIngresoInsumo();
    this.listadoproyectos = this.datoscompletos.listaProyectos;
    this.proyectos = this.listadoproyectos;
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarIngresoInsumo(){
    this.service.guardarIngresoInsumo(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
  }

  actualizarIngresoInsumo(){
    const edit : any ={
      id : this.data.data.id,
      idProveedor :  this.form.value.idProveedor,
      nombreProveedor :  this.form.value.nombreProveedor,
      idInsumo :  this.form.value.idInsumo,
      nombreInsumo :  this.form.value.nombreInsumo,
      cantidad :  this.form.value.cantidad,
      idTipoCompra :  this.form.value.idTipoCompra,
      nombreTipoCompra :  this.form.value.nombreTipoCompra,
      idProyecto :  this.form.value.idProyecto,
      nombreProyecto :  this.form.value.nombreProyecto,
      fecha :  this.form.value.fecha,
      precioUnit :  this.form.value.precioUnit,
      restante :  this.form.value.restante,
      idInsumoTabla :  this.form.value.idInsumoTabla
    }
    var id = edit.id
    this.service.actualizarIngresoInsumo(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }

  onOptionChange(event) {
  
    let nombreInsumoSolo = this.insumos.filter(x=> x.id == event);
    this.insumosCortaaux = this.insumosCorta.filter(x=> x.tipo == nombreInsumoSolo[0].nombreInsumo);
    this.filteredCodigo = this.insumosCortaaux;
  }

  filterCodigo(query: string) {
    if (!query) {
      this.filteredCodigo = this.insumosCortaaux; // Si no hay consulta, mostrar todas las ubicaciones
    } else {
      query = query.toLowerCase(); // Convertir la consulta a minúsculas
    
      this.filteredCodigo = this.insumosCortaaux.filter(x => x.cod_Fabricante.toLowerCase().includes(query));
    }
  }
}
