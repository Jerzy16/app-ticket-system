import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class LayoutComponent {

}
