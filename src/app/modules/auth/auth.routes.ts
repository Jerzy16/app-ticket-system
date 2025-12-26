import { Routes } from "@angular/router";

export default [
    {
        path: '',
        loadComponent: () => import('./login/login').then(m => m.LoginComponent)
    }
] as Routes
