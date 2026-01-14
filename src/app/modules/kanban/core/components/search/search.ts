import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { IconService } from '../../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SearchService } from '../../services/search';
import { BoardService } from '../../services/board';
import { Task } from '../../models/task/task.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  imports: [FontAwesomeModule, CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class SearchComponent implements OnInit {
    private searchService = inject(SearchService);
    private iconService = inject(IconService);
    private boardService = inject(BoardService);

    @Output() taskSelected = new EventEmitter<Task>();

    searchQuery: string = '';
    allTasks: Task[] = [];
    filteredTasks: Task[] = [];
    isLoading: boolean = false;

    ngOnInit() {
        this.loadAllTasks();
    }

    loadAllTasks() {
        this.isLoading = true;
        this.boardService.boards$.subscribe({
            next: (boards) => {
                this.allTasks = boards.flatMap(board =>
                    board.tasks.map(task => ({
                        ...task,
                        boardId: board.id,
                        boardTitle: board.title
                    }))
                );
                this.filteredTasks = [];
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error al cargar tareas:', error);
                this.isLoading = false;
            }
        });
    }

    onSearchChange() {
        const query = this.searchQuery.toLowerCase().trim();

        if (!query) {
            this.filteredTasks = [];
            return;
        }

        this.filteredTasks = this.allTasks.filter(task => {
            const titleMatch = task.title?.toLowerCase().includes(query);

            const descriptionMatch = task.description?.toLowerCase().includes(query);

            const assignedUsersMatch = task.assignedUsers?.some(user =>
                user.name?.toLowerCase().includes(query) ||
                user.username?.toLowerCase().includes(query)
            );

            const boardMatch = (task as any).boardTitle?.toLowerCase().includes(query);

            return titleMatch || descriptionMatch || assignedUsersMatch || boardMatch;
        });
    }

    selectTask(task: Task) {
        this.taskSelected.emit(task);
        this.closeSearch();
    }

    closeSearch() {
        this.searchService.closeSearchModal();
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }

    getPriorityColor(priority: string): string {
        switch(priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    getPriorityLabel(priority: string): string {
        switch(priority) {
            case 'high': return 'Alta';
            case 'medium': return 'Media';
            case 'low': return 'Baja';
            default: return priority;
        }
    }
}
