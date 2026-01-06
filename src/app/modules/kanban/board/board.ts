import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { BoardContainerComponent } from "../components/board-container/board-container";
import { BoardTeamComponent } from "../components/board-team/board-team";
import { SearchService } from '../services/search';
import { Subscription } from 'rxjs';
import { SearchComponent } from "../components/search/search";
import { BoardService } from '../services/board';
import { TeamService, TeamGroup } from '../services/team';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { IconService } from '../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TeamMember, TaskModalComponent } from '../components/task-modal/task-modal';
import { Board } from '../models/board.model';
import { Task } from '../models/task.model';

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
        TaskModalComponent
    ],
    templateUrl: './board.html',
    styleUrl: './board.css',
})
export class BoardComponent implements OnInit, OnDestroy {

    private searchService = inject(SearchService);
    private boardService = inject(BoardService);
    private teamService = inject(TeamService);
    private iconService = inject(IconService);

    isOpen = false;
    boards: Board[] = [];
    team: TeamGroup[] = [];
    isLoadingTeam = false;
    isLoadingBoards = false;

    private sub!: Subscription;
    private boardsSub!: Subscription;

    showTaskModal = false;
    currentBoardId: string | null = null;

    ngOnInit() {
        this.sub = this.searchService.isSearchModalOpen$
            .subscribe(value => {
                this.isOpen = value;
            });

        // Suscribirse al observable de boards
        this.isLoadingBoards = true;
        this.boardsSub = this.boardService.boards$.subscribe({
            next: (boards) => {
                this.boards = boards;
                this.isLoadingBoards = false;
                console.log('Boards actualizados:', boards);
            },
            error: (error) => {
                console.error('Error en la suscripción de boards:', error);
                this.isLoadingBoards = false;
            }
        });

        // Cargar el equipo desde el backend
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
            // Mover dentro del mismo tablero
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            // Mover entre tableros
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

    onTaskSave(formData: Task) {
        if (this.currentBoardId) {
            this.boardService.addTask(this.currentBoardId, {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                assignedTo: formData.assignedTo,
                dueDate: formData.dueDate,
                latitude: formData.latitude,
                longitude: formData.longitude
            });
        }
        this.closeTaskModal();
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
