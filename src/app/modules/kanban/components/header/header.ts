import { Component, EventEmitter, HostListener, inject, Output } from '@angular/core';
import { LogoComponent } from "../../../../shared/components/logo/logo";
import { IconService } from '../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SearchService } from '../../services/search';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/service/auth';

@Component({
    selector: 'app-header',
    imports: [LogoComponent, FontAwesomeModule],
    templateUrl: './header.html',
    styleUrl: './header.css',
})
export class HeaderComponent {
    private router = inject(Router);
    private iconService = inject(IconService);
    private searchService = inject(SearchService);
    private authService = inject(AuthService);

    showDropdown = false;
    currentUser: any = null;

    ngOnInit() {
        this.currentUser = this.authService.getUser();
    }
    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }

    openSearch() {
        this.searchService.openSearchModal();
    }

    navigate(path: string) {
        this.router.navigate([path]);
    }

    isActive(path: string): boolean {
        return this.router.url === path;
    }

    toggleDropdown() {
        this.showDropdown = !this.showDropdown;
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
            this.showDropdown = false;
        }
    }

    goToProfile() {
        this.showDropdown = false;
        this.router.navigate(['/profile']);
    }

    logout() {
        this.showDropdown = false;
        this.authService.logout();
        this.router.navigate(['/']);
    }
}
