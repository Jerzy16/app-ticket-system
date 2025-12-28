import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, signal, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-password-recovery',
    imports: [FormsModule, CommonModule, RouterLink],
    templateUrl: './password-recovery.html',
    styleUrl: './password-recovery.css',
})
export class PasswordRecoveryComponent {
    @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

    step = signal(1);
    email = signal('');
    code = signal(['', '', '', '', '', '']);
    password = signal('');
    confirmPassword = signal('');

    steps = [
        { id: 1, label: 'Email' },
        { id: 2, label: 'Código' },
        { id: 3, label: 'Contraseña' }
    ];

    handleEmailSubmit(): void {
        if (this.email()) {
            this.step.set(2);
            console.log('Email enviado:', this.email());
        }
    }

    onCodeInput(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;

        // Solo números
        const value = input.value.replace(/\D/g, '').slice(-1);

        // Forzar el valor visual
        input.value = value;

        // Actualizar signal
        const newCode = [...this.code()];
        newCode[index] = value;
        this.code.set(newCode);

        // Auto focus
        if (value && index < this.code().length - 1) {
            this.codeInputs.toArray()[index + 1]?.nativeElement.focus();
        }
    }

    onCodeKeyDown(index: number, event: KeyboardEvent): void {
        const input = event.target as HTMLInputElement;
        const inputs = this.codeInputs.toArray();

        // Retroceder con Backspace si el campo está vacío
        if (event.key === 'Backspace' && !input.value && index > 0) {
            event.preventDefault();
            inputs[index - 1]?.nativeElement.focus();
        }
        // Avanzar con flechas
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

            // Enfocar el siguiente campo vacío o el último
            const nextEmptyIndex = newCode.findIndex(d => d === '');
            const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
            setTimeout(() => {
                this.codeInputs.toArray()[focusIndex]?.nativeElement.focus();
            }, 0);
        }
    }

    handleCodeSubmit(): void {
        if (this.code().every((digit: string) => digit !== '')) {
            this.step.set(3);
            console.log('Código verificado:', this.code().join(''));
        }
    }

    resendCode(): void {
        console.log('Reenviando código a:', this.email());
        this.code.set(['', '', '', '', '', '']);
        setTimeout(() => {
            this.codeInputs.toArray()[0]?.nativeElement.focus();
        }, 0);
        alert('Código reenviado exitosamente');
    }

    handlePasswordSubmit(): void {
        if (this.password() && this.password() === this.confirmPassword()) {
            console.log('Contraseña actualizada exitosamente');
            alert('¡Contraseña actualizada exitosamente!');
        }
    }
}
