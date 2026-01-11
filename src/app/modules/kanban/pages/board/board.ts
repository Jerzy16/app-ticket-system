import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { BoardContainerComponent } from "../../core/components/board-container/board-container";
import { BoardTeamComponent } from "../../core/components/board-team/board-team";
import { Subscription } from 'rxjs';
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
import { BoardUpdate, WebSocketService } from '../../core/services/websocket';
import { toast } from 'ngx-sonner';

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
        TaskDetailModalComponent
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

    isOpen = false;
    boards: Board[] = [];
    team: TeamGroup[] = [];
    isLoadingTeam = false;
    isLoadingBoards = false;

    showTaskDetailModal = false;
    selectedTask: Task | null = null;

    private boardsSub?: Subscription;
    private boardUpdatesSub?: Subscription;
    private notificationsSub?: Subscription;
    showTaskModal = false;
    currentBoardId: string | null = null;

    ngOnInit() {
        this.isLoadingBoards = true;
        this.isLoadingTeam = true;

        this.boardsSub = this.boardService.boards$.subscribe({
            next: (boards) => {
                this.boards = boards;
                this.isLoadingBoards = false;
            },
            error: (error) => {
                this.isLoadingBoards = false;
            }
        });

        this.loadTeam();

        this.connectWebSocket();

        this.listenToBoardUpdates();

        this.listenToNotifications();
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
        } else {
        }
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

                // Aquí puedes mostrar una alerta, toast, o actualizar un contador
                // Por ejemplo:
                // this.toastService.show(notification.title, notification.message);
                // this.notificationCount++;
            },
            error: (error) => {
                console.error('Error en notificaciones:', error);
            }
        });
    }


    private handleTaskCreated(update: BoardUpdate) {
        toast.success('Nueva tarea creada')
        this.boardService.refreshBoards();
    }

    private handleTaskUpdated(update: BoardUpdate) {
        toast.success('Tarea actualizada')
        if (update.boardId && update.taskId && update.task) {
            this.boardService.updateTask(update.boardId, update.taskId, update.task);
        }
    }

    private handleTaskMoved(update: BoardUpdate) {
        toast.success('Tarea movida')
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

    getBoardIds(): string[] {
        return this.boards.map(b => b.id).filter((id): id is string => id !== undefined);
    }

    onTaskDrop(event: CdkDragDrop<any[]>, boardId: string) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            const taskId = event.previousContainer.data[event.previousIndex].id;
            const fromBoardId = event.previousContainer.id;
            this.boardService.moveTask(taskId, fromBoardId, boardId, event.currentIndex);
        }
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
        this.taskService.createTask(taskDto).subscribe({
            next: (response) => {
                toast.success('Tarea creada exitosamente');
                const assignedUserNames = response.data.assignedTo?.map((userId: string) => {
                    const member = this.allTeamMembers.find(m => m.id === userId);
                    return member ? member.name : userId;
                }) || [];

                this.boardService.addTask(taskDto.boardId, {
                    title: response.data.title,
                    description: response.data.description,
                    priority: response.data.priority,
                    assignedTo: assignedUserNames,
                    dueDate: response.data.dueDate,
                    latitude: response.data.latitude,
                    longitude: response.data.longitude,
                    boardId: response.data.boardId,
                });

                this.closeTaskModal();
            },
            error: (error) => {
                console.error('Error al crear la tarea:', error);
                toast.error('Error al crear la tarea. Por favor, intente nuevamente.');
            }
        });
    }

    onTaskClick(task: Task) {
        this.selectedTask = task;
        this.showTaskDetailModal = true;
    }

    onTaskDetailSave(updatedTask: Task) {

        this.taskService.updateTask(updatedTask.id!, updatedTask).subscribe({
            next: (response) => {

                this.boardService.updateTask(updatedTask.boardId!, updatedTask.id!, updatedTask);

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
        this.selectedTask = null;
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
