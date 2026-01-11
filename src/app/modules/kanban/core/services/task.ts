import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Task, TaskCreateDto } from '../models/task/task.model';
import { ApiResponse } from '../../../../shared/interfaces/api-response.interface';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    private http = inject(HttpClient);
    private url = environment.api_url;

    createTask(dto: TaskCreateDto): Observable<ApiResponse<Task>> {
        return this.http.post<ApiResponse<Task>>(`${this.url}/tasks`, dto);
    }

    updateTask(taskId: string, taskDto: Partial<Task>): Observable<ApiResponse<Task>> {
        return this.http.patch<ApiResponse<Task>>(`${this.url}/tasks/${taskId}`, taskDto);
    }

    moveTask(
        taskId: string,
        fromBoardId: string,
        toBoardId: string,
        position: number = 0
    ): Observable<ApiResponse<Task>> {
        const params = new HttpParams()
            .set('fromBoardId', fromBoardId)
            .set('toBoardId', toBoardId)
            .set('newIndex', position.toString());

        return this.http.patch<ApiResponse<Task>>(
            `${this.url}/tasks/${taskId}/move`,
            null,
            { params }
        );
    }

    getTaskById(taskId: string): Observable<ApiResponse<Task>> {
        return this.http.get<ApiResponse<Task>>(`${this.url}/tasks/${taskId}`);
    }

    deleteTask(taskId: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.url}/tasks/${taskId}`);
    }

    getTasksByBoard(boardId: string): Observable<ApiResponse<Task[]>> {
        return this.http.get<ApiResponse<Task[]>>(`${this.url}/tasks/board/${boardId}`);
    }

    getTasksByUser(userId: string): Observable<ApiResponse<Task[]>> {
        return this.http.get<ApiResponse<Task[]>>(`${this.url}/tasks/user/${userId}`);
    }
}
