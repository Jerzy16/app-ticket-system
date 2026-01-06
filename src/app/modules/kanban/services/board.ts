import { Board } from '../models/board.model';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';
import { Task } from '../models/task.model';

@Injectable({
    providedIn: 'root',
})

export class BoardService {

    private http = inject(HttpClient);
    private url = environment.api_url;

    private boardsSubject = new BehaviorSubject<Board[]>([]);
    boards$ = this.boardsSubject.asObservable();

    constructor() {
        // Cargar boards desde el backend al iniciar el servicio
        this.loadBoardsFromBackend();
    }

    /**
     * Carga los boards desde el backend
     */
    private loadBoardsFromBackend(): void {
        this.getAll().subscribe({
            next: (response) => {
                const boards = response.data.map(board => ({
                    ...board,
                    tasks: board.tasks || []
                }));
                this.boardsSubject.next(boards);
                console.log('Boards cargados desde el backend:', boards);
            },
            error: (error) => {
                console.error('Error al cargar boards desde el backend:', error);
                // Mantener boards vacíos si hay error
                this.boardsSubject.next([]);
            }
        });
    }

    /**
     * Obtiene todos los boards desde el backend
     */
    getAll(): Observable<ApiResponse<Board[]>> {
        return this.http.get<ApiResponse<Board[]>>(`${this.url}/boards`);
    }

    /**
     * Obtiene los boards actuales del estado local
     */
    getBoards(): Board[] {
        return this.boardsSubject.value;
    }

    /**
     * Crea un nuevo board en el backend
     */
    createBoard(title: string): Observable<ApiResponse<Board>> {
        const newBoard = {
            title,
            status: 'active'
        };
        return this.http.post<ApiResponse<Board>>(`${this.url}/boards`, newBoard).pipe(
            tap(response => {
                const board = { ...response.data, tasks: [] };
                const currentBoards = this.boardsSubject.value;
                this.boardsSubject.next([...currentBoards, board]);
                console.log('Board creado:', board);
            }),
            catchError(error => {
                console.error('Error al crear board:', error);
                throw error;
            })
        );
    }

    /**
     * Agrega un board (wrapper para mantener compatibilidad)
     */
    addBoard(title: string): void {
        this.createBoard(title).subscribe({
            next: () => console.log('Board agregado exitosamente'),
            error: (error) => console.error('Error al agregar board:', error)
        });
    }

    /**
     * Agrega una nueva tarea a un board
     * TODO: Implementar endpoint en el backend para crear tareas
     */
    addTask(boardId: string, task: Omit<Task, 'id' | 'createdAt'>): void {
        const boards = this.boardsSubject.value;
        const boardIndex = boards.findIndex(b => b.id === boardId);

        if (boardIndex !== -1) {
            const newTask: Task = {
                ...task,
                id: Date.now().toString(),
                createdAt: new Date(),
                boardId: boardId,
                status: 'pending'
            };

            const updatedBoards = [...boards];
            updatedBoards[boardIndex] = {
                ...updatedBoards[boardIndex],
                tasks: [...(updatedBoards[boardIndex].tasks || []), newTask]
            };

            this.boardsSubject.next(updatedBoards);

            // TODO: Descomentar cuando tengas el endpoint en el backend
            /*
            this.http.post<ApiResponse<Task>>(`${this.url}/boards/${boardId}/tasks`, newTask)
                .subscribe({
                    next: (response) => console.log('Tarea creada en el backend:', response.data),
                    error: (error) => console.error('Error al crear tarea:', error)
                });
            */
        }
    }

    /**
     * Mueve una tarea entre boards o dentro del mismo board
     * TODO: Implementar endpoint en el backend para actualizar tareas
     */
    moveTask(taskId: string, fromBoardId: string, toBoardId: string, toIndex: number): void {
        const boards = this.boardsSubject.value;
        const fromBoardIndex = boards.findIndex(b => b.id === fromBoardId);
        const toBoardIndex = boards.findIndex(b => b.id === toBoardId);

        if (fromBoardIndex === -1 || toBoardIndex === -1) return;

        const updatedBoards = [...boards];
        const fromTasks = [...(updatedBoards[fromBoardIndex].tasks || [])];
        const toTasks = fromBoardId === toBoardId
            ? fromTasks
            : [...(updatedBoards[toBoardIndex].tasks || [])];

        const taskIndex = fromTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const [task] = fromTasks.splice(taskIndex, 1);
        task.boardId = toBoardId;

        if (fromBoardId === toBoardId) {
            // Mover dentro del mismo board
            fromTasks.splice(toIndex, 0, task);
            updatedBoards[fromBoardIndex] = {
                ...updatedBoards[fromBoardIndex],
                tasks: fromTasks
            };
        } else {
            // Mover entre boards diferentes
            toTasks.splice(toIndex, 0, task);
            updatedBoards[fromBoardIndex] = {
                ...updatedBoards[fromBoardIndex],
                tasks: fromTasks
            };
            updatedBoards[toBoardIndex] = {
                ...updatedBoards[toBoardIndex],
                tasks: toTasks
            };
        }

        this.boardsSubject.next(updatedBoards);

        // TODO: Descomentar cuando tengas el endpoint en el backend
        /*
        this.http.patch<ApiResponse<Task>>(`${this.url}/boards/tasks/${taskId}`, {
            boardId: toBoardId,
            position: toIndex
        }).subscribe({
            next: (response) => console.log('Tarea movida en el backend:', response.data),
            error: (error) => console.error('Error al mover tarea:', error)
        });
        */
    }

    /**
     * Actualiza una tarea específica
     * TODO: Implementar endpoint en el backend
     */
    updateTask(boardId: string, taskId: string, updates: Partial<Task>): void {
        const boards = this.boardsSubject.value;
        const board = boards.find(b => b.id === boardId);

        if (board) {
            const taskIndex = board.tasks?.findIndex(t => t.id === taskId);
            if (taskIndex !== undefined && taskIndex !== -1 && board.tasks) {
                board.tasks[taskIndex] = {
                    ...board.tasks[taskIndex],
                    ...updates
                };
                this.boardsSubject.next([...boards]);

                // TODO: Descomentar cuando tengas el endpoint en el backend
                /*
                this.http.patch<ApiResponse<Task>>(`${this.url}/boards/tasks/${taskId}`, updates)
                    .subscribe({
                        next: (response) => console.log('Tarea actualizada en el backend:', response.data),
                        error: (error) => console.error('Error al actualizar tarea:', error)
                    });
                */
            }
        }
    }

    /**
     * Elimina una tarea de un board
     * TODO: Implementar endpoint en el backend
     */
    deleteTask(boardId: string, taskId: string): void {
        const boards = this.boardsSubject.value;
        const board = boards.find(b => b.id === boardId);

        if (board && board.tasks) {
            board.tasks = board.tasks.filter(t => t.id !== taskId);
            this.boardsSubject.next([...boards]);

            // TODO: Descomentar cuando tengas el endpoint en el backend
            /*
            this.http.delete<ApiResponse<void>>(`${this.url}/boards/tasks/${taskId}`)
                .subscribe({
                    next: () => console.log('Tarea eliminada del backend'),
                    error: (error) => console.error('Error al eliminar tarea:', error)
                });
            */
        }
    }

    /**
     * Elimina un board
     * TODO: Implementar endpoint en el backend
     */
    deleteBoard(boardId: string): void {
        const boards = this.boardsSubject.value.filter(b => b.id !== boardId);
        this.boardsSubject.next(boards);

        // TODO: Descomentar cuando tengas el endpoint en el backend
        /*
        this.http.delete<ApiResponse<void>>(`${this.url}/boards/${boardId}`)
            .subscribe({
                next: () => console.log('Board eliminado del backend'),
                error: (error) => {
                    console.error('Error al eliminar board:', error);
                    // Revertir el cambio si hay error
                    this.loadBoardsFromBackend();
                }
            });
        */
    }

    /**
     * Refresca los boards desde el backend
     */
    refreshBoards(): void {
        this.loadBoardsFromBackend();
    }
}
