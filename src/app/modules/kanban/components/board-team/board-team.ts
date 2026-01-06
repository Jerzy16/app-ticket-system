import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TeamMemberDisplay {
  id?: string;
  name: string;
  post: string;
  photo: string;
}

export interface TeamGroupDisplay {
  role: string;
  members: TeamMemberDisplay[];
}

@Component({
  selector: 'app-board-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-team.html',
  styleUrls: ['./board-team.css']
})
export class BoardTeamComponent {
  @Input() team!: TeamGroupDisplay;

  getDefaultPhoto(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  }
}
