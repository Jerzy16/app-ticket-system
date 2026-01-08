import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-board-container',
  imports: [],
  templateUrl: './board-container.html',
  styleUrl: './board-container.css',
})
export class BoardContainerComponent {
    @Input() title: string = '';
}
