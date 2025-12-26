import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconService } from '../../../../shared/data-access/icon';

@Component({
  selector: 'app-login-form',
  imports: [FontAwesomeModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
})
export class LoginFormComponent {

    private iconService = inject(IconService)

    isOpenPassword: boolean = false;

    togglePasswordVisibility() {
        this.isOpenPassword = !this.isOpenPassword;
    }

    getIcon(name: string) {
        return this.iconService.getIcon(name);
    }
}
