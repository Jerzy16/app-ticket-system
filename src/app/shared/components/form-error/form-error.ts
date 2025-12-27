import { Component, inject, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormErrorService } from '../../data-access/form-error';

@Component({
    selector: 'app-form-error',
    imports: [],
    templateUrl: './form-error.html',
    styleUrl: './form-error.css',
})
export class FormError {

    @Input() control!: AbstractControl | null;
    @Input() messages!: Record<string, string>;

    errorService = inject(FormErrorService);
}
