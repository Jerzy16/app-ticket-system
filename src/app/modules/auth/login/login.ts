import { Component } from '@angular/core';
import { LoginFormComponent } from "../components/login-form/login-form";
import { LogoComponent } from "../../../shared/components/logo/logo";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-login',
  imports: [LoginFormComponent, LogoComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {

}
