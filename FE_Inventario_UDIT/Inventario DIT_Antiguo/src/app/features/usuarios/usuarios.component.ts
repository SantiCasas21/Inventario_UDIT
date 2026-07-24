import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { UserManagementService } from '@app/core/services/user-management.service';
import { UserDto } from '@app/core/models';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatCardModule,
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  users: UserDto[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns: string[] = ['username', 'email', 'nombreCompleto', 'role', 'activo', 'acciones'];

  roleTips = [
    { role: 'Admin', icon: 'admin_panel_settings', color: '#B11F16', desc: 'Control total del sistema. Puede crear, editar, eliminar y gestionar usuarios.' },
    { role: 'Developer', icon: 'build', color: '#1472B8', desc: 'CRUD completo en catálogos, insumos y movimientos. No puede eliminar ni gestionar usuarios.' },
    { role: 'Assistant', icon: 'inventory_2', color: '#ACAA00', desc: 'Gestiona movimientos (ingresos/salidas) e insumos. Opera en el día a día.' },
    { role: 'User', icon: 'visibility', color: '#636F03', desc: 'Solo lectura. Puede ver dashboard, insumos, movimientos y reportes.' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private userManagementService: UserManagementService,
    private fuseConfirmation: FuseConfirmationService,
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombreCompleto: ['', Validators.required],
      role: ['User', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.userManagementService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.users = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar usuarios: ' + (err.message || 'Error de conexión');
          this.loading = false;
        }
      });
  }

  registrarUsuario(): void {
    if (this.registerForm.invalid) return;
    const data = this.registerForm.value;

    this.authService.register(data).subscribe({
      next: (response) => {
        this.snackBar.open(`Usuario "${response.username}" creado con rol ${response.role}`, 'Cerrar', { duration: 5000 });
        this.registerForm.reset({ role: 'User' });
        this.loadUsers();
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err?.message || 'Solo Admin puede crear usuarios'), 'Cerrar', { duration: 8000 });
      }
    });
  }

  confirmDeactivate(user: UserDto): void {
    const dialog = this.fuseConfirmation.open({
      title: 'Desactivar usuario',
      message: `¿Está seguro de desactivar a "${user.nombreCompleto}" (@${user.username})? El usuario no podrá iniciar sesión.`,
      icon: { name: 'heroicons_outline:no-symbol', color: 'warn' },
      actions: {
        confirm: { label: 'Sí, desactivar', color: 'warn' },
        cancel: { label: 'Cancelar' },
      },
    });
    dialog.afterClosed().subscribe(result => {
      if (result === 'confirmed') {
        this.userManagementService.deactivate(user.id).subscribe({
          next: () => {
            this.snackBar.open(`Usuario "${user.username}" desactivado`, 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => this.snackBar.open('Error: ' + (err.message || 'Error al desactivar'), 'Cerrar', { duration: 5000 })
        });
      }
    });
  }

  confirmActivate(user: UserDto): void {
    const dialog = this.fuseConfirmation.open({
      title: 'Activar usuario',
      message: `¿Está seguro de reactivar a "${user.nombreCompleto}" (@${user.username})? Podrá iniciar sesión nuevamente.`,
      icon: { name: 'heroicons_outline:check-circle', color: 'primary' },
      actions: {
        confirm: { label: 'Sí, activar', color: 'primary' },
        cancel: { label: 'Cancelar' },
      },
    });
    dialog.afterClosed().subscribe(result => {
      if (result === 'confirmed') {
        this.userManagementService.activate(user.id).subscribe({
          next: () => {
            this.snackBar.open(`Usuario "${user.username}" activado`, 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => this.snackBar.open('Error: ' + (err.message || 'Error al activar'), 'Cerrar', { duration: 5000 })
        });
      }
    });
  }

  confirmDelete(user: UserDto): void {
    const dialog = this.fuseConfirmation.open({
      title: 'Eliminar usuario',
      message: `¿Está seguro de eliminar PERMANENTEMENTE a "${user.nombreCompleto}" (@${user.username}, ID: ${user.id})? Esta acción no se puede deshacer.`,
      icon: { name: 'heroicons_outline:trash', color: 'warn' },
      actions: {
        confirm: { label: 'Sí, eliminar', color: 'warn' },
        cancel: { label: 'Cancelar' },
      },
    });
    dialog.afterClosed().subscribe(result => {
      if (result === 'confirmed') {
        this.userManagementService.delete(user.id).subscribe({
          next: () => {
            this.snackBar.open(`Usuario "${user.username}" eliminado permanentemente`, 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => this.snackBar.open('Error: ' + (err.message || 'Error al eliminar'), 'Cerrar', { duration: 5000 })
        });
      }
    });
  }
}
