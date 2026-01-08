import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface NotificationDto {
    id: string;
    userId: string;
    title: string;
    message: string;
    read: boolean;
    taskId: string;
    taskTitle: string;
    type: string;
    actionBy: string;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse<T> {
    message: string;
    data: T;
    statusCode: number;
    timestamp: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:8080/api/notifications';

    getUserNotifications(userId: string): Observable<NotificationDto[]> {
        return this.http.get<ApiResponse<NotificationDto[]>>(`${this.baseUrl}/user/${userId}`)
            .pipe(map(response => response.data));
    }

    getUnreadNotifications(userId: string): Observable<NotificationDto[]> {
        return this.http.get<ApiResponse<NotificationDto[]>>(`${this.baseUrl}/user/${userId}/unread`)
            .pipe(map(response => response.data));
    }

    getUnreadCount(userId: string): Observable<number> {
        return this.http.get<ApiResponse<number>>(`${this.baseUrl}/user/${userId}/unread/count`)
            .pipe(map(response => response.data));
    }


    markAsRead(notificationId: string): Observable<NotificationDto> {
        return this.http.patch<ApiResponse<NotificationDto>>(`${this.baseUrl}/${notificationId}/read`, {})
            .pipe(map(response => response.data));
    }

    markAllAsRead(userId: string): Observable<void> {
        return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/user/${userId}/read-all`, {})
            .pipe(map(response => response.data));
    }
}
