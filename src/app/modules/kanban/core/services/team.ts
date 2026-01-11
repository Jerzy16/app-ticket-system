import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/interfaces/api-response.interface';

export interface TeamMember {
    id: string;
    name: string;
    post: string;
    photo: string;
    username: string;
    lastName: string;
    email: string;
    roles: string[];
}

export interface TeamGroup {
    role: string;
    members: TeamMember[];
}

export interface UserDto {
    id?: string;
    username: string;
    email: string;
    password?: string;
    name: string;
    lastName: string;
    position: string;
    photo: string | null;
    roles: string[];
}

@Injectable({
    providedIn: 'root',
})
export class TeamService {
    private http = inject(HttpClient);
    private url = environment.api_url;

    getTeam(): Observable<TeamGroup[]> {
        return this.http.get<ApiResponse<TeamGroup[]>>(`${this.url}/users/team`).pipe(
            map(response => {
                if (response && response.data && Array.isArray(response.data)) {
                    return response.data;
                }
                return [];
            }),
            catchError(this.handleError)
        );
    }

    createUser(userData: any): Observable<UserDto> {
        return this.http.post<ApiResponse<UserDto>>(`${this.url}/users`, userData).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    updateUser(id: string, userData: any): Observable<UserDto> {
        return this.http.put<ApiResponse<UserDto>>(`${this.url}/users/${id}`, userData).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    deleteUser(id: string): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.url}/users/${id}`).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    /**
     * Sube una foto de perfil para un usuario
     */
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

    /**
     * Elimina la foto de perfil de un usuario
     */
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
