export interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo?: string[];
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    dueDate?: Date;
    latitude?: number;
    longitude?: number;
    boardId?: string;
    status?: string;
}

export interface TaskCreateDto {
    id?: string;
    title: string;
    description: string;
    priority: string;
    boardId: string;
    assignedTo: string[];
    dueDate: string | null;
    latitude: number | null;
    longitude: number | null;
}
