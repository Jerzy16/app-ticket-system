import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, catchError, map, Observable, switchMap, tap, throwError, of } from 'rxjs';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export interface LoginResponse {
    token: string;
}

export interface User {
    id: string;
    username?: string;
    lastName?: string;
    name?: string;
    email: string;
    photo?: string;
    position?: string;
    roles: string[];
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = environment.api_url;

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

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
                switchMap(() => this.fetchUser()),
                tap(() => this.isAuthenticatedSubject.next(true)),
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
                        console.log("Usuario cargado:", res.data);
                    }
                }),
                catchError((error: HttpErrorResponse) => {
                    console.error('Error fetching user:', error);
                    if (error.status === 401 || error.status === 403) {
                        this.handleSessionExpired();
                    }
                    return throwError(() => error);
                })
            );
    }

    validateToken(): Observable<boolean> {
        if (!this.getToken()) {
            return of(false);
        }

        return this.http.get<ApiResponse<User>>(`${this.apiUrl}/auth/me`)
            .pipe(
                map(res => {
                    if (res.data) {
                        this.setUser(res.data);
                        this.isAuthenticatedSubject.next(true);
                        return true;
                    }
                    return false;
                }),
                catchError(() => {
                    this.handleSessionExpired();
                    return of(false);
                })
            );
    }

    handleSessionExpired(): void {
        this.logout();
        this.router.navigate(['/'], {
            queryParams: { sessionExpired: 'true' }
        });
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
        this.isAuthenticatedSubject.next(false);
    }

    isAuthenticated(): boolean {
        return this.hasValidToken();
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private hasValidToken(): boolean {
        const token = this.getToken();
        return !!token;
    }
}
