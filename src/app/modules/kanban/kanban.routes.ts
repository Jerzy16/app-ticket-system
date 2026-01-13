import { Routes } from "@angular/router";

export default [
    {
        path: '',
        loadComponent: () => import('./core/components/layout/layout').then(m => m.LayoutComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/board/board').then(m => m.BoardComponent),
            },
            {
                path: 'staff',
                loadComponent: () => import('./pages/staff/staff').then(m => m.StaffComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent)
            },
            {
                path: 'report',
                loadComponent: () => import('./pages/report-viewer/report-viewer').then(m => m.ReportViewerComponent)
            }
        ]
    }
] as Routes;
