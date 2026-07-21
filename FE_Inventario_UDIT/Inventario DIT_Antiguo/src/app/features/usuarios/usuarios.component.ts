import { Component, OnInit } from '@angular/core';
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
import { AuthService } from 'app/core/auth/auth.service';

/** Usuarios de prueba predefinidos para crear */
const TEST_USERS = [
  { username: 'developer1', email: 'dev@udit-inventario.com', password: 'Dev2026!', nombreCompleto: 'Desarrollador UDIT', role: 'Developer' },
  { username: 'assistant1', email: 'assistant@udit-inventario.com', password: 'Asst2026!', nombreCompleto: 'Asistente UDIT', role: 'Assistant' },
  { username: 'user1', email: 'user@udit-inventario.com', password: 'User2026!', nombreCompleto: 'Usuario UDIT', role: 'User' },
];

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
export class UsuariosComponent implements OnInit {
  registerForm: FormGroup;
  testUsers = TEST_USERS;
  registeredUsers: string[] = [];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
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
    // Cargar del localStorage los usuarios ya creados
    const saved = localStorage.getItem('udit_registered_users');
    if (saved) {
      this.registeredUsers = JSON.parse(saved);
    }
  }

  /** Registrar un usuario nuevo */
  registrarUsuario(): void {
    if (this.registerForm.invalid) return;
    const data = this.registerForm.value;

    this.authService.register(data).subscribe({
      next: (response) => {
        this.snackBar.open(`Usuario "${response.username}" creado con rol ${response.role}`, 'Cerrar', { duration: 5000 });
        this.registeredUsers.push(data.username);
        localStorage.setItem('udit_registered_users', JSON.stringify(this.registeredUsers));
        this.registerForm.reset({ role: 'User' });
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err?.message || 'No se pudo crear el usuario. ¿Eres Admin?'), 'Cerrar', { duration: 8000 });
      }
    });
  }

  /** Crear un usuario de prueba predefinido */
  crearUsuarioPrueba(user: typeof TEST_USERS[0]): void {
    this.authService.register(user).subscribe({
      next: (response) => {
        this.snackBar.open(`Usuario "${response.username}" (${response.role}) creado exitosamente`, 'Cerrar', { duration: 5000 });
        this.registeredUsers.push(user.username);
        localStorage.setItem('udit_registered_users', JSON.stringify(this.registeredUsers));
      },
      error: (err) => {
        if (err?.message?.includes('Duplicate')) {
          this.snackBar.open(`El usuario "${user.username}" ya existe.`, 'Cerrar', { duration: 3000 });
          if (!this.registeredUsers.includes(user.username)) {
            this.registeredUsers.push(user.username);
            localStorage.setItem('udit_registered_users', JSON.stringify(this.registeredUsers));
          }
        } else {
          this.snackBar.open('Error al crear "' + user.username + '": ' + (err?.message || 'Solo Admin puede crear usuarios'), 'Cerrar', { duration: 8000 });
        }
      }
    });
  }

  /** Verificar si el usuario ya fue creado */
  isCreated(username: string): boolean {
    return this.registeredUsers.includes(username);
  }
}
