import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { IconService } from '../../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskCompletionService } from '../../services/task-completion';

export interface TaskCompletionData {
    taskId: string;
    description: string;
    images: File[];
    completedAt: Date;
    notes?: string;
}

@Component({
    selector: 'app-task-completion-modal',
    imports: [FontAwesomeModule, FormsModule, CommonModule],
    templateUrl: './task-completion-modal.html',
    styleUrl: './task-completion-modal.css',
})
export class TaskCompletionModal {
    @Input() taskId!: string;
    @Input() boardId?: string;
    @Input() taskTitle!: string;
    @Input() taskDescription!: string;
    @Output() complete = new EventEmitter<TaskCompletionData>();
    @Output() cancel = new EventEmitter<void>();

    completionService = inject(TaskCompletionService);

    description = '';
    notes = '';
    images: File[] = [];

    imagePreviews: Array<{ url: string; size: string }> = [];
    showValidationError = false;
    isSubmitting = false;

    constructor(private iconService: IconService) { }

    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const newFiles = Array.from(input.files);

            newFiles.forEach(file => {
                this.images.push(file);

                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imagePreviews.push({
                        url: e.target?.result as string,
                        size: this.formatFileSize(file.size)
                    });
                };
                reader.readAsDataURL(file);
            });
        }
        this.showValidationError = false;
    }

    removeImage(index: number) {
        this.images.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    onSubmit() {
        if (!this.description.trim() || this.images.length === 0) {
            this.showValidationError = true;
            return;
        }

        this.isSubmitting = true;

        this.completionService.createCompletionWithImages(
            this.taskId,
            this.boardId as string,
            this.description,
            this.images,
            this.notes || undefined
        ).subscribe({
            next: (completion) => {
                console.log('✅ Completación creada:', completion);
                this.isSubmitting = false;
                this.complete.emit({
                    taskId: this.taskId,
                    description: this.description,
                    images: this.images,
                    completedAt: new Date(),
                    notes: this.notes
                });
            },
            error: (error) => {
                console.error('❌ Error al crear completación:', error);
                this.isSubmitting = false;
                alert('Error al registrar la completación');
            }
        });
    }

    onCancel() {
        this.cancel.emit();
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }
}
