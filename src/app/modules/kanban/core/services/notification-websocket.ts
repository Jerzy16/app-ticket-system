import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationDto {
    id: string;
    userId: string;
    title: string;
    message: string;
    read: boolean;
    taskId: string;
    taskTitle: string;
    type: string;
    actionBy: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationWebSocketService {
    private stompClient: Client | null = null;
    private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
    private unreadCountSubject = new BehaviorSubject<number>(0);

    public notifications$ = this.notificationsSubject.asObservable();
    public unreadCount$ = this.unreadCountSubject.asObservable();

    private isConnected = false;
    private userId: string | null = null;

    constructor() { }

    connect(userId: string, token: string): void {
        if (this.isConnected) {
            console.log('Ya está conectado al WebSocket');
            return;
        }

        this.userId = userId;
        console.log('🔌 Intentando conectar WebSocket para usuario:', userId);

        const socket = new SockJS('http://localhost:8080/ws', undefined, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling']
        } as any);

        this.stompClient = new Client({
            webSocketFactory: () => socket as any,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.stompClient.onConnect = (frame) => {
            console.log('✅ WebSocket conectado exitosamente');
            console.log('👤 Usuario ID:', this.userId);
            console.log('📋 Frame:', frame);
            this.isConnected = true;
            this.subscribeToNotifications();
        };

        this.stompClient.onStompError = (frame) => {
            console.error('❌ Error en STOMP:', frame.headers['message']);
            console.error('Detalles:', frame.body);
            this.isConnected = false;
        };

        this.stompClient.onDisconnect = () => {
            console.log('🔌 WebSocket desconectado');
            this.isConnected = false;
        };

        this.stompClient.activate();
    }



    private subscribeToNotifications(): void {
        if (!this.stompClient || !this.userId) return;

        this.stompClient.subscribe(
            `/user/queue/notifications`,
            (message: Message) => {
                const notification: NotificationDto = JSON.parse(message.body);
                console.log('Nueva notificación recibida:', notification);

                const currentNotifications = this.notificationsSubject.value;
                this.notificationsSubject.next([notification, ...currentNotifications]);

                this.updateUnreadCount();

                this.showBrowserNotification(notification);
            }
        );
    }

    disconnect(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.isConnected = false;
            this.userId = null;
            console.log('WebSocket desconectado manualmente');
        }
    }

    setNotifications(notifications: NotificationDto[]): void {
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
    }

    markAsReadLocally(notificationId: string): void {
        const notifications = this.notificationsSubject.value.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
    }

    markAllAsReadLocally(): void {
        const notifications = this.notificationsSubject.value.map(n =>
            ({ ...n, read: true })
        );
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(0);
    }

    private updateUnreadCount(): void {
        const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
        this.unreadCountSubject.next(unreadCount);
    }

    private showBrowserNotification(notification: NotificationDto): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/assets/img/logo.png',
                badge: '/assets/img/badge.png',
                tag: notification.id,
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };
        }
    }

    requestNotificationPermission(): void {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Permiso de notificaciones concedido');
                } else {
                    console.log('Permiso de notificaciones denegado');
                }
            });
        }
    }

    isWebSocketConnected(): boolean {
        return this.isConnected;
    }

    getCurrentUserId(): string | null {
        return this.userId;
    }

    removeNotificationLocally(notificationId: string): void {
        const notifications = this.notificationsSubject.value.filter(
            n => n.id !== notificationId
        );
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
    }

    clearAllNotifications(): void {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
    }
}
