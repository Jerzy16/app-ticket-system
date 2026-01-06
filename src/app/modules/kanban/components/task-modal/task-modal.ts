import { Component, EventEmitter, inject, Input, Output, AfterViewInit, OnDestroy } from '@angular/core';
import { IconService } from '../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Task } from '../../models/task.model';

export interface TeamMember {
    id: string;
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
export class TaskModalComponent implements AfterViewInit, OnDestroy {
    @Input() allTeamMembers: TeamMember[] = [];
    @Input() isEditMode = false;
    @Output() save = new EventEmitter<Task>();
    @Output() cancel = new EventEmitter<void>();

    private iconService = inject(IconService);
    private map?: L.Map;
    private marker?: L.Marker;

    formData: Task = {
        id: '',
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: [],
        latitude: -12.0464,
        longitude: -77.0428,
        boardId: '',
        createdAt: new Date()
    };

    showErrors = false;
    dueDateString = '';

    ngAfterViewInit(): void {
        this.initMap();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    initMap(): void {
        // Inicializar el mapa centrado en Lima, Perú
        this.map = L.map('taskMap').setView([this.formData.latitude!, this.formData.longitude!], 13);

        // Agregar capa de tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Crear icono personalizado para el marcador
        const customIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Agregar marcador inicial
        this.marker = L.marker([this.formData.latitude!, this.formData.longitude!], {
            icon: customIcon,
            draggable: true
        }).addTo(this.map);

        // Actualizar coordenadas cuando se arrastra el marcador
        this.marker.on('dragend', () => {
            const position = this.marker!.getLatLng();
            this.formData.latitude = parseFloat(position.lat.toFixed(6));
            this.formData.longitude = parseFloat(position.lng.toFixed(6));
        });

        // Agregar marcador al hacer clic en el mapa
        this.map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            this.formData.latitude = parseFloat(lat.toFixed(6));
            this.formData.longitude = parseFloat(lng.toFixed(6));
            this.updateMarkerPosition();
        });
    }

    updateMarkerPosition(): void {
        if (this.marker && this.map && this.formData.latitude && this.formData.longitude) {
            const newLatLng = L.latLng(this.formData.latitude, this.formData.longitude);
            this.marker.setLatLng(newLatLng);
            this.map.setView(newLatLng, this.map.getZoom());
        }
    }

    onCoordinateChange(): void {
        this.updateMarkerPosition();
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }

    isAssigned(name: string): boolean  | undefined{
        return this.formData.assignedTo?.includes(name);
    }

    toggleAssignment(name: string): void {
        const index = this.formData.assignedTo?.indexOf(name);
        if (index) {
            if (index > -1) {
                this.formData.assignedTo?.splice(index, 1);
            } else {
                this.formData.assignedTo?.push(name);
            }
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
