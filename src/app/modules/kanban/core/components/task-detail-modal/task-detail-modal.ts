import { Component, EventEmitter, inject, Input, Output, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Task } from '../../models/task/task.model';
import { TeamMember } from '../task-modal/task-modal';
import { IconService } from '../../../../../shared/data-access/icon';
import * as L from 'leaflet';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-task-detail-modal',
    standalone: true,
    imports: [FontAwesomeModule, ReactiveFormsModule, CommonModule],
    templateUrl: './task-detail-modal.html',
    styleUrl: './task-detail-modal.css',
})
export class TaskDetailModalComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() task!: Task;
    @Input() allTeamMembers: TeamMember[] = [];
    @Output() save = new EventEmitter<Task>();
    @Output() cancel = new EventEmitter<void>();

    private iconService = inject(IconService);
    private fb = inject(FormBuilder);
    private map: L.Map | null = null;
    private marker: L.Marker | null = null;

    isEditing = false;
    taskForm!: FormGroup;
    selectedMembers: string[] = [];
    private selectedMemberIds: string[] = [];

    // Getter para obtener los detalles completos de los miembros seleccionados
    get selectedMembersWithDetails(): TeamMember[] {
        return this.selectedMembers
            .map(name => this.allTeamMembers.find(m => m.name === name))
            .filter((member): member is TeamMember => member !== undefined);
    }

    ngOnInit() {
        this.initForm();
        this.initSelectedMembers();
    }

    ngAfterViewInit() {
        setTimeout(() => this.initMap(), 100);
    }

    ngOnDestroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    initForm() {
        // Convertir la fecha al formato correcto para el input type="date"
        let formattedDate = '';
        if (this.task.dueDate) {
            const date = new Date(this.task.dueDate);
            formattedDate = date.toISOString().split('T')[0];
        }

        this.taskForm = this.fb.group({
            title: [this.task.title, [Validators.required, Validators.minLength(3)]],
            description: [this.task.description || ''],
            priority: [this.task.priority || 'medium', Validators.required],
            dueDate: [formattedDate],
            latitude: [this.task.latitude || -12.0464],
            longitude: [this.task.longitude || -77.0428]
        });

        // Deshabilitar el formulario inicialmente
        this.taskForm.disable();
    }

    initSelectedMembers() {
        if (this.task.assignedTo && this.task.assignedTo.length > 0) {
            // Detectar si assignedTo contiene IDs (UUID) o nombres
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            // Si el primer elemento es un UUID, son IDs
            if (uuidRegex.test(this.task.assignedTo[0])) {
                // Convertir IDs a nombres
                this.selectedMembers = this.task.assignedTo
                    .map(userId => {
                        const member = this.allTeamMembers.find(m => m.id === userId);
                        return member ? member.name : null;
                    })
                    .filter((name): name is string => name !== null);

                this.selectedMemberIds = [...this.task.assignedTo];
            } else {
                // Ya son nombres, usarlos directamente
                this.selectedMembers = [...this.task.assignedTo];

                // Encontrar los IDs correspondientes
                this.selectedMemberIds = this.task.assignedTo
                    .map(name => {
                        const member = this.allTeamMembers.find(m => m.name === name);
                        return member ? member.id : null;
                    })
                    .filter((id): id is string => id !== null);
            }
        }
    }

    private initMap() {
        const lat = this.taskForm.get('latitude')?.value || -12.0464;
        const lng = this.taskForm.get('longitude')?.value || -77.0428;

        const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
        const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
        const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';
        const iconDefault = L.icon({
            iconRetinaUrl,
            iconUrl,
            shadowUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            tooltipAnchor: [16, -28],
            shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = iconDefault;

        this.map = L.map('taskDetailMap').setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.marker = L.marker([lat, lng], {
            draggable: false
        }).addTo(this.map);

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            if (this.isEditing) {
                this.updateMarkerPosition(e.latlng.lat, e.latlng.lng);
            }
        });

        // Evento de arrastre del marcador
        this.marker.on('dragend', () => {
            if (this.marker && this.isEditing) {
                const position = this.marker.getLatLng();
                this.updateMarkerPosition(position.lat, position.lng);
            }
        });
    }

    private updateMarkerPosition(lat: number, lng: number) {
        this.taskForm.patchValue({
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lng.toFixed(6))
        }, { emitEvent: false });

        if (this.marker && this.map) {
            this.marker.setLatLng([lat, lng]);
            this.map.setView([lat, lng], this.map.getZoom());
        }
    }

    onCoordinateChange() {
        const lat = this.taskForm.get('latitude')?.value;
        const lng = this.taskForm.get('longitude')?.value;

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            this.updateMarkerPosition(lat, lng);
        }
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;

        if (this.isEditing) {
            this.taskForm.enable();
            if (this.marker) {
                this.marker.dragging?.enable();
            }
        } else {
            // Restaurar valores originales
            this.taskForm.patchValue({
                title: this.task.title,
                description: this.task.description,
                priority: this.task.priority,
                dueDate: this.task.dueDate ? new Date(this.task.dueDate).toISOString().split('T')[0] : '',
                latitude: this.task.latitude,
                longitude: this.task.longitude
            });
            this.taskForm.disable();
            this.initSelectedMembers();

            if (this.task.latitude && this.task.longitude) {
                this.updateMarkerPosition(this.task.latitude, this.task.longitude);
            }
            if (this.marker) {
                this.marker.dragging?.disable();
            }
        }
    }

    setPriority(priority: string) {
        this.taskForm.patchValue({ priority });
    }

    isAssigned(name: string): boolean {
        return this.selectedMembers.includes(name);
    }

    toggleAssignment(name: string) {
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

    handleSave() {
        if (this.taskForm.invalid) {
            Object.keys(this.taskForm.controls).forEach(key => {
                this.taskForm.get(key)?.markAsTouched();
            });
            return;
        }

        const formValue = this.taskForm.value;

        let formattedDate: Date | undefined;

        if (formValue.dueDate) {
            formattedDate = new Date(`${formValue.dueDate}T00:00:00`);
        }

        // IMPORTANTE: Convertir nombres a IDs antes de guardar
        const assignedToIds = this.selectedMembers
            .map(name => {
                const member = this.allTeamMembers.find(m => m.name === name);
                return member ? member.id : null;
            })
            .filter((id): id is string => id !== null);

        const updatedTask: Task = {
            ...this.task,
            title: formValue.title.trim(),
            description: formValue.description?.trim() || '',
            priority: formValue.priority,
            assignedTo: assignedToIds,  // Enviar IDs, no nombres
            dueDate: formattedDate,
            latitude: formValue.latitude || null,
            longitude: formValue.longitude || null
        };

        this.save.emit(updatedTask);
        this.isEditing = false;
        this.taskForm.disable();
        if (this.marker) {
            this.marker.dragging?.disable();
        }
    }

    handleCancel() {
        if (this.isEditing) {
            this.toggleEdit();
        } else {
            this.cancel.emit();
        }
    }

    onBackdropClick(event: MouseEvent) {
        this.handleCancel();
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
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
