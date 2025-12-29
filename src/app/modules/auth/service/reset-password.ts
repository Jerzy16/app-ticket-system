import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

@Injectable({
    providedIn: 'root',
})
export class ResetPasswordService {

    private htpp = inject(HttpClient);
    private apiUrl = environment.api_url;

    sendCode(email: string): Observable<ApiResponse<void>> {
        return this.htpp.post<ApiResponse<void>>(`${this.apiUrl}/auth/forgot-password?email=${email}`, null)
    }

    verifyCode(email: string, code: string): Observable<ApiResponse<void>> {
        return this.htpp.post<ApiResponse<void>>(`${this.apiUrl}/auth/verify-code?email=${email}&code=${code}`, null)
    }

    resetPassword(email: string, code: string, newPassword: string): Observable<ApiResponse<void>> {
        return this.htpp.post<ApiResponse<void>>(`${this.apiUrl}/auth/reset-password?email=${email}&code=${code}&newPassword=${newPassword}`, null);
    }
}
