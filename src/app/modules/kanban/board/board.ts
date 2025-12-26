import { Component, inject } from '@angular/core';
import { BoardContainerComponent } from "../components/board-container/board-container";
import { BoardTeamComponent } from "../components/board-team/board-team";
import { SearchService } from '../services/search';
import { Subscription } from 'rxjs';
import { SearchComponent } from "../components/search/search";
import { BoardService } from '../services/board';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { IconService } from '../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TeamMember, TaskModalComponent, TaskFormData } from '../components/task-modal/task-modal';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string[];
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dueDate?: Date;
}

export interface Board {
  id: string;
  title: string;
  tasks: Task[];
}
@Component({
    selector: 'app-board',
    imports: [BoardContainerComponent, BoardTeamComponent, SearchComponent, CommonModule, DragDropModule, FontAwesomeModule, TaskModalComponent],
    templateUrl: './board.html',
    styleUrl: './board.css',
})
export class BoardComponent {

    private searchService = inject(SearchService);
    private boardService = inject(BoardService);
    private iconService = inject(IconService);

    isOpen = false;
    boards: Board[] = [];
    private sub!: Subscription;

    showTaskModal = false;
    currentBoardId: string | null = null;

    ngOnInit() {
        this.sub = this.searchService.isSearchModalOpen$
            .subscribe(value => {
                this.isOpen = value;
            });

        this.boardService.boards$.subscribe(boards => {
            this.boards = boards;
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    getBoardIds(): string[] {
        return this.boards.map(b => b.id);
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
        if (title) {
            this.boardService.addBoard(title);
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

    onTaskSave(formData: TaskFormData) {
        if (this.currentBoardId) {
            this.boardService.addTask(this.currentBoardId, {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                assignedTo: formData.assignedTo,
                dueDate: formData.dueDate
            });
        }
        this.closeTaskModal();
    }

    defaultPhoto = 'https://imgs.search.brave.com/75A903UnLFvlStBzg-vTQmYHhoX69XxQHut4A5GthlU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2I2L2Zh/LzRkL2I2ZmE0ZDk1/ZWUxYzIzYjAyNzcx/NzhkYzMxODkzZDgw/LmpwZw';

    team = [
        {
            role: 'Jefe de Redes',
            members: [
                { name: 'Carlos Ramírez', post: 'Jefe de Redes', photo: this.defaultPhoto }
            ]
        },
        {
            role: 'Coordinador',
            members: [
                { name: 'Luis Fernández', post: 'Coordinador de Operaciones', photo: this.defaultPhoto }
            ]
        },
        {
            role: 'Técnicos',
            members: [
                { name: 'Juan Pérez', post: 'Técnico de Campo', photo: this.defaultPhoto },
                { name: 'Miguel Torres', post: 'Técnico de Instalaciones', photo: this.defaultPhoto },
                { name: 'Andrés Quispe', post: 'Técnico de Mantenimiento', photo: this.defaultPhoto }
            ]
        },
        {
            role: 'Soporte / NOC',
            members: [
                { name: 'Ana López', post: 'Soporte Técnico', photo: this.defaultPhoto },
                { name: 'María Salazar', post: 'Operadora NOC', photo: this.defaultPhoto }
            ]
        }
    ];

    get allTeamMembers(): TeamMember[] {
        return this.team.flatMap(group => group.members);
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }
}
