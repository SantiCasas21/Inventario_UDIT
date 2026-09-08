import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';

@Component({
  selector: 'app-cambiar-password-inicial',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cambiar-password-inicial.component.html',
  styleUrls: ['./cambiar-password-inicial.component.scss']
})
export class CambiarPasswordInicialComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;
  currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      currentPassword: ['Udit2026!', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{6,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  ngOnInit(): void {
    this.userService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  passwordsMatchValidator(g: FormGroup) {
    const newPass = g.get('newPassword')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  // Helpers para validación visual de seguridad
  get hasMinLength(): boolean {
    const val = this.form.get('newPassword')?.value || '';
    return val.length >= 6;
  }

  get hasUppercase(): boolean {
    const val = this.form.get('newPassword')?.value || '';
    return /[A-Z]/.test(val);
  }

  get hasNumber(): boolean {
    const val = this.form.get('newPassword')?.value || '';
    return /\d/.test(val);
  }

  get hasSpecialChar(): boolean {
    const val = this.form.get('newPassword')?.value || '';
    return /[^a-zA-Z\d\s]/.test(val);
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasNumber && this.hasSpecialChar;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const { currentPassword, newPassword } = this.form.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.loading = false;
        if (this.currentUser) {
          this.currentUser.debeCambiarPassword = false;
          this.userService.user = this.currentUser;
        }
        this.snackBar.open('¡Contraseña actualizada exitosamente! Bienvenido al sistema.', 'Aceptar', {
          duration: 4000,
          panelClass: ['bg-emerald-600', 'text-white']
        });
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message || 'Error al actualizar contraseña. Verifica tu contraseña actual.';
      }
    });
  }

  signOut(): void {
    this.authService.signOut().subscribe(() => {
      this.router.navigateByUrl('/sign-in');
    });
  }
}
