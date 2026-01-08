import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Task, TaskCreateDto } from '../models/task/task.model';
import { ApiResponse } from '../../../../shared/interfaces/api-response.interface';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    private http = inject(HttpClient)
    private url = environment.api_url;

    createTask(dto: TaskCreateDto): Observable<ApiResponse<Task>> {
        return this.http.post<ApiResponse<Task>>(`${this.url}/tasks`, dto)
    }

    updateTask(taskId: string, taskDto: Partial<Task>): Observable<ApiResponse<Task>> {
        return this.http.patch<ApiResponse<Task>>(`${this.url}/tasks/${taskId}`, taskDto);
    }

}
