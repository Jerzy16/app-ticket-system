import { Component, OnInit } from '@angular/core';
import { toast } from 'ngx-sonner';
import { AvailableBoard, AvailableUser, ReportResponse, ReportService } from '../../core/services/report';
import { IconService } from '../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-viewer',
  imports: [FontAwesomeModule, CommonModule, FormsModule],
  templateUrl: './report-viewer.html',
  styleUrls: ['./report-viewer.css'],
})
export class ReportViewerComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  reportType: string = 'GENERAL';
  report: ReportResponse | null = null;
  isLoading = false;

  // Filtros adicionales
  selectedUserId: string | null = null;
  selectedBoardId: string | null = null;

  // 👇 Cargar listas independientes
  availableUsers: AvailableUser[] = [];
  availableBoards: AvailableBoard[] = [];

  // Para modal de imagen
  selectedImage: string | null = null;

  constructor(
    private reportService: ReportService,
    private iconService: IconService
  ) {}

  ngOnInit() {
    this.setDefaultDates();
    this.loadInitialData(); // 👈 Cargar datos iniciales
  }

  /**
   * Carga usuarios y tableros disponibles al inicio
   */
  loadInitialData() {
    this.isLoading = true;

    // Cargar dashboard para obtener usuarios y tableros
    this.reportService.getDashboard().subscribe({
      next: (response) => {
        this.report = response.data;
        this.availableUsers = response.data.availableUsers || []; // 👈 Guardar usuarios
        this.availableBoards = response.data.availableBoards || []; // 👈 Guardar tableros
        this.isLoading = false;
        console.log('Dashboard cargado:', this.report);
        console.log('Usuarios disponibles:', this.availableUsers);
        console.log('Tableros disponibles:', this.availableBoards);
      },
      error: (error) => {
        console.error('Error cargando dashboard:', error);
        toast.error('Error al cargar el dashboard');
        this.isLoading = false;
      }
    });
  }

  /**
   * Establece el rango de fechas por defecto (último mes)
   */
  setDefaultDates() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = lastMonth.toISOString().split('T')[0];
  }

  /**
   * Carga el dashboard inicial con datos de los últimos 30 días
   */
  loadDashboard() {
    this.loadInitialData(); // Reutilizar el método
  }

  /**
   * Genera un reporte según el tipo seleccionado
   */
  generateReport() {
    if (!this.startDate || !this.endDate) {
      toast.error('Debes seleccionar un rango de fechas');
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (start > end) {
      toast.error('La fecha de inicio debe ser menor a la fecha fin');
      return;
    }

    this.isLoading = true;

    let request$;

    switch (this.reportType) {
      case 'BY_USER':
        if (!this.selectedUserId) {
          toast.error('Selecciona un usuario');
          this.isLoading = false;
          return;
        }
        request$ = this.reportService.getUserReport(this.selectedUserId, start, end);
        break;

      case 'BY_BOARD':
        if (!this.selectedBoardId) {
          toast.error('Selecciona un tablero');
          this.isLoading = false;
          return;
        }
        request$ = this.reportService.getBoardReport(this.selectedBoardId, start, end);
        break;

      default:
        request$ = this.reportService.generateReport({
          startDate: start,
          endDate: end,
          reportType: this.reportType
        });
    }

    request$.subscribe({
      next: (response) => {
        this.report = response.data;

        // 👇 Actualizar listas si vienen en la respuesta
        if (response.data.availableUsers) {
          this.availableUsers = response.data.availableUsers;
        }
        if (response.data.availableBoards) {
          this.availableBoards = response.data.availableBoards;
        }

        this.isLoading = false;
        toast.success('Reporte generado exitosamente');
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
        toast.error('Error al generar el reporte');
      }
    });
  }

  // ... resto de métodos sin cambios ...

  /**
   * Establece un rango de fechas rápido (7, 30, 90 días)
   */
  setQuickDateRange(days: number) {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - days);

    this.startDate = this.formatDate(pastDate);
    this.endDate = this.formatDate(today);

    this.generateReport();
  }

  downloadPdf() {
    if (!this.report) return;

    toast.promise(
      this.reportService.downloadReportPdf(this.report.reportId).toPromise(),
      {
        loading: 'Generando PDF...',
        success: (blob) => {
          const url = window.URL.createObjectURL(blob!);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte-${this.formatDate(new Date())}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          return 'PDF descargado exitosamente';
        },
        error: 'Error al descargar el PDF'
      }
    );
  }

  downloadExcel() {
    if (!this.report) return;

    toast.promise(
      this.reportService.downloadReportExcel(this.report.reportId).toPromise(),
      {
        loading: 'Generando Excel...',
        success: (blob) => {
          const url = window.URL.createObjectURL(blob!);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte-${this.formatDate(new Date())}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          return 'Excel descargado exitosamente';
        },
        error: 'Error al descargar el Excel'
      }
    );
  }

  exportData(format: 'json' | 'csv') {
    if (!this.report) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(this.report, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${this.formatDate(new Date())}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('JSON descargado exitosamente');
    } else if (format === 'csv') {
      const csv = this.convertToCSV(this.report.tasks);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${this.formatDate(new Date())}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV descargado exitosamente');
    }
  }

  private convertToCSV(tasks: any[]): string {
    if (!tasks || tasks.length === 0) return '';

    const headers = [
      'ID',
      'Título',
      'Tablero',
      'Estado',
      'Prioridad',
      'Completado por',
      'Fecha completado',
      'Evidencias'
    ];

    const rows = tasks.map(t => [
      this.escapeCsvValue(t.taskId),
      this.escapeCsvValue(t.taskTitle),
      this.escapeCsvValue(t.boardName),
      this.escapeCsvValue(t.status),
      this.escapeCsvValue(t.priority),
      this.escapeCsvValue(t.completedByName || ''),
      t.completedAt ? new Date(t.completedAt).toLocaleString() : '',
      t.evidenceUrls ? t.evidenceUrls.length : 0
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private escapeCsvValue(value: any): string {
    if (value == null) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  viewImage(url: string) {
    this.selectedImage = url;
  }

  closeImageModal() {
    this.selectedImage = null;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getIcon(icon: string) {
    return this.iconService.getIcon(icon);
  }

  get completionPercentage(): number {
    if (!this.report || !this.report.summary.totalTasks) return 0;
    return (this.report.summary.completedTasks / this.report.summary.totalTasks) * 100;
  }

  get averageEvidencesPerTask(): number {
    if (!this.report || !this.report.summary.completedTasks) return 0;
    return this.report.summary.totalEvidences / this.report.summary.completedTasks;
  }

  filterTasksByPriority(priority: string) {
    if (!this.report) return [];
    return this.report.tasks.filter(t => t.priority === priority);
  }
}
