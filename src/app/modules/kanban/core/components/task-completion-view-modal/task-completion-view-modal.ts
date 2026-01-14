import { Component, EventEmitter, inject, Input, Output, AfterViewInit, OnDestroy } from '@angular/core';
import { Task } from '../../models/task/task.model';
import { TeamMember } from '../task-modal/task-modal';
import { IconService } from '../../../../../shared/data-access/icon';
import * as L from 'leaflet';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-task-completion-view-modal',
    imports: [FontAwesomeModule, CommonModule],
    templateUrl: './task-completion-view-modal.html',
    styleUrl: './task-completion-view-modal.css',
})
export class TaskCompletionViewModal implements AfterViewInit, OnDestroy {
    @Input() task!: Task;
    @Input() allTeamMembers: TeamMember[] = [];
    @Output() close = new EventEmitter<void>();

    private iconService = inject(IconService);
    private map: L.Map | null = null;
    private marker: L.Marker | null = null;

    ngAfterViewInit() {
        if (this.task.latitude && this.task.longitude) {
            setTimeout(() => this.initMap(), 300);
        }
    }

    ngOnDestroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    private initMap() {
        if (!this.task.latitude || !this.task.longitude) return;

        const mapElement = document.getElementById('taskCompletionViewMap');
        if (!mapElement) {
            console.error('Map container not found');
            return;
        }

        const lat = typeof this.task.latitude === 'string'
            ? parseFloat(this.task.latitude)
            : this.task.latitude;
        const lng = typeof this.task.longitude === 'string'
            ? parseFloat(this.task.longitude)
            : this.task.longitude;

        if (isNaN(lat) || isNaN(lng)) {
            console.error('Invalid coordinates:', { lat: this.task.latitude, lng: this.task.longitude });
            return;
        }

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

        try {
            this.map = L.map('taskCompletionViewMap', {
                dragging: true,
                touchZoom: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                keyboard: true,
                zoomControl: true
            }).setView([lat, lng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);

            this.marker = L.marker([lat, lng], {
                draggable: false
            }).addTo(this.map);

            this.marker.bindPopup(`
            <div style="text-align: center;">
                <strong>${this.task.title}</strong><br>
                <small>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
            </div>
        `);

            setTimeout(() => {
                this.map?.invalidateSize();
            }, 100);
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    handleClose() {
        this.close.emit();
    }

    onBackdropClick(event: MouseEvent) {
        this.handleClose();
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }
}
