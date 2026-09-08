import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
    MatDividerModule, MatTooltipModule
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;

  savingProfile = false;
  savingPassword = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  previewAvatar: string | null = null;

  /** Patrón de contraseña segura: mín 6 chars, 1 mayúscula, 1 número, 1 símbolo */
  readonly passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;

  // Colección de avatares predefinidos de animales domésticos
  avatarPresets = [
    { name: 'Gatito', path: 'assets/images/avatars/animals/cat.svg' },
    { name: 'Perrito', path: 'assets/images/avatars/animals/dog.svg' },
    { name: 'Conejito', path: 'assets/images/avatars/animals/rabbit.svg' },
    { name: 'Hámster', path: 'assets/images/avatars/animals/hamster.svg' },
    { name: 'Lorito', path: 'assets/images/avatars/animals/parrot.svg' },
    { name: 'Tortuguita', path: 'assets/images/avatars/animals/turtle.svg' },
    { name: 'Pececito', path: 'assets/images/avatars/animals/fish.svg' },
    { name: 'Patito', path: 'assets/images/avatars/animals/duck.svg' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      nombreCompleto: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: [{ value: '', disabled: true }],
      avatarUrl: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6), Validators.pattern(this.passwordPattern)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.previewAvatar = user.avatar || null;
          this.profileForm.patchValue({
            nombreCompleto: user.nombreCompleto || user.name || '',
            username: user.username || '',
            email: user.email || '',
            role: user.role || 'User',
            avatarUrl: user.avatar || ''
          });
        }
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Seleccionar uno de los avatares predeterminados */
  selectPresetAvatar(avatarPath: string): void {
    this.previewAvatar = avatarPath;
    this.profileForm.patchValue({ avatarUrl: avatarPath });
    this.profileForm.markAsDirty();
  }

  /** Subir imagen desde disco y convertir a base64 */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.snackBar.open('La imagen no debe superar los 2 MB', 'Cerrar', { duration: 4000 });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewAvatar = e.target.result;
        this.profileForm.patchValue({ avatarUrl: e.target.result });
        this.profileForm.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  /** Eliminar imagen personalizada */
  removeAvatar(): void {
    this.previewAvatar = null;
    this.profileForm.patchValue({ avatarUrl: '' });
    this.profileForm.markAsDirty();
  }

  /** Guardar cambios en el perfil */
  guardarPerfil(): void {
    if (this.profileForm.invalid) return;

    this.savingProfile = true;
    const formVal = this.profileForm.getRawValue();

    this.authService.updateProfile({
      nombreCompleto: formVal.nombreCompleto,
      username: formVal.username,
      email: formVal.email,
      avatarUrl: this.previewAvatar || ''
    }).subscribe({
      next: (updatedUser) => {
        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', { duration: 4000 });
        this.savingProfile = false;
        this.profileForm.markAsPristine();
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err.message || 'No se pudo actualizar el perfil'), 'Cerrar', { duration: 6000 });
        this.savingProfile = false;
      }
    });
  }

  // Helpers de verificación de contraseña en tiempo real
  hasNewUpper(): boolean {
    const val = this.passwordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(val);
  }

  hasNewNumber(): boolean {
    const val = this.passwordForm.get('newPassword')?.value || '';
    return /\d/.test(val);
  }

  hasNewSymbol(): boolean {
    const val = this.passwordForm.get('newPassword')?.value || '';
    return /[^a-zA-Z0-9]/.test(val);
  }

  hasNewMinLength(): boolean {
    const val = this.passwordForm.get('newPassword')?.value || '';
    return val.length >= 6;
  }

  /** Cambiar contraseña */
  cambiarPassword(): void {
    if (this.passwordForm.invalid) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.snackBar.open('La nueva contraseña y su confirmación no coinciden', 'Cerrar', { duration: 4000 });
      return;
    }

    this.savingPassword = true;

    this.authService.changePassword({
      currentPassword,
      newPassword
    }).subscribe({
      next: () => {
        this.snackBar.open('Contraseña cambiada exitosamente', 'Cerrar', { duration: 4000 });
        this.passwordForm.reset();
        this.savingPassword = false;
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err.message || 'Contraseña actual incorrecta'), 'Cerrar', { duration: 6000 });
        this.savingPassword = false;
      }
    });
  }

  /** Obtener las iniciales del usuario */
  getUserInitials(): string {
    const name = this.profileForm.get('nombreCompleto')?.value || this.currentUser?.nombreCompleto || 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

