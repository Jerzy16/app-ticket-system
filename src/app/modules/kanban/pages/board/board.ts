import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { BoardContainerComponent } from "../../core/components/board-container/board-container";
import { BoardTeamComponent } from "../../core/components/board-team/board-team";
import { BehaviorSubject, catchError, Subscription, tap } from 'rxjs';
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
    private taskService = inject(TaskService)
    private http = inject(HttpClient);

    isOpen = false;
    boards: Board[] = [];
    team: TeamGroup[] = [];
    isLoadingTeam = false;
    isLoadingBoards = false;

    showTaskDetailModal = false;
    selectedTask: Task | null = null;

    private sub!: Subscription;
    private boardsSub!: Subscription;

    showTaskModal = false;
    currentBoardId: string | null = null;

    ngOnInit() {
        this.boardsSub = this.boardService.boards$.subscribe({
            next: (boards) => {
                this.boards = boards;
                if (boards && boards.length >= 0) {
                    this.isLoadingBoards = false;
                }
            },
            error: () => {
                this.isLoadingBoards = false;
            }
        });

        this.isLoadingBoards = true;
        this.loadTeam();
    }



    loadTeam() {
        this.isLoadingTeam = true;
        this.teamService.getTeam().subscribe({
            next: (data) => {
                this.team = Array.isArray(data) ? data : [];
                this.isLoadingTeam = false;
                console.log('Equipo cargado:', this.team);
            },
            error: (error) => {
                console.error('Error al cargar el equipo:', error);
                this.team = [];
                this.isLoadingTeam = false;
            }
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
        if (this.boardsSub) {
            this.boardsSub.unsubscribe();
        }
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
        console.log(boardId)
        this.currentBoardId = boardId;
        this.showTaskModal = true;
    }

    closeTaskModal() {
        this.showTaskModal = false;
        this.currentBoardId = null;
    }

    onTaskSave(taskDto: TaskCreateDto) {
        console.log('Enviando tarea al backend:', taskDto);

        this.taskService.createTask(taskDto).subscribe({
            next: (response) => {
                console.log('Tarea creada exitosamente:', response);

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
                alert('Error al crear la tarea. Por favor, intente nuevamente.');
            }
        });
    }

    onTaskClick(task: Task) {
        this.selectedTask = task;
        this.showTaskDetailModal = true;
    }

    onTaskDetailSave(updatedTask: Task) {
        console.log('Actualizando tarea:', updatedTask);

        this.taskService.updateTask(updatedTask.id!, updatedTask).subscribe({
            next: (response) => {
                console.log('Tarea actualizada exitosamente:', response);

                this.boardService.updateTask(updatedTask.boardId!, updatedTask.id!, updatedTask);

                this.closeTaskDetailModal();
            },
            error: (error) => {
                console.error('Error al actualizar la tarea:', error);
                alert('Error al actualizar la tarea. Por favor, intente nuevamente.');
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
