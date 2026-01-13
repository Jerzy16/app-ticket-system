import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

interface ApiResponse<T> {
  status: number;
  message: string;
  type: string;
  data: T;
  errors: any;
}

interface ImageUploadResponse {
  url: string;
}

interface MultipleImagesUploadResponse {
  urls: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private apiUrl = `${environment.api_url}/upload`;

  constructor(private http: HttpClient) {}

  /**
   * Sube una sola imagen a Cloudinary
   */
  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<ImageUploadResponse>>(`${this.apiUrl}/image`, formData)
      .pipe(
        map(response => response.data.url),
        catchError(error => {
          console.error('Error al subir imagen:', error);
          throw error;
        })
      );
  }

  /**
   * Sube múltiples imágenes de forma individual (una por una)
   * Útil para mostrar progreso individual
   */
  uploadMultipleImages(files: File[]): Observable<string[]> {
    if (!files || files.length === 0) {
      return of([]);
    }

    const uploadObservables = files.map(file => this.uploadImage(file));
    return forkJoin(uploadObservables);
  }

  /**
   * Sube múltiples imágenes en una sola petición
   * Más eficiente para muchas imágenes
   */
  uploadMultipleImagesInBatch(files: File[]): Observable<string[]> {
    if (!files || files.length === 0) {
      return of([]);
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    return this.http.post<ApiResponse<MultipleImagesUploadResponse>>(`${this.apiUrl}/images`, formData)
      .pipe(
        map(response => response.data.urls),
        catchError(error => {
          console.error('Error al subir imágenes:', error);
          throw error;
        })
      );
  }

  /**
   * Elimina una imagen de Cloudinary
   */
  deleteImage(publicId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/image`, {
      params: { publicId }
    }).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error al eliminar imagen:', error);
        throw error;
      })
    );
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   */
  extractPublicIdFromUrl(url: string): string | null {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return null;
      }

      const uploadIndex = url.indexOf('/upload/');
      if (uploadIndex === -1) {
        return null;
      }

      let afterUpload = url.substring(uploadIndex + 8);

      // Remover versión si existe (v1234567890/)
      if (afterUpload.startsWith('v')) {
        const slashIndex = afterUpload.indexOf('/');
        if (slashIndex !== -1) {
          afterUpload = afterUpload.substring(slashIndex + 1);
        }
      }

      // Remover extensión
      const lastDotIndex = afterUpload.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        afterUpload = afterUpload.substring(0, lastDotIndex);
      }

      return afterUpload;
    } catch (error) {
      console.error('Error al extraer publicId de URL:', url, error);
      return null;
    }
  }
}
