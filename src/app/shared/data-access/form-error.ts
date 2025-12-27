import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Injectable({
    providedIn: 'root',
})
export class FormErrorService {

    getErrorMessage(
        control: AbstractControl | null,
        messages: Record<string, string>
    ): string | null {
        if(!control || !control.touched || !control.errors) {
            return null
        }

        const errorKey = Object.keys(control.errors)[0];
        return messages[errorKey] ?? null;
    }

}
