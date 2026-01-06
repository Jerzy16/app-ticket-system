import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export interface LoginData {
    token: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';
    private http = inject(HttpClient);
    private apiUrl = environment.api_url;

    login(email: string, password: string, rememberMe: boolean): Observable<ApiResponse<LoginData>> {
        return this.http
            .post<ApiResponse<LoginData>>(`${this.apiUrl}/auth/login`, {
                email,
                password,
                rememberMe
            })
            .pipe(
                tap(response => {
                    if (response?.data?.token) {
                        this.setToken(response.data.token);
                    }
                }),
                catchError(this.handleError)
            );
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    removeToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    logout(): void {
        this.removeToken();
    }

    getUser(): any {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }


    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private handleError(error: HttpErrorResponse) {
        let message = 'Ocurrió un error inesperado';

        if (error.error?.message) {
            message = error.error.message;
        }

        return throwError(() => new Error(message));
    }

}
