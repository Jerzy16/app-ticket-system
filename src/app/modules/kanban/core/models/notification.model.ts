
export interface NotificationModel {
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
