import { Component, inject } from '@angular/core';
import { SearchService } from '../../services/search';
import { IconService } from '../../../../shared/data-access/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-search',
  imports: [FontAwesomeModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class SearchComponent {
    private searchService = inject(SearchService);
    private iconService = inject(IconService);

    closeSearch() {
        this.searchService.closeSearchModal();
    }

    getIcon(icon: string) {
        return this.iconService.getIcon(icon);
    }
}
