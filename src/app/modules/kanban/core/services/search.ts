import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SearchService {
    private _isSearchModalOpen = new BehaviorSubject<boolean>(false);

    isSearchModalOpen$ = this._isSearchModalOpen.asObservable();

    openSearchModal() {
        this._isSearchModalOpen.next(true);
        console.log(this._isSearchModalOpen)
    }

    closeSearchModal() {
        this._isSearchModalOpen.next(false);
    }
}
