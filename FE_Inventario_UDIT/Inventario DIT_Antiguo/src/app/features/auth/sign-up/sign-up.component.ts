import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector     : 'auth-sign-up',
    templateUrl  : './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [RouterLink, NgIf, NgClass, FuseAlertComponent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule],
})
export class AuthSignUpComponent implements OnInit

{
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: '',
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /** Patrón de contraseña: mín 6 chars, 1 mayúscula, 1 número, 1 símbolo */
    readonly passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Create the form
        this.signUpForm = this._formBuilder.group({
            nombreCompleto: ['', [Validators.required]],
            username      : ['', [Validators.required, Validators.minLength(3)]],
            email         : ['', [Validators.required, Validators.email]],
            password      : ['', [Validators.required, Validators.minLength(6), Validators.pattern(this.passwordPattern)]],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    hasUpper(): boolean {
        const val = this.signUpForm.get('password')?.value || '';
        return /[A-Z]/.test(val);
    }

    hasNumber(): boolean {
        const val = this.signUpForm.get('password')?.value || '';
        return /\d/.test(val);
    }

    hasSymbol(): boolean {
        const val = this.signUpForm.get('password')?.value || '';
        return /[^a-zA-Z0-9]/.test(val);
    }

    hasMinLength(): boolean {
        const val = this.signUpForm.get('password')?.value || '';
        return val.length >= 6;
    }

    /**
     * Sign up
     */
    signUp(): void
    {
        // Do nothing if the form is invalid
        if ( this.signUpForm.invalid )
        {
            return;
        }

        // Disable the form
        this.signUpForm.disable();


        // Hide the alert
        this.showAlert = false;

        const val = this.signUpForm.value;
        const payload = {
            nombreCompleto: val.nombreCompleto,
            username: val.username,
            email: val.email,
            password: val.password,
            role: 'User'
        };

        // Sign up
        this._authService.signUp(payload)
            .subscribe({
                next: () => {
                    this._router.navigate(['/sign-in'], {
                        queryParams: { registered: 'true' }
                    });
                },
                error: (err) => {
                    // Re-enable the form
                    this.signUpForm.enable();

                    let errorMsg = 'Ocurrió un error al registrar la cuenta.';
                    if (err?.status === 0 || err?.name === 'TimeoutError') {
                        errorMsg = 'No se pudo conectar con el servidor. Por favor verifica que el backend esté ejecutándose e inténtalo nuevamente.';
                    } else if (err?.error?.message) {
                        errorMsg = err.error.message;
                    } else if (err?.message) {
                        errorMsg = err.message;
                    }

                    // Set the alert
                    this.alert = {
                        type   : 'error',
                        message: errorMsg,
                    };

                    // Show the alert
                    this.showAlert = true;
                }
            });
    }
}


