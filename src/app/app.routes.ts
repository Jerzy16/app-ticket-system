import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./modules/auth/auth.routes').then(m => m.default)
    },
    {
        path: 'kanban',
        loadChildren: () => import('./modules/kanban/kanban.routes').then(m => m.default)
    }
];
