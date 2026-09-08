import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { UserManagementService } from '@app/core/services/user-management.service';
import { UserDto } from '@app/core/models';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatCardModule, MatTooltipModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  users: UserDto[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns: string[] = ['usuario', 'contacto', 'role', 'estado', 'fechaCreacion', 'acciones'];

  // Filtros de búsqueda
  searchTerm: string = '';
  roleFilter: string = 'ALL';
  statusFilter: string = 'ALL';

  // Estado para modal de cambio de rol
  selectedUserForRoleEdit: UserDto | null = null;
  selectedNewRole: string = 'User';
  updatingRole: boolean = false;

  // Estado para modal de registro de nuevo usuario (Admin)
  isCreateUserModalOpen: boolean = false;
  creatingUser: boolean = false;
  createUserError: string | null = null;
  newUserForm = {
    nombreCompleto: '',
    username: '',
    email: '',
    role: 'User'
  };

  private destroy$ = new Subject<void>();


  constructor(
    private snackBar: MatSnackBar,
    private userManagementService: UserManagementService,
    private confirmacionService: ConfirmacionService,
  ) {}

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

  // ── Métricas y Contadores ───────────────────────────────────────────
  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter(u => u.activo).length;
  }

  get inactiveUsers(): number {
    return this.users.filter(u => !u.activo).length;
  }

  get adminCount(): number {
    return this.users.filter(u => u.role === 'Admin').length;
  }

  get developerCount(): number {
    return this.users.filter(u => u.role === 'Developer').length;
  }

  get assistantCount(): number {
    return this.users.filter(u => u.role === 'Assistant').length;
  }

  get userCount(): number {
    return this.users.filter(u => u.role === 'User').length;
  }

  // ── Filtro en Tiempo Real ────────────────────────────────────────────
  get filteredUsers(): UserDto[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.users.filter(u => {
      // Filtro de texto
      const matchesSearch = !term ||
        u.username.toLowerCase().includes(term) ||
        u.nombreCompleto.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);

      // Filtro de rol
      const matchesRole = this.roleFilter === 'ALL' || u.role === this.roleFilter;

      // Filtro de estado
      const matchesStatus = this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' && u.activo) ||
        (this.statusFilter === 'INACTIVE' && !u.activo);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  getUserInitials(u: UserDto): string {
    const name = u.nombreCompleto || u.username || 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // ── Acciones de Usuario ──────────────────────────────────────────────
  confirmDeactivate(user: UserDto): void {
    this.confirmacionService.confirmar({
      titulo: 'Desactivar usuario',
      mensajePrincipal: `¿Está seguro de desactivar a "${user.nombreCompleto}" (@${user.username})?`,
      subtitulo: '⚠️ El usuario no podrá iniciar sesión y se programará su eliminación automática tras 30 días de inactividad.',
      tipo: 'advertencia',
      btnConfirmarTexto: 'Sí, desactivar',
      btnCancelarTexto: 'Cancelar'
    }).subscribe(confirmado => {
      if (confirmado) {
        this.userManagementService.deactivate(user.id).subscribe({
          next: () => {
            this.snackBar.open(`Usuario "${user.username}" desactivado. Se eliminará en 30 días si no es reactivado.`, 'Cerrar', { duration: 5000 });
            this.loadUsers();
          },
          error: (err) => this.confirmacionService.mostrarError('Error al desactivar', err.message || 'Error al desactivar el usuario')
        });
      }
    });
  }

  confirmActivate(user: UserDto): void {
    this.confirmacionService.confirmar({
      titulo: 'Activar usuario',
      mensajePrincipal: `¿Está seguro de reactivar a "${user.nombreCompleto}" (@${user.username})?`,
      subtitulo: 'Podrá iniciar sesión normalmente y se cancelará su programación de eliminación.',
      tipo: 'crear',
      btnConfirmarTexto: 'Sí, activar',
      btnCancelarTexto: 'Cancelar'
    }).subscribe(confirmado => {
      if (confirmado) {
        this.userManagementService.activate(user.id).subscribe({
          next: () => {
            this.snackBar.open(`Usuario "${user.username}" activado exitosamente`, 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => this.confirmacionService.mostrarError('Error al activar', err.message || 'Error al activar el usuario')
        });
      }
    });
  }

  confirmDelete(user: UserDto): void {
    const nombre = user.nombreCompleto || `@${user.username}`;
    this.confirmacionService.confirmarEliminacion('Usuario', nombre).subscribe(confirmado => {
      if (confirmado) {
        this.userManagementService.delete(user.id).subscribe({
          next: () => {
            this.snackBar.open(`Usuario "${user.username}" eliminado permanentemente`, 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => {
            const msg = err.message || err.error?.message || 'No se pudo eliminar el usuario.';
            this.confirmacionService.mostrarAdvertencia('No es posible eliminar el usuario', msg, `Usuario: "${nombre}"`);
          }
        });
      }
    });
  }

  // ── Edición exclusiva de Rol ──────────────────────────────────────────
  openEditRole(user: UserDto): void {
    this.selectedUserForRoleEdit = user;
    this.selectedNewRole = user.role;
  }

  cancelEditRole(): void {
    this.selectedUserForRoleEdit = null;
  }

  saveUserRole(): void {
    if (!this.selectedUserForRoleEdit) return;
    const user = this.selectedUserForRoleEdit;
    const newRole = this.selectedNewRole;

    this.confirmacionService.confirmar({
      titulo: 'Actualizar Rol de Usuario',
      mensajePrincipal: `¿Desea cambiar el rol de "${user.nombreCompleto}" a "${newRole}"?`,
      subtitulo: 'Los permisos del usuario se actualizarán en su próxima sesión.',
      tipo: 'editar',
      btnConfirmarTexto: 'Guardar Cambios',
      btnCancelarTexto: 'Cancelar'
    }).subscribe(confirmado => {
      if (confirmado) {
        this.updatingRole = true;
        this.userManagementService.updateRole(user.id, newRole).subscribe({
          next: () => {
            this.snackBar.open(`Rol de "${user.username}" actualizado a "${newRole}" exitosamente`, 'Cerrar', { duration: 4000 });
            this.updatingRole = false;
            this.selectedUserForRoleEdit = null;
            this.loadUsers();
          },
          error: (err) => {
            this.updatingRole = false;
            this.confirmacionService.mostrarAdvertencia('Error al actualizar rol', err.message || 'No se pudo actualizar el rol');
          }
        });
      }
    });
  }

  // ── Creación de Usuario por el Administrador ─────────────────────────
  openCreateUserModal(): void {
    this.newUserForm = {
      nombreCompleto: '',
      username: '',
      email: '',
      role: 'User'
    };
    this.createUserError = null;
    this.isCreateUserModalOpen = true;
  }

  closeCreateUserModal(): void {
    this.isCreateUserModalOpen = false;
    this.createUserError = null;
  }

  saveNewUser(): void {
    if (!this.newUserForm.username.trim()) {
      this.createUserError = 'El nombre de usuario es obligatorio.';
      return;
    }

    if (!this.newUserForm.email.trim()) {
      this.createUserError = 'El correo electrónico es obligatorio.';
      return;
    }

    const nombre = this.newUserForm.nombreCompleto || this.newUserForm.username;
    this.confirmacionService.confirmarGuardado('Usuario', false, nombre).subscribe(confirmado => {
      if (confirmado) {
        this.creatingUser = true;
        this.createUserError = null;

        this.userManagementService.create({
          nombreCompleto: this.newUserForm.nombreCompleto.trim(),
          username: this.newUserForm.username.trim(),
          email: this.newUserForm.email.trim(),
          role: this.newUserForm.role
        }).subscribe({
          next: (user) => {
            this.creatingUser = false;
            this.isCreateUserModalOpen = false;
            this.snackBar.open(`Usuario "${user.username}" registrado exitosamente. Contraseña temporal por defecto: Udit2026!`, 'Cerrar', {
              duration: 6000,
              panelClass: ['bg-emerald-600', 'text-white']
            });
            this.loadUsers();
          },
          error: (err) => {
            this.creatingUser = false;
            this.createUserError = err?.message || err?.error?.message || 'Error al registrar el nuevo usuario.';
            this.confirmacionService.mostrarAdvertencia('Error al registrar usuario', this.createUserError || 'Error');
          }
        });
      }
    });
  }
}



