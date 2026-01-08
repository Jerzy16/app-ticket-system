import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { catchError, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export interface LoginData {
    token: string;
}

export interface LoginData {
    token: string;
    user: User;
}

export interface LoginResponse {
    token: string;
}

export interface User {
    id: string;
    email: string;
    roles: string[];
}


@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    private http = inject(HttpClient);
    private apiUrl = environment.api_url;

    login(email: string, password: string, rememberMe: boolean): Observable<void> {
        return this.http
            .post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, {
                email,
                password,
                rememberMe
            })
            .pipe(
                tap(res => {
                    if (res.data?.token) {
                        this.setToken(res.data.token);
                    }
                }),
                // Cambiar a switchMap para encadenar la siguiente llamada
                switchMap(() => this.fetchUser()),
                // Mapear a void ya que fetchUser ya maneja el almacenamiento
                map(() => void 0),
                catchError((error: HttpErrorResponse) => {
                    console.error('Login error:', error);
                    return throwError(() => error);
                })
            );
    }

    fetchUser(): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.apiUrl}/auth/me`)
            .pipe(
                tap(res => {
                    if (res.data) {
                        this.setUser(res.data);
                        console.log("Este es el usuario" + this.setUser)
                    }
                }),
                catchError((error: HttpErrorResponse) => {
                    console.error('Error fetching user:', error);
                    // Opcional: limpiar token si es error 401
                    if (error.status === 401) {
                        this.logout();
                    }
                    return throwError(() => error);
                })
            );
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    setUser(user: User): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    getUser(): User | null {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

}
