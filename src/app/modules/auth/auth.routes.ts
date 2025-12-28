import { Routes } from "@angular/router";

export default [
    {
        path: '',
        loadComponent: () => import('./login/login').then(m => m.LoginComponent)
    },
    {
        path: 'password-recovery',
        loadComponent: () => import('./password-recovery/password-recovery').then(m => m.PasswordRecoveryComponent)
    }
] as Routes
