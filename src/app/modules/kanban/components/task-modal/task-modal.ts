import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { IconService } from '../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms'

export interface TaskFormData {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    assignedTo: string[];
    dueDate?: Date;
}

export interface TeamMember {
    name: string;
    post: string;
    photo: string;
}

@Component({
    selector: 'app-task-modal',
    imports: [FontAwesomeModule, FormsModule],
    templateUrl: './task-modal.html',
    styleUrl: './task-modal.css',
})
export class TaskModalComponent {
    @Input() allTeamMembers: TeamMember[] = [];
    @Input() isEditMode = false;
    @Output() save = new EventEmitter<TaskFormData>();
    @Output() cancel = new EventEmitter<void>();

    private iconService = inject(IconService);

    formData: TaskFormData = {
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: []
    };

    showErrors = false;
    dueDateString = '';

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }

    isAssigned(name: string): boolean {
        return this.formData.assignedTo.includes(name);
    }

    toggleAssignment(name: string): void {
        const index = this.formData.assignedTo.indexOf(name);
        if (index > -1) {
            this.formData.assignedTo.splice(index, 1);
        } else {
            this.formData.assignedTo.push(name);
        }
    }

    onBackdropClick(event: MouseEvent): void {
        this.onCancel();
    }

    onCancel(): void {
        this.cancel.emit();
    }

    onSubmit(): void {
        if (!this.formData.title.trim()) {
            this.showErrors = true;
            return;
        }

        if (this.dueDateString) {
            this.formData.dueDate = new Date(this.dueDateString);
        }

        this.save.emit(this.formData);
    }
}
