import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ReportRequest {
  startDate: Date;
  endDate: Date;
  reportType: string;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  tasksCompleted: number;
  evidencesProvided: number;
  averageCompletionTime: number;
}

export interface BoardStatistics {
  boardId: string;
  boardName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface AvailableUser {
  userId: string;
  userName: string;
  email: string;
  position: string;
  photo: string;
}

export interface AvailableBoard {
  boardId: string;
  boardName: string;
  taskCount: number;
  createdAt: Date;
}

export interface ReportSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalEvidences: number;
  userPerformance: UserPerformance[];
  boardStatistics: BoardStatistics[];
}

export interface ReportTaskDetail {
  taskId: string;
  taskTitle: string;
  boardName: string;
  priority: string;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string;
  completedByName?: string;
  completionDescription?: string;
  completionNotes?: string;
  evidenceUrls: string[];
  assignedUsers: string[];
}

export interface ReportResponse {
  reportId: string;
  reportType: string;
  generatedAt: Date;
  startDate: Date;
  endDate: Date;
  summary: ReportSummary;
  tasks: ReportTaskDetail[];
  availableUsers: AvailableUser[];
  availableBoards: AvailableBoard[];
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.api_url}/reports`;

  constructor(private http: HttpClient) {}

  generateReport(request: ReportRequest): Observable<ApiResponse<ReportResponse>> {
    const params = new HttpParams()
      .set('startDate', request.startDate.toISOString())
      .set('endDate', request.endDate.toISOString())
      .set('reportType', request.reportType);

    return this.http.get<ApiResponse<ReportResponse>>(`${this.apiUrl}/generate`, { params });
  }

  getUserReport(userId: string, startDate: Date, endDate: Date): Observable<ApiResponse<ReportResponse>> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<ApiResponse<ReportResponse>>(`${this.apiUrl}/user/${userId}`, { params });
  }

  getBoardReport(boardId: string, startDate: Date, endDate: Date): Observable<ApiResponse<ReportResponse>> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<ApiResponse<ReportResponse>>(`${this.apiUrl}/board/${boardId}`, { params });
  }

  getDashboard(): Observable<ApiResponse<ReportResponse>> {
    return this.http.get<ApiResponse<ReportResponse>>(`${this.apiUrl}/dashboard`);
  }

  downloadReportPdf(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/pdf`, {
      responseType: 'blob'
    });
  }

  downloadReportExcel(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/excel`, {
      responseType: 'blob'
    });
  }
}
