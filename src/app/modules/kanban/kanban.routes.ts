import { Routes } from "@angular/router";

export default [
    {
        path: '',
        loadComponent: () => import('./components/layout/layout').then(m => m.LayoutComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./board/board').then(m => m.BoardComponent),
            }
        ]
    }
] as Routes;
