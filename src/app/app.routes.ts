import { authGuard } from './modules/auth/guard/auth.guard';
import { guestGuard } from './modules/auth/guard/guest.guard';
import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./modules/auth/auth.routes').then(m => m.default),
        canActivate: [guestGuard]
    },
    {
        path: 'kanban',
        loadChildren: () => import('./modules/kanban/kanban.routes').then(m => m.default),
        canActivate: [authGuard]
    }
];
