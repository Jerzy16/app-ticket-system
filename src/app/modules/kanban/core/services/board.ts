import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Board } from '../models/board.model';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/interfaces/api-response.interface';
import { Task } from '../models/task/task.model';
import { TaskService } from './task';

@Injectable({
    providedIn: 'root',
})
export class BoardService {
    private http = inject(HttpClient);
    private taskService = inject(TaskService);
    private url = environment.api_url;

    private boardsSubject = new BehaviorSubject<Board[]>([]);
    boards$ = this.boardsSubject.asObservable();

    constructor() {
        this.loadBoardsFromBackend();
    }

    private loadBoardsFromBackend(): void {
        this.getAllWithTasks().subscribe({
            next: (response) => {
                const boards = response.data.map(board => ({
                    ...board,
                    tasks: board.tasks || []
                }));
                console.log(boards)
                this.boardsSubject.next(boards);
            },
            error: (error) => {
                this.boardsSubject.next([]);
            }
        });
    }

    getAll(): Observable<ApiResponse<Board[]>> {
        return this.http.get<ApiResponse<Board[]>>(`${this.url}/boards`);
    }

    getAllWithTasks(): Observable<ApiResponse<Board[]>> {
        return this.http.get<ApiResponse<Board[]>>(`${this.url}/boards/with-tasks`);
    }

    getBoardWithTasks(boardId: string): Observable<ApiResponse<Board>> {
        return this.http.get<ApiResponse<Board>>(`${this.url}/boards/${boardId}/with-tasks`);
    }

    getBoards(): Board[] {
        return this.boardsSubject.value;
    }

    createBoard(title: string): Observable<ApiResponse<Board>> {
        const newBoard = { title, status: 'ACTIVE' };
        return this.http.post<ApiResponse<Board>>(`${this.url}/boards`, newBoard).pipe(
            tap(response => {
                const board = { ...response.data, tasks: [] };
                const currentBoards = this.boardsSubject.value;
                this.boardsSubject.next([...currentBoards, board]);
            }),
            catchError(error => {
                throw error;
            })
        );
    }

    addBoard(title: string): void {
        this.createBoard(title).subscribe({
            next: () => {

            },
            error: (error) => {

            }
        });
    }

    addTask(boardId: string, task: Omit<Task, 'id' | 'createdAt' | 'status'>): void {
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
        }
    }

    /**
     * ✅ ACTUALIZADO: Ahora usa TaskService para hacer la petición al backend
     */
    moveTask(taskId: string, fromBoardId: string, toBoardId: string, toIndex: number): void {
        const boards = this.boardsSubject.value;
        const fromBoardIndex = boards.findIndex(b => b.id === fromBoardId);
        const toBoardIndex = boards.findIndex(b => b.id === toBoardId);

        if (fromBoardIndex === -1 || toBoardIndex === -1) return;

        // Actualizar localmente primero (optimistic update)
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
            fromTasks.splice(toIndex, 0, task);
            updatedBoards[fromBoardIndex] = {
                ...updatedBoards[fromBoardIndex],
                tasks: fromTasks
            };
        } else {
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

        this.taskService.moveTask(taskId, fromBoardId, toBoardId, toIndex).subscribe({
            next: (response) => {

            },
            error: (error) => {
                this.refreshBoards();
            }
        });
    }

    updateBoard(boardId: string, title: string): Observable<ApiResponse<Board>> {
        return this.http.put<ApiResponse<Board>>(`${this.url}/boards/${boardId}`, { title }).pipe(
            tap(response => {
                const boards = this.boardsSubject.value;
                const boardIndex = boards.findIndex(b => b.id === boardId);
                if (boardIndex !== -1) {
                    const updatedBoards = [...boards];
                    updatedBoards[boardIndex] = {
                        ...updatedBoards[boardIndex],
                        ...response.data
                    };
                    this.boardsSubject.next(updatedBoards);
                }
            }),
            catchError(error => {
                throw error;
            })
        );
    }

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

                this.taskService.updateTask(taskId, updates).subscribe({
                    next: (response) => {

                    },
                    error: (error) => {
                        this.refreshBoards();
                    }
                });
            }
        }
    }

    deleteTask(boardId: string, taskId: string): void {
        const boards = this.boardsSubject.value;
        const board = boards.find(b => b.id === boardId);

        if (board && board.tasks) {
            board.tasks = board.tasks.filter(t => t.id !== taskId);
            this.boardsSubject.next([...boards]);

            this.taskService.deleteTask(taskId).subscribe({
                next: () => {

                },
                error: (error) => {
                    this.refreshBoards();
                }
            });
        }
    }

    deleteBoard(boardId: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.url}/boards/${boardId}`).pipe(
            tap(() => {
                const boards = this.boardsSubject.value.filter(b => b.id !== boardId);
                this.boardsSubject.next(boards);
            }),
            catchError(error => {
                throw error;
            })
        );
    }

    refreshBoards(): void {
        this.loadBoardsFromBackend();
    }
}
