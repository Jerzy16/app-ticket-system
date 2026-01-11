import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/interfaces/api-response.interface';

export interface UserDto {
    id: string;
    username: string;
    email: string;
    name: string;
    lastName: string;
    position: string;
    photo: string;
    roles: string[];
}

export interface UpdatePasswordDto {
    currentPassword: string;
    newPassword: string;
}


@Injectable({
    providedIn: 'root',
})
export class UserService {
    private http = inject(HttpClient);
    private url = environment.api_url;

    getUserById(id: string): Observable<UserDto> {
        return this.http.get<ApiResponse<UserDto>>(`${this.url}/users/${id}`).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    updateUser(id: string, userData: Partial<UserDto>): Observable<UserDto> {
        return this.http.put<ApiResponse<UserDto>>(`${this.url}/users/${id}`, userData).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    updatePassword(id: string, passwordData: UpdatePasswordDto): Observable<void> {
        return this.http.put<ApiResponse<void>>(`${this.url}/users/${id}/password`, passwordData).pipe(
            map(() => void 0),
            catchError(this.handleError)
        );
    }

    uploadUserPhoto(userId: string, file: File): Observable<UserDto> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiResponse<UserDto>>(
            `${this.url}/users/${userId}/photo`,
            formData
        ).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    deleteUserPhoto(userId: string): Observable<UserDto> {
        return this.http.delete<ApiResponse<UserDto>>(
            `${this.url}/users/${userId}/photo`
        ).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Ocurrió un error inesperado';

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            if (error.error?.message) {
                errorMessage = error.error.message;
            } else if (error.error?.errors) {
                const validationErrors = error.error.errors;
                errorMessage = Object.values(validationErrors).join(', ');
            } else if (error.status === 0) {
                errorMessage = 'No se pudo conectar con el servidor';
            } else {
                errorMessage = `Error ${error.status}: ${error.statusText}`;
            }
        }

        return throwError(() => ({ error: { message: errorMessage } }));
    }
}
