import { Component, inject } from '@angular/core';
import { BoardContainerComponent } from "../components/board-container/board-container";
import { BoardTeamComponent } from "../components/board-team/board-team";
import { SearchService } from '../services/search';
import { Subscription } from 'rxjs';
import { SearchComponent } from "../components/search/search";

@Component({
    selector: 'app-board',
    imports: [BoardContainerComponent, BoardTeamComponent, SearchComponent],
    templateUrl: './board.html',
    styleUrl: './board.css',
})
export class BoardComponent {

    private searchService = inject(SearchService);

    isOpen = false;
    private sub!: Subscription;

    ngOnInit() {
        this.sub = this.searchService.isSearchModalOpen$
            .subscribe(value => {
                this.isOpen = value;
            });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    defaultPhoto =
        'https://imgs.search.brave.com/75A903UnLFvlStBzg-vTQmYHhoX69XxQHut4A5GthlU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2I2L2Zh/LzRkL2I2ZmE0ZDk1/ZWUxYzIzYjAyNzcx/NzhkYzMxODkzZDgw/LmpwZw';

    team = [
        {
            role: 'Jefe de Redes',
            members: [
                {
                    name: 'Carlos Ramírez',
                    post: 'Jefe de Redes',
                    photo: this.defaultPhoto
                }
            ]
        },
        {
            role: 'Coordinador',
            members: [
                {
                    name: 'Luis Fernández',
                    post: 'Coordinador de Operaciones',
                    photo: this.defaultPhoto
                }
            ]
        },
        {
            role: 'Técnicos',
            members: [
                {
                    name: 'Juan Pérez',
                    post: 'Técnico de Campo',
                    photo: this.defaultPhoto
                },
                {
                    name: 'Miguel Torres',
                    post: 'Técnico de Instalaciones',
                    photo: this.defaultPhoto
                },
                {
                    name: 'Andrés Quispe',
                    post: 'Técnico de Mantenimiento',
                    photo: this.defaultPhoto
                }
            ]
        },
        {
            role: 'Soporte / NOC',
            members: [
                {
                    name: 'Ana López',
                    post: 'Soporte Técnico',
                    photo: this.defaultPhoto
                },
                {
                    name: 'María Salazar',
                    post: 'Operadora NOC',
                    photo: this.defaultPhoto
                }
            ]
        }
    ];
}
