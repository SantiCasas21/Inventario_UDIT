import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SalidainsumosService } from '../../../../../../../@fuse/services/inventario/salidainsumos/salidainsumos.service';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-popup-salida-insumos',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDatepickerModule],
  templateUrl: './popup-salida-insumos.component.html',
  styleUrl: './popup-salida-insumos.component.scss'
})
export class PopupSalidaInsumosComponent {
  inputData:any;
  form:FormGroup;
  datoscompletos:any;
  listadoproyectos:any;
  proyectos: any;
  listadoestadosalida:any;
  estadosalidas: any;
  listadoinsumos:any;
  insumos: any;
  listadoinsumosCorta:any;
  insumosCorta: any;
  insumosCortaaux: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupSalidaInsumosComponent>, private formBuilder:FormBuilder, private service:SalidainsumosService) {
    this.form = this.formBuilder.group({
      idInsumo: ['', Validators.required],
      nombreInsumo: ['', Validators.required],
      descripcion: ['', Validators.required],
      idProyecto: ['', Validators.required],
      nombreProyecto: ['', Validators.required],
      idEstado: ['', Validators.required],
      nombreEstado: ['', Validators.required],
      fecha: ['', Validators.required],
      cantidad: ['', Validators.required],
      idInsumoTabla: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
    this.listarProyectos();
    this.listarInsumos();
    this.listarEstadoSalidas();
    this.listarInsumosCorta();
    //let nombreInsumoSolo = this.insumos.filter(x=> x.id == this.data.data.idinsumo);
    //this.insumosCortaaux = this.insumosCorta.filter(x=> x.tipo == nombreInsumoSolo[0].nombreInsumo);
    let nombreInsumoSolo = this.insumos.filter(x=> x.id == 1);
    this.insumosCortaaux = this.insumosCorta.filter(x=> x.tipo == nombreInsumoSolo[0].nombreInsumo);
    this.onOptionChange(this.data.data.idInsumo);

  }

  ngAfterViewInit(){
    let nombreInsumoSolo = this.data.data.nombreInsumo;//this.insumos.filter(x=> x.id == 1);
    this.insumosCortaaux = this.datoscompletos.listaInsumosCorta.filter(x=> x.tipo == nombreInsumoSolo);
  }

  cerrarPopup() {
    this.ref.close();
  }

  async listarProyectos(){

    this.datoscompletos = await this.service.listarSalidaInsumos();
    this.listadoproyectos = this.datoscompletos.listarProyectos;
    this.proyectos = this.listadoproyectos;



  }

  async listarInsumos(){

    this.datoscompletos = await this.service.listarSalidaInsumos();
    this.listadoinsumos = this.datoscompletos.listaNombreInsumos;
    this.insumos = this.listadoinsumos;
  }

  async listarEstadoSalidas(){

    this.datoscompletos = await this.service.listarSalidaInsumos();
    this.listadoestadosalida = this.datoscompletos.listaEstadoSalida;
    this.estadosalidas = this.listadoestadosalida;


  }

  async listarInsumosCorta(){

    this.datoscompletos = await this.service.listarSalidaInsumos();
    this.listadoinsumosCorta = this.datoscompletos.listaInsumosCorta;
    this.insumosCorta = this.listadoinsumosCorta;
  }

  guardarSalidaInsumos(){

    this.service.guardarSalidaInsumos(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
  }

  actualizarSalidaInsumos(){

    const edit : any ={
      id : this.data.data.id,
      idInsumo :  this.form.value.idInsumo,
      nombreInsumo :  this.form.value.nombreInsumo,
      descripcion :  this.form.value.descripcion,
      idProyecto :  this.form.value.idProyecto,
      nombreProyecto :  this.form.value.nombreProyecto,
      idEstado :  this.form.value.idEstado,
      nombreEstado :  this.form.value.nombreEstado,
      fecha :  this.form.value.fecha,
      cantidad :  this.form.value.cantidad,
      idInsumoTabla :  this.form.value.idInsumoTabla
    }
    var id = edit.id
    this.service.actualizarSalidaInsumos(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }

  onOptionChange(event) {
    let nombreInsumoSolo = this.insumos.filter(x=> x.id == event);
    this.insumosCortaaux = this.insumosCorta.filter(x=> x.tipo == nombreInsumoSolo[0].nombreInsumo);
  }
}
