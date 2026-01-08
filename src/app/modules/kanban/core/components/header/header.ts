import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { LogoComponent } from "../../../../../shared/components/logo/logo";
import { IconService } from '../../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/service/auth';
import { SearchService } from '../../services/search';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NotificationDto, NotificationWebSocketService } from '../../services/notification-websocket';
import { NotificationService } from '../../services/notification';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [LogoComponent, FontAwesomeModule, CommonModule],
    templateUrl: './header.html',
    styleUrl: './header.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private iconService = inject(IconService);
    private searchService = inject(SearchService);
    private authService = inject(AuthService);
    private notificationWS = inject(NotificationWebSocketService);
    private notificationService = inject(NotificationService);

    private destroy$ = new Subject<void>();

    showDropdown = false;
    showNotifications = false;
    currentUser: any = null;

    notifications: NotificationDto[] = [];
    unreadCount = 0;

    ngOnInit() {
        this.currentUser = this.authService.getUser();
        console.log(this.currentUser)
        if (this.currentUser && this.currentUser.id) {
            this.initializeNotifications();
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        this.notificationWS.disconnect();
    }

    private initializeNotifications() {
        // Solicitar permiso para notificaciones del navegador
        this.notificationWS.requestNotificationPermission();

        const token = this.authService.getToken();
        this.notificationWS.connect(this.currentUser.id, token as string);

        // Cargar notificaciones existentes
        this.loadNotifications();

        // Suscribirse a las notificaciones en tiempo real
        this.notificationWS.notifications$
            .pipe(takeUntil(this.destroy$))
            .subscribe(notifications => {
                this.notifications = notifications;
            });

        this.notificationWS.unreadCount$
            .pipe(takeUntil(this.destroy$))
            .subscribe(count => {
                this.unreadCount = count;
            });
    }

    private loadNotifications() {
        this.notificationService.getUserNotifications(this.currentUser.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notifications) => {
                    this.notificationWS.setNotifications(notifications);
                    console.log("adasdadadasdasd"+notifications)
                },
                error: (error) => {
                    console.error('Error cargando notificaciones:', error);
                }
            });
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }

    openSearch() {
        this.searchService.openSearchModal();
    }

    navigate(path: string) {
        this.router.navigate([path]);
    }

    isActive(path: string): boolean {
        return this.router.url === path;
    }

    toggleDropdown() {
        this.showDropdown = !this.showDropdown;
        this.showNotifications = false;
    }

    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
        this.showDropdown = false;
    }

    markAsRead(notification: NotificationDto, event: Event) {
        event.stopPropagation();

        if (!notification.read) {
            this.notificationService.markAsRead(notification.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.notificationWS.markAsReadLocally(notification.id);
                    },
                    error: (error) => {
                        console.error('Error marcando notificación como leída:', error);
                    }
                });
        }
    }

    markAllAsRead(event: Event) {
        event.stopPropagation();

        if (this.unreadCount > 0) {
            this.notificationService.markAllAsRead(this.currentUser.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.notificationWS.markAllAsReadLocally();
                    },
                    error: (error) => {
                        console.error('Error marcando todas como leídas:', error);
                    }
                });
        }
    }

    goToTask(notification: NotificationDto) {
        if (notification.taskId) {
            this.showNotifications = false;
            this.router.navigate(['/kanban'], {
                queryParams: { taskId: notification.taskId }
            });

            if (!notification.read) {
                this.notificationService.markAsRead(notification.id)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.notificationWS.markAsReadLocally(notification.id);
                        }
                    });
            }
        }
    }

    getNotificationIcon(type: string): string {
        switch (type) {
            case 'TASK_ASSIGNED':
                return 'user-plus';
            case 'TASK_UPDATED':
                return 'edit';
            case 'TASK_MOVED':
                return 'arrows-alt';
            case 'TASK_COMPLETED':
                return 'check-circle';
            case 'TASK_COMMENT':
                return 'comment';
            default:
                return 'bell';
        }
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container') && !target.closest('.notifications-container')) {
            this.showDropdown = false;
            this.showNotifications = false;
        }
    }

    goToProfile() {
        this.showDropdown = false;
        this.router.navigate(['/profile']);
    }

    logout() {
        this.showDropdown = false;
        this.notificationWS.disconnect();
        this.authService.logout();
        this.router.navigate(['/']);
    }
}
