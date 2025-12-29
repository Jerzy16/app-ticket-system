import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, QueryList, signal, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { ResetPasswordService } from '../service/reset-password';
import { toast } from 'ngx-sonner';
import { IconService } from '../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormError } from "../../../shared/components/form-error/form-error";

@Component({
    selector: 'app-password-recovery',
    imports: [ReactiveFormsModule, CommonModule, RouterLink, FontAwesomeModule, FormError],
    templateUrl: './password-recovery.html',
    styleUrl: './password-recovery.css',
})
export class PasswordRecoveryComponent {
    @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

    private resetPasswordService = inject(ResetPasswordService);
    private fb = inject(FormBuilder);
    private iconService = inject(IconService);
    private router = inject(Router);

    step = signal(1);
    code = signal(['', '', '', '', '', '']);

    emailForm: FormGroup;
    codeForm: FormGroup;
    passwordForm: FormGroup;

    isSendCode: boolean = false;

    steps = [
        { id: 1, label: 'Email' },
        { id: 2, label: 'Código' },
        { id: 3, label: 'Contraseña' }
    ];

    constructor() {
        this.emailForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });

        this.codeForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(6)]]
        });

        this.passwordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;

        if (password && confirmPassword && password !== confirmPassword) {
            return { passwordMismatch: true };
        }
        return null;
    }

    get email() {
        return this.emailForm.controls['email'];
    }

    get password() {
        return this.passwordForm.controls['password'];
    }

    get passwordMismatch(): boolean {
        return this.passwordForm.hasError('passwordMismatch') &&
            this.passwordForm.get('confirmPassword')?.touched || false;
    }

    handleEmailSubmit(): void {
        if (this.emailForm.invalid) {
            this.emailForm.markAllAsTouched();
            return;
        }

        this.isSendCode = true;

        this.resetPasswordService.sendCode(this.emailForm.value.email).subscribe({
            next: (response) => {
                toast.success(response.message);
                this.step.set(2);
            },
            error: (err) => {
                toast.error(err.error.message);
            },
            complete: () => {
                this.isSendCode = false;
            }
        });
    }

    onCodeInput(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.replace(/\D/g, '').slice(-1);
        input.value = value;

        const newCode = [...this.code()];
        newCode[index] = value;
        this.code.set(newCode);

        this.codeForm.patchValue({ code: newCode.join('') });

        if (value && index < this.code().length - 1) {
            this.codeInputs.toArray()[index + 1]?.nativeElement.focus();
        }
    }

    onCodeKeyDown(index: number, event: KeyboardEvent): void {
        const input = event.target as HTMLInputElement;
        const inputs = this.codeInputs.toArray();

        if (event.key === 'Backspace' && !input.value && index > 0) {
            event.preventDefault();
            inputs[index - 1]?.nativeElement.focus();
        }
        else if (event.key === 'ArrowRight' && index < 5) {
            event.preventDefault();
            inputs[index + 1]?.nativeElement.focus();
        }
        else if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            inputs[index - 1]?.nativeElement.focus();
        }
    }

    onCodePaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text') || '';
        const digits = pastedData.replace(/[^0-9]/g, '').split('').slice(0, 6);

        if (digits.length > 0) {
            const newCode = ['', '', '', '', '', ''];
            digits.forEach((digit, index) => {
                newCode[index] = digit;
            });
            this.code.set(newCode);
            this.codeForm.patchValue({ code: newCode.join('') });

            const nextEmptyIndex = newCode.findIndex(d => d === '');
            const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
            setTimeout(() => {
                this.codeInputs.toArray()[focusIndex]?.nativeElement.focus();
            }, 0);
        }
    }

    handleCodeSubmit(): void {
        if (this.code().every((digit: string) => digit !== '')) {
            this.resetPasswordService.verifyCode(this.emailForm.value.email, this.codeForm.value.code).subscribe({
                next: (response) => {
                    toast.success(response.message);
                    this.step.set(3);
                },
                error: (err) => {
                    toast.error(err.error.message);
                }
            });
        }
    }

    resendCode(): void {
        this.code.set(['', '', '', '', '', '']);
        this.codeForm.reset();
        setTimeout(() => {
            this.codeInputs.toArray()[0]?.nativeElement.focus();
        }, 0);
        this.isSendCode = true;

        this.resetPasswordService.sendCode(this.emailForm.value.email).subscribe({
            next: (response) => {
                toast.success(response.message);
                this.step.set(2);
            },
            error: (err) => {
                toast.error(err.error.message);
            },
            complete: () => {
                this.isSendCode = false;
            }
        });
    }

    handlePasswordSubmit(): void {
        if (this.passwordForm.valid) {
            this.resetPasswordService.resetPassword(
                this.emailForm.value.email,
                this.code().join(''),
                this.passwordForm.value.password
            ).subscribe({
                next: (response) => {
                    toast.success(response.message);
                    this.router.navigate(['/']);
                },
                error: (err) => {
                    toast.error(err.error?.message || 'Error al cambiar la contraseña');
                }
            });
        } else {
            this.passwordForm.markAllAsTouched();
        }
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }
}
