import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconService } from '../../../../shared/data-access/icon';
import { AuthService } from '../../service/auth';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormError } from "../../../../shared/components/form-error/form-error";
import { Router, RouterLink } from "@angular/router";
import { toast } from 'ngx-sonner';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login-form',
    imports: [FontAwesomeModule, ReactiveFormsModule, FormError, RouterLink, CommonModule],
    templateUrl: './login-form.html',
    styleUrl: './login-form.css',
})
export class LoginFormComponent {

    private authService = inject(AuthService);
    private iconService = inject(IconService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    loginForm!: FormGroup;
    isOpenPassword: boolean = false;
    isLoading: boolean = false;

    ngOnInit() {
        this.loginForm = this.fb.group({
            email: [null, [Validators.required, Validators.email]],
            password: [null, [Validators.required]],
            rememberMe: [false]
        });
    }

    get email() {
        return this.loginForm.controls['email'];
    }

    get password() {
        return this.loginForm.controls['password'];
    }

    onSubmit() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        const { email, password, rememberMe } = this.loginForm.value;

        this.isLoading = true;

        this.authService.login(email, password, rememberMe).subscribe({
            next: () => {
                toast.success('¡Inicio de sesión exitoso!');
                this.router.navigate(['/kanban']);
                this.isLoading = false;
            },
            error: (err) => {
                console.log('Error en login:', err);

                let errorMessage = 'Error en el inicio de sesión';

                if (err.status === 401) {
                    errorMessage = 'Credenciales incorrectas';
                } else if (err.status === 0) {
                    errorMessage = 'No se pudo conectar con el servidor';
                } else if (err.error?.message) {
                    errorMessage = err.error.message;
                } else if (err.message) {
                    errorMessage = err.message;
                }

                toast.error(errorMessage);
                this.isLoading = false;
            }
        });
    }

    togglePasswordVisibility() {
        this.isOpenPassword = !this.isOpenPassword;
    }

    getIcon(name: string) {
        return this.iconService.getIcon(name);
    }
}
