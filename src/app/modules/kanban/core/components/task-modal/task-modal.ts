import { Component, EventEmitter, inject, Input, Output, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { IconService } from '../../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { TaskCreateDto } from '../../models/task/task.model';

export interface TeamMember {
    id: string;
    name: string;
    post: string;
    photo: string;
}



@Component({
    selector: 'app-task-modal',
    standalone: true,
    imports: [FontAwesomeModule, ReactiveFormsModule, CommonModule],
    templateUrl: './task-modal.html',
    styleUrl: './task-modal.css',
})
export class TaskModalComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() allTeamMembers: TeamMember[] = [];
    @Input() boardId: string = '';
    @Input() isEditMode = false;
    @Output() save = new EventEmitter<TaskCreateDto>();
    @Output() cancel = new EventEmitter<void>();

    private iconService = inject(IconService);
    private fb = inject(FormBuilder);
    private map?: L.Map;
    private marker?: L.Marker;

    taskForm!: FormGroup;
    selectedMembers: string[] = [];
    private selectedMemberIds: string[] = [];

    ngOnInit(): void {
        this.initForm();
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    initForm(): void {
        this.taskForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            priority: ['medium', Validators.required],
            dueDate: [''],
            boardId: this.boardId,
            latitude: [-13.6360589],
            longitude: [-72.8816814]
        });
    }

    initMap(): void {
        const lat = this.taskForm.get('latitude')?.value;
        const lng = this.taskForm.get('longitude')?.value;

        this.map = L.map('taskMap').setView([lat, lng], 30);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 14,
        }).addTo(this.map);

        const customIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        this.marker = L.marker([lat, lng], {
            icon: customIcon,
            draggable: true
        }).addTo(this.map);

        this.marker.on('dragend', () => {
            const position = this.marker!.getLatLng();
            this.taskForm.patchValue({
                latitude: parseFloat(position.lat.toFixed(6)),
                longitude: parseFloat(position.lng.toFixed(6))
            });
        });

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            this.taskForm.patchValue({
                latitude: parseFloat(lat.toFixed(6)),
                longitude: parseFloat(lng.toFixed(6))
            });
            this.updateMarkerPosition();
        });
    }

    updateMarkerPosition(): void {
        const lat = this.taskForm.get('latitude')?.value;
        const lng = this.taskForm.get('longitude')?.value;

        if (this.marker && this.map && lat && lng) {
            const newLatLng = L.latLng(lat, lng);
            this.marker.setLatLng(newLatLng);
            this.map.setView(newLatLng, this.map.getZoom());
        }
    }

    onCoordinateChange(): void {
        this.updateMarkerPosition();
    }

    setPriority(priority: string): void {
        this.taskForm.patchValue({ priority });
    }

    isAssigned(name: string): boolean {
        return this.selectedMembers.includes(name);
    }

    toggleAssignment(name: string): void {
        const member = this.allTeamMembers.find(m => m.name === name);
        if (!member) return;

        const nameIndex = this.selectedMembers.indexOf(name);
        const idIndex = this.selectedMemberIds.indexOf(member.id);

        if (nameIndex > -1) {
            this.selectedMembers.splice(nameIndex, 1);
            if (idIndex > -1) {
                this.selectedMemberIds.splice(idIndex, 1);
            }
        } else {
            this.selectedMembers.push(name);
            this.selectedMemberIds.push(member.id);
        }
    }

    onBackdropClick(event: MouseEvent): void {
        this.onCancel();
    }

    onCancel(): void {
        this.cancel.emit();
    }

    onSubmit(): void {
        if (this.taskForm.invalid) {
            Object.keys(this.taskForm.controls).forEach(key => {
                this.taskForm.get(key)?.markAsTouched();
            });
            return;
        }

        const formValue = this.taskForm.value;

        let formattedDate: string | null = null;
        if (formValue.dueDate) {
            formattedDate = `${formValue.dueDate}T00:00:00`;
        }

        const taskDto: TaskCreateDto = {
            title: formValue.title.trim(),
            description: formValue.description?.trim() || '',
            priority: formValue.priority,
            boardId: this.boardId,
            assignedTo: this.selectedMemberIds,
            dueDate: formattedDate,
            latitude: formValue.latitude || null,
            longitude: formValue.longitude || null
        };

        this.save.emit(taskDto);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.taskForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getErrorMessage(fieldName: string): string {
        const field = this.taskForm.get(fieldName);
        if (field?.hasError('required')) {
            return 'Este campo es obligatorio';
        }
        if (field?.hasError('minlength')) {
            return 'Mínimo 3 caracteres';
        }
        return '';
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }
}
