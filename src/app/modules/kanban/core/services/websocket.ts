import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

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

export interface BoardUpdate {
    type: 'TASK_MOVED' | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'BOARD_CREATED';
    taskId?: string;
    boardId?: string;
    fromBoardId?: string;
    toBoardId?: string;
    newIndex?: number;
    task?: any;
    board?: any;
}

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private stompClient: Client | null = null;

    private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
    private unreadCountSubject = new BehaviorSubject<number>(0);

    private boardUpdatesSubject = new BehaviorSubject<BoardUpdate | null>(null);

    private isConnected = false;
    private userId: string | null = null;

    public notifications$ = this.notificationsSubject.asObservable();
    public unreadCount$ = this.unreadCountSubject.asObservable();
    public boardUpdates$ = this.boardUpdatesSubject.asObservable();

    constructor() { }

    connect(userId: string, token: string): void {
        if (this.isConnected) {
            return;
        }

        this.userId = userId;

        const socket = new SockJS(`${environment.url}/ws`, undefined, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling']
        } as any);

        this.stompClient = new Client({
            webSocketFactory: () => socket as any,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.stompClient.onConnect = (frame) => {
            this.isConnected = true;

            this.subscribeToNotifications();
            this.subscribeToBoardUpdates();
        };

        this.stompClient.onStompError = (frame) => {
            this.isConnected = false;
        };

        this.stompClient.onDisconnect = () => {
            this.isConnected = false;
        };

        this.stompClient.activate();
    }

    private subscribeToNotifications(): void {
        if (!this.stompClient || !this.userId) return;

        this.stompClient.subscribe(
            `/user/queue/notifications`,
            (message: Message) => {
                try {
                    const notification: NotificationDto = JSON.parse(message.body);
                    const currentNotifications = this.notificationsSubject.value;
                    this.notificationsSubject.next([notification, ...currentNotifications]);

                    this.updateUnreadCount();
                    this.showBrowserNotification(notification);
                } catch (error) {
                }
            }
        );

    }

    private subscribeToBoardUpdates(): void {
        if (!this.stompClient) return;

        this.stompClient.subscribe(
            `/topic/board-updates`,
            (message: Message) => {
                try {
                    const update: BoardUpdate = JSON.parse(message.body);

                    this.boardUpdatesSubject.next(update);
                } catch (error) {
                }
            }
        );

    }

    disconnect(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.isConnected = false;
            this.userId = null;
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
                } else {
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

    getNotifications(): Observable<NotificationDto[]> {
        return this.notifications$;
    }

    getUnreadCount(): Observable<number> {
        return this.unreadCount$;
    }

    getBoardUpdates(): Observable<BoardUpdate | null> {
        return this.boardUpdates$;
    }
}
