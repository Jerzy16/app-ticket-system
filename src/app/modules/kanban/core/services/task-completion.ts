import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ImageUploadService } from './image-upload';

export interface TaskCompletionRequest {
  taskId: string;
  boardId: string;
  description: string;
  notes?: string;
  imageUrls: string[];
  completedAt: Date;
}

export interface TaskCompletionResponse {
  id: string;
  taskId: string;
  boardId: string;
  completedBy: string;
  completedByName: string;
  description: string;
  notes?: string;
  imageUrls: string[];
  completedAt: Date;
  createdAt: Date;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class TaskCompletionService {
  private apiUrl = `${environment.api_url}/task-completions`;

  constructor(
    private http: HttpClient,
    private imageUploadService: ImageUploadService
  ) {}

  createCompletion(request: TaskCompletionRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}`, request);
  }

  createCompletionWithImages(
    taskId: string,
    boardId: string,
    description: string,
    images: File[],
    notes?: string
  ): Observable<TaskCompletionResponse> {
    return this.imageUploadService.uploadMultipleImages(images).pipe(
      switchMap(imageUrls => {
        const request: TaskCompletionRequest = {
          taskId,
          boardId,
          description,
          notes,
          imageUrls,
          completedAt: new Date()
        };

        return this.http.post<ApiResponse<TaskCompletionResponse>>(
          this.apiUrl,
          request
        ).pipe(
          map(response => response.data)
        );
      })
    );
  }

  getCompletionsByTask(taskId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/task/${taskId}`);
  }

  getCompletionsByBoard(boardId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/board/${boardId}`);
  }

  getCompletionsByUser(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }
}
