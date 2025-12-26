import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-board-team',
  imports: [],
  templateUrl: './board-team.html',
  styleUrl: './board-team.css',
})
export class BoardTeamComponent {
     @Input() team!: {
    role: string;
    members: {
      name: string;
      post: string;
      photo: string;
    }[];
  };
}
