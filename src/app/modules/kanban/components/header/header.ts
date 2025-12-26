import { Component, EventEmitter, inject, Output } from '@angular/core';
import { LogoComponent } from "../../../../shared/components/logo/logo";
import { IconService } from '../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SearchService } from '../../services/search';

@Component({
  selector: 'app-header',
  imports: [LogoComponent, FontAwesomeModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {

    private iconService = inject(IconService);
    private searchService = inject(SearchService);

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }

    openSearch() {
        this.searchService.openSearchModal();
    }
}
