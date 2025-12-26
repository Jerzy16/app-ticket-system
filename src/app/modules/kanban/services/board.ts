import { Injectable } from '@angular/core';
import { Board, Task } from '../board/board';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BoardService {
      private boardsSubject = new BehaviorSubject<Board[]>([
        {
            id: 'tasks',
            title: 'Tareas',
            tasks: [
                {
                    id: '1',
                    title: 'Configurar router principal',
                    description: 'Actualizar firmware y configurar VLANs',
                    assignedTo: ['Juan Pérez', 'Carlos Ramírez'],
                    priority: 'high',
                    createdAt: new Date('2024-12-20'),
                    dueDate: new Date('2024-12-28')
                },
                {
                    id: '2',
                    title: 'Revisar cableado edificio B',
                    description: 'Inspeccionar y documentar puntos de red',
                    assignedTo: ['Miguel Torres'],
                    priority: 'medium',
                    createdAt: new Date('2024-12-21')
                }
            ]
        },
        {
            id: 'in-progress',
            title: 'En proceso',
            tasks: [
                {
                    id: '3',
                    title: 'Instalación de access points',
                    description: 'Montar 5 APs en piso 3',
                    assignedTo: ['Andrés Quispe', 'Juan Pérez'],
                    priority: 'high',
                    createdAt: new Date('2024-12-19'),
                    dueDate: new Date('2024-12-26')
                }
            ]
        },
        {
            id: 'review',
            title: 'En revisión',
            tasks: [
                {
                    id: '4',
                    title: 'Documentar topología de red',
                    description: 'Actualizar diagramas en Confluence',
                    assignedTo: ['Luis Fernández'],
                    priority: 'low',
                    createdAt: new Date('2024-12-18')
                }
            ]
        },
        {
            id: 'completed',
            title: 'Completadas',
            tasks: [
                {
                    id: '5',
                    title: 'Backup de configuraciones',
                    description: 'Respaldar config de todos los switches',
                    assignedTo: ['Carlos Ramírez'],
                    priority: 'medium',
                    createdAt: new Date('2024-12-15')
                }
            ]
        }
    ]);

    boards$ = this.boardsSubject.asObservable();

    getBoards(): Board[] {
        return this.boardsSubject.value;
    }

    addTask(boardId: string, task: Omit<Task, 'id' | 'createdAt'>): void {
        const boards = this.boardsSubject.value;
        const boardIndex = boards.findIndex(b => b.id === boardId);

        if (boardIndex !== -1) {
            const newTask: Task = {
                ...task,
                id: Date.now().toString(),
                createdAt: new Date()
            };

            boards[boardIndex].tasks.push(newTask);
            this.boardsSubject.next([...boards]);
        }
    }

    moveTask(taskId: string, fromBoardId: string, toBoardId: string, toIndex: number): void {
        const boards = this.boardsSubject.value;
        const fromBoard = boards.find(b => b.id === fromBoardId);
        const toBoard = boards.find(b => b.id === toBoardId);

        if (!fromBoard || !toBoard) return;

        const taskIndex = fromBoard.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const [task] = fromBoard.tasks.splice(taskIndex, 1);
        toBoard.tasks.splice(toIndex, 0, task);

        this.boardsSubject.next([...boards]);
    }

    addBoard(title: string): void {
        const boards = this.boardsSubject.value;
        const newBoard: Board = {
            id: `board-${Date.now()}`,
            title,
            tasks: []
        };
        this.boardsSubject.next([...boards, newBoard]);
    }

    deleteBoard(boardId: string): void {
        const boards = this.boardsSubject.value.filter(b => b.id !== boardId);
        this.boardsSubject.next(boards);
    }

    updateTask(boardId: string, taskId: string, updates: Partial<Task>): void {
        const boards = this.boardsSubject.value;
        const board = boards.find(b => b.id === boardId);

        if (board) {
            const task = board.tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, updates);
                this.boardsSubject.next([...boards]);
            }
        }
    }

    deleteTask(boardId: string, taskId: string): void {
        const boards = this.boardsSubject.value;
        const board = boards.find(b => b.id === boardId);

        if (board) {
            board.tasks = board.tasks.filter(t => t.id !== taskId);
            this.boardsSubject.next([...boards]);
        }
    }
}
