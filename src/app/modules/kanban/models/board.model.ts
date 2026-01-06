import { Task } from "./task.model";

export interface Board {
    id: string;
    title: string;
    createdBy?: string;
    status?: string;
    tasks: Task[];
    createdAt?: Date;
    updatedAt?: Date;
}

