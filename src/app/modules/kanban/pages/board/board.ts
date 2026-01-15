import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { BoardContainerComponent } from "../../core/components/board-container/board-container";
import { BoardTeamComponent } from "../../core/components/board-team/board-team";
import { Observable, Subscription, switchMap } from 'rxjs';
import { SearchComponent } from "../../core/components/search/search";
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { IconService } from '../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TeamMember, TaskModalComponent } from '../../core/components/task-modal/task-modal';
import { Board } from '../../core/models/board.model';
import { HttpClient } from '@angular/common/http';
import { Task, TaskCreateDto } from '../../core/models/task/task.model';
import { SearchService } from '../../core/services/search';
import { BoardService } from '../../core/services/board';
import { TeamGroup, TeamService } from '../../core/services/team';
import { TaskService } from '../../core/services/task';
import { TaskDetailModalComponent } from "../../core/components/task-detail-modal/task-detail-modal";
import { TaskCompletionData, TaskCompletionModal } from '../../core/components/task-completion-modal/task-completion-modal';
import { BoardUpdate, WebSocketService } from '../../core/services/websocket';
import { toast } from 'ngx-sonner';
import { ImageUploadService } from '../../core/services/image-upload';
import { TaskCompletionService } from '../../core/services/task-completion';
import { TaskCompletionViewModal } from '../../core/components/task-completion-view-modal/task-completion-view-modal';

@Component({
    selector: 'app-board',
    standalone: true,
    imports: [
        BoardContainerComponent,
        BoardTeamComponent,
        SearchComponent,
        CommonModule,
        DragDropModule,
        FontAwesomeModule,
        TaskModalComponent,
        TaskDetailModalComponent,
        TaskCompletionModal,
        TaskCompletionViewModal
    ],
    templateUrl: './board.html',
    styleUrl: './board.css',
})
export class BoardComponent implements OnInit, OnDestroy {
    private searchService = inject(SearchService);
    private boardService = inject(BoardService);
    private teamService = inject(TeamService);
    private iconService = inject(IconService);
    private taskService = inject(TaskService);
    private http = inject(HttpClient);
    private webSocketService = inject(WebSocketService);
    private imageUploadService = inject(ImageUploadService);
    private taskCompletionService = inject(TaskCompletionService);

    private readonly COMPLETED_BOARD_ID = '8a0d1b73-373a-46bc-9477-9c86e756b24e';

    isOpen$: Observable<boolean>;
    boards: Board[] = [];
    team: TeamGroup[] = [];
    isLoadingTeam = false;
    isLoadingBoards = false;
    showTaskDetailModal = false;
    selectedTaskForCompletion: Task | null = null;
    isTaskFromCompletedBoard = false;

    private boardsSub?: Subscription;
    private boardUpdatesSub?: Subscription;
    private notificationsSub?: Subscription;

    showTaskModal = false;
    currentBoardId: string | null = null;
    showCompletionModal = false;

    pendingTaskMove: {
        taskId: string;
        fromBoardId: string;
        toBoardId: string;
        newIndex: number;
        task: any;
    } | null = null;

    constructor() {
        this.isOpen$ = this.searchService.isSearchModalOpen$;
    }

    ngOnInit() {
        this.isLoadingBoards = true;
        this.isLoadingTeam = true;

        this.teamService.getTeam().subscribe({
            next: (data) => {
                this.team = Array.isArray(data) ? data : [];
                this.isLoadingTeam = false;

                this.boardsSub = this.boardService.boards$.subscribe({
                    next: (boards) => {
                        this.boards = this.enrichBoardsWithUserData(boards);
                        this.isLoadingBoards = false;
                        console.log(boards)
                    },
                    error: (error) => {
                        this.isLoadingBoards = false;
                    }
                });
            },
            error: (error) => {
                this.team = [];
                this.isLoadingTeam = false;
            }
        });

        this.connectWebSocket();
        this.listenToBoardUpdates();
        this.listenToNotifications();
    }

    isCompletedBoard(boardId: string): boolean {
        return boardId === this.COMPLETED_BOARD_ID;
    }

    private enrichBoardsWithUserData(boards: Board[]): Board[] {
        return boards.map(board => ({
            ...board,
            tasks: board.tasks.map(task => this.enrichTaskWithUserData(task))
        }));
    }

    private enrichTaskWithUserData(task: Task): Task {
        if (!task.assignedTo || task.assignedTo.length === 0) {
            return { ...task, assignedUsers: [] };
        }

        if (task.assignedUsers && task.assignedUsers.length > 0) {
            return task;
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const assignedUsers = task.assignedTo
            .map(assignedValue => {
                let member;

                if (uuidRegex.test(assignedValue)) {
                    member = this.allTeamMembers.find(m => m.id === assignedValue);
                } else {
                    member = this.allTeamMembers.find(m => m.name === assignedValue);
                }

                if (member) {
                    return {
                        id: member.id,
                        name: member.name,
                        lastName: '',
                        email: '',
                        photo: member.photo,
                        position: member.post,
                        roles: []
                    };
                }

                console.warn(`No se encontró miembro para: ${assignedValue}`);
                return null;
            })
            .filter((user): user is NonNullable<typeof user> => user !== null);

        return { ...task, assignedUsers };
    }

    loadTeam() {
        this.isLoadingTeam = true;
        this.teamService.getTeam().subscribe({
            next: (data) => {
                this.team = Array.isArray(data) ? data : [];
                this.isLoadingTeam = false;
            },
            error: (error) => {
                this.team = [];
                this.isLoadingTeam = false;
            }
        });
    }

    connectWebSocket() {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (token && userId) {
            this.webSocketService.connect(token, userId);
        }
    }

    getBoardIds(): string[] {
        // Devolver TODOS los boards (incluyendo completados)
        // El control de drop se maneja en onTaskDrop
        return this.boards
            .map(b => b.id)
            .filter((id): id is string => id !== undefined);

    }

    listenToBoardUpdates() {
        this.boardUpdatesSub = this.webSocketService.getBoardUpdates().subscribe({
            next: (update: BoardUpdate | null) => {
                if (!update) return;

                switch (update.type) {
                    case 'TASK_CREATED':
                        this.handleTaskCreated(update);
                        break;
                    case 'TASK_UPDATED':
                        this.handleTaskUpdated(update);
                        break;
                    case 'TASK_MOVED':
                        this.handleTaskMoved(update);
                        break;
                    case 'TASK_DELETED':
                        this.handleTaskDeleted(update);
                        break;
                    case 'BOARD_CREATED':
                        this.handleBoardCreated(update);
                        break;
                    default:
                        console.warn('Tipo de actualización desconocido:', update.type);
                }
            },
            error: (error) => {
                console.error('Error en board updates:', error);
            }
        });
    }

    listenToNotifications() {
        this.notificationsSub = this.webSocketService.getNotifications().subscribe({
            next: (notification) => {
                if (!notification) return;
            },
            error: (error) => {
                console.error('Error en notificaciones:', error);
            }
        });
    }

    private handleTaskCreated(update: BoardUpdate) {
        toast.success('Nueva tarea creada');
        this.boardService.refreshBoards();
    }

    private handleTaskUpdated(update: BoardUpdate) {
        // NO mostrar toast aquí si viene de WebSocket para evitar spam
        if (update.boardId && update.taskId && update.task) {
            // Verificar si la tarea realmente cambió antes de actualizar
            const currentBoard = this.boards.find(b => b.id === update.boardId);
            if (currentBoard) {
                const currentTask = currentBoard.tasks.find(t => t.id === update.taskId);

                // Solo actualizar si hay cambios reales
                if (!currentTask || this.hasTaskChanged(currentTask, update.task)) {
                    const enrichedTask = this.enrichTaskWithUserData(update.task);
                    this.boardService.updateTask(update.boardId, update.taskId, enrichedTask);

                    // Solo mostrar toast si el usuario actual NO fue quien hizo el cambio
                    const currentUserId = localStorage.getItem('userId');
                    if (update.task.updatedBy && update.task.updatedBy !== currentUserId) {
                        toast.success('Tarea actualizada por otro usuario');
                    }
                }
            }
        }
    }

    private hasTaskChanged(oldTask: Task, newTask: Task): boolean {
        return oldTask.title !== newTask.title ||
            oldTask.description !== newTask.description ||
            oldTask.priority !== newTask.priority ||
            oldTask.dueDate !== newTask.dueDate ||
            oldTask.latitude !== newTask.latitude ||
            oldTask.longitude !== newTask.longitude ||
            JSON.stringify(oldTask.assignedTo?.sort()) !== JSON.stringify(newTask.assignedTo?.sort());
    }

    private handleTaskMoved(update: BoardUpdate) {
        toast.success('Tarea movida');
        if (update.taskId && update.fromBoardId && update.toBoardId && update.newIndex !== undefined) {
            this.boardService.moveTask(
                update.taskId,
                update.fromBoardId,
                update.toBoardId,
                update.newIndex
            );
        }
    }

    private handleTaskDeleted(update: BoardUpdate) {
        if (update.boardId && update.taskId) {
            this.boardService.deleteTask(update.boardId, update.taskId);
        }
    }

    private handleBoardCreated(update: BoardUpdate) {
        this.boardService.refreshBoards();
    }

    ngOnDestroy() {
        if (this.boardsSub) {
            this.boardsSub.unsubscribe();
        }
        if (this.boardUpdatesSub) {
            this.boardUpdatesSub.unsubscribe();
        }
        if (this.notificationsSub) {
            this.notificationsSub.unsubscribe();
        }
        this.webSocketService.disconnect();
    }

    onTaskDrop(event: CdkDragDrop<Task[]>, boardId: string) {
        console.log('🎯 DROP EVENT:', {
            boardId,
            completedBoardId: this.COMPLETED_BOARD_ID,
            isCompleted: this.isCompletedBoard(boardId)
        });

        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            const task = event.previousContainer.data[event.previousIndex];
            const fromBoardId = event.previousContainer.id;

            // Prevenir mover tareas DESDE el tablero de completados
            if (this.isCompletedBoard(fromBoardId)) {
                toast.error('No puedes mover tareas completadas');
                return;
            }

            // Si el destino es el tablero de completados, mostrar modal
            if (this.isCompletedBoard(boardId)) {
                console.log('✅ Abriendo modal de completación');
                this.selectedTaskForCompletion = task;
                this.showCompletionModal = true;
                this.pendingTaskMove = {
                    taskId: task.id,
                    fromBoardId: fromBoardId,
                    toBoardId: boardId,
                    newIndex: event.currentIndex,
                    task: task
                };
            } else {
                this.boardService.moveTask(task.id, fromBoardId, boardId, event.currentIndex);
            }
        }
    }
    onTaskComplete(completionData: TaskCompletionData) {
        if (!this.selectedTaskForCompletion || !this.pendingTaskMove) return;

        toast.promise(
            this.taskCompletionService.createCompletionWithImages(
                completionData.taskId,
                this.selectedTaskForCompletion.boardId!,
                completionData.description,
                completionData.images,
                completionData.notes
            ).toPromise(),
            {
                loading: 'Subiendo evidencias...',
                success: (response) => {
                    if (this.pendingTaskMove) {
                        this.boardService.moveTask(
                            this.pendingTaskMove.taskId,
                            this.pendingTaskMove.fromBoardId,
                            this.pendingTaskMove.toBoardId,
                            this.pendingTaskMove.newIndex
                        );
                    }
                    this.closeCompletionModal();
                    return 'Tarea completada exitosamente';
                },
                error: (error) => {
                    console.error('Error al completar la tarea:', error);
                    this.closeCompletionModal();
                    return 'Error al completar la tarea';
                }
            }
        );
    }

    closeCompletionModal() {
        this.showCompletionModal = false;
        this.selectedTaskForCompletion = null;
        this.pendingTaskMove = null;
    }

    addNewBoard() {
        const title = prompt('Nombre del nuevo tablero:');
        if (title && title.trim()) {
            this.boardService.addBoard(title.trim());
        }
    }

    openTaskModal(boardId: string) {
        this.currentBoardId = boardId;
        this.showTaskModal = true;
    }

    closeTaskModal() {
        this.showTaskModal = false;
        this.currentBoardId = null;
    }

    onTaskSave(taskDto: TaskCreateDto) {
        // IMPORTANTE: Verificar que assignedTo contenga IDs, no nombres
        console.log('TaskDTO antes de enviar:', taskDto);

        this.taskService.createTask(taskDto).subscribe({
            next: (response) => {
                toast.success('Tarea creada exitosamente');

                // Enriquecer la tarea con los datos de los usuarios
                const assignedUsers = (response.data.assignedTo || [])
                    .map((userId: string) => {
                        const member = this.allTeamMembers.find(m => m.id === userId);
                        if (member) {
                            return {
                                id: member.id,
                                name: member.name,
                                lastName: '',
                                email: '',
                                photo: member.photo,
                                position: member.post,
                                roles: []
                            };
                        }
                        return null;
                    })
                    .filter((user): user is NonNullable<typeof user> => user !== null);

                const newTask: Task = {
                    id: response.data.id,
                    title: response.data.title,
                    description: response.data.description,
                    priority: response.data.priority,
                    assignedTo: response.data.assignedTo, // IDs
                    assignedUsers: assignedUsers,          // Objetos completos
                    dueDate: response.data.dueDate,
                    latitude: response.data.latitude,
                    longitude: response.data.longitude,
                    boardId: response.data.boardId,
                    createdAt: response.data.createdAt || new Date(),
                    status: response.data.status,
                };

                this.boardService.addTask(taskDto.boardId, newTask);
                this.closeTaskModal();
            },
            error: (error) => {
                console.error('Error al crear la tarea:', error);
                toast.error('Error al crear la tarea. Por favor, intente nuevamente.');
            }
        });
    }

    onTaskClick(task: Task, boardId?: string) {
        this.selectedTaskForCompletion = task;
        this.isTaskFromCompletedBoard = boardId ? this.isCompletedBoard(boardId) : false;
        this.showTaskDetailModal = true;
    }

    onTaskDetailSave(updatedTask: Task) {
        // Prevenir edición de tareas completadas
        if (this.isTaskFromCompletedBoard) {
            toast.error('No puedes editar tareas completadas');
            return;
        }

        // IMPORTANTE: Asegurarse de que assignedTo contenga IDs, no nombres
        // Si updatedTask.assignedTo contiene nombres, convertirlos a IDs
        const assignedToIds = (updatedTask.assignedTo || []).map(item => {
            // Si es un ID (UUID format), devolverlo tal cual
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(item)) {
                return item;
            }

            // Si es un nombre, buscar el ID correspondiente
            const member = this.allTeamMembers.find(m => m.name === item);
            return member ? member.id : null;
        }).filter((id): id is string => id !== null);

        const taskToUpdate = {
            ...updatedTask,
            assignedTo: assignedToIds // Asegurar que sean IDs
        };

        this.taskService.updateTask(updatedTask.id!, taskToUpdate).subscribe({
            next: (response) => {
                const enrichedTask = this.enrichTaskWithUserData(taskToUpdate);
                this.boardService.updateTask(updatedTask.boardId!, updatedTask.id!, enrichedTask);
                this.closeTaskDetailModal();
            },
            error: (error) => {
                console.error('Error al actualizar la tarea:', error);
                toast.error('Error al actualizar la tarea. Por favor, intente nuevamente.');
            }
        });
    }

    closeTaskDetailModal() {
        this.showTaskDetailModal = false;
        this.selectedTaskForCompletion = null;
        this.isTaskFromCompletedBoard = false;
    }

    onSearchTaskSelected(task: Task) {
        const boardId = task.boardId;
        this.selectedTaskForCompletion = task;
        this.isTaskFromCompletedBoard = boardId ? this.isCompletedBoard(boardId) : false;
        this.showTaskDetailModal = true;
    }

    close() {
        this.searchService.closeSearchModal();
    }

    get allTeamMembers(): TeamMember[] {
        return this.team.flatMap(group =>
            group.members.map(member => ({
                id: member.id,
                name: member.name,
                post: member.post,
                photo: member.photo
            }))
        );
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }
}
