import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconService } from '../../../../shared/data-access/icon';
import { AuthService, User } from '../../../auth/service/auth';
import { UserService } from '../../core/services/user';
import { toast } from 'ngx-sonner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-profile',
    imports: [ReactiveFormsModule, FontAwesomeModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css',
})
export class ProfileComponent {
    private fb = inject(FormBuilder);
    private iconService = inject(IconService);
    private authService = inject(AuthService);
    private userService = inject(UserService);

    currentUser: User | null = null;
    profileForm!: FormGroup;
    passwordForm!: FormGroup;

    isEditingProfile = false;
    isEditingPassword = false;
    isLoadingProfile = false;
    isLoadingPassword = false;

    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;

    selectedFile: File | null = null;
    previewUrl: string | null = null;
    isUploadingPhoto = false;

    ngOnInit() {
        this.currentUser = this.authService.getUser();
        this.initForms();
        this.loadUserData();
    }

    initForms() {
        this.profileForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            name: ['', [Validators.required, Validators.minLength(2)]],
            lastname: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            position: ['']
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
            ]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });

        this.profileForm.disable();
        this.passwordForm.disable();
    }

    passwordMatchValidator(form: FormGroup) {
        const newPassword = form.get('newPassword');
        const confirmPassword = form.get('confirmPassword');

        if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }

        return null;
    }

    loadUserData() {
        if (!this.currentUser?.id) return;

        this.userService.getUserById(this.currentUser.id).subscribe({
            next: (user) => {
                this.profileForm.patchValue({
                    username: user.username,
                    name: user.name,
                    lastname: user.lastName,
                    email: user.email,
                    position: user.position
                });
                this.previewUrl = user.photo;
            },
            error: (error) => {
                console.error('Error al cargar datos del usuario:', error);
                toast.error('Error al cargar los datos del perfil');
            }
        });
    }

    toggleEditProfile() {
        this.isEditingProfile = !this.isEditingProfile;

        if (this.isEditingProfile) {
            this.profileForm.enable();
        } else {
            this.profileForm.disable();
            this.loadUserData();
        }
    }

    toggleEditPassword() {
        this.isEditingPassword = !this.isEditingPassword;

        if (this.isEditingPassword) {
            this.passwordForm.enable();
        } else {
            this.passwordForm.disable();
            this.passwordForm.reset();
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;

        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            if (!file.type.startsWith('image/')) {
                toast.error('Solo se permiten archivos de imagen');
                return;
            }

            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.error('La imagen no debe superar los 10MB');
                return;
            }

            this.selectedFile = file;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewUrl = e.target?.result as string;
            };
            reader.readAsDataURL(file);

            this.uploadPhoto();
        }
    }

    uploadPhoto() {
        if (!this.selectedFile || !this.currentUser?.id) return;

        this.isUploadingPhoto = true;

        this.userService.uploadUserPhoto(this.currentUser.id, this.selectedFile).subscribe({
            next: (response) => {
                toast.success('Foto de perfil actualizada');
                this.previewUrl = response.photo;
                this.selectedFile = null;
                this.isUploadingPhoto = false;

                this.updateLocalUser({ photo: response.photo });
            },
            error: (error) => {
                console.error('Error al subir foto:', error);
                toast.error('Error al actualizar la foto de perfil');
                this.isUploadingPhoto = false;
            }
        });
    }

    deletePhoto() {
        if (!this.currentUser?.id) return;

        if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) {
            return;
        }

        this.userService.deleteUserPhoto(this.currentUser.id).subscribe({
            next: (response) => {
                toast.success('Foto de perfil eliminada');
                this.previewUrl = response.photo;

                this.updateLocalUser({ photo: response.photo });
            },
            error: (error) => {
                console.error('Error al eliminar foto:', error);
                toast.error('Error al eliminar la foto de perfil');
            }
        });
    }

    saveProfile() {
        if (this.profileForm.invalid) {
            Object.keys(this.profileForm.controls).forEach(key => {
                this.profileForm.get(key)?.markAsTouched();
            });
            return;
        }

        if (!this.currentUser?.id) return;

        this.isLoadingProfile = true;
        const updateData = {
            username: this.profileForm.value.username,
            name: this.profileForm.value.name,
            lastName: this.profileForm.value.lastname,
            email: this.profileForm.value.email,
            position: this.profileForm.value.position,
            roles: this.currentUser.roles
        };

        this.userService.updateUser(this.currentUser.id, updateData).subscribe({
            next: (response) => {
                toast.success('Perfil actualizado exitosamente');
                this.isLoadingProfile = false;
                this.toggleEditProfile();

                this.updateLocalUser({
                    username: response.username,
                    name: response.name,
                    email: response.email
                });
            },
            error: (error) => {
                console.error('Error al actualizar perfil:', error);
                toast.error(error.error?.message || 'Error al actualizar el perfil');
                this.isLoadingProfile = false;
            }
        });
    }

    savePassword() {
        if (this.passwordForm.invalid) {
            Object.keys(this.passwordForm.controls).forEach(key => {
                this.passwordForm.get(key)?.markAsTouched();
            });
            return;
        }

        if (!this.currentUser?.id) return;

        this.isLoadingPassword = true;

        const updateData = {
            currentPassword: this.passwordForm.value.currentPassword,
            newPassword: this.passwordForm.value.newPassword
        };

        this.userService.updatePassword(this.currentUser.id, updateData).subscribe({
            next: () => {
                toast.success('Contraseña actualizada exitosamente');
                this.isLoadingPassword = false;
                this.toggleEditPassword();
            },
            error: (error) => {
                console.error('Error al actualizar contraseña:', error);
                toast.error(error.error?.message || 'Error al actualizar la contraseña');
                this.isLoadingPassword = false;
            }
        });
    }

    private updateLocalUser(updates: Partial<User>) {
        if (!this.currentUser) return;

        const updatedUser = { ...this.currentUser, ...updates };
        this.currentUser = updatedUser;
        this.authService.setUser(updatedUser);

        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
    }

    getIcon(name: string) {
        return this.iconService.getIcon(name);
    }

    isFieldInvalid(formName: 'profile' | 'password', fieldName: string): boolean {
        const form = formName === 'profile' ? this.profileForm : this.passwordForm;
        const field = form.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getErrorMessage(formName: 'profile' | 'password', fieldName: string): string {
        const form = formName === 'profile' ? this.profileForm : this.passwordForm;
        const field = form.get(fieldName);

        if (field?.hasError('required')) {
            return 'Este campo es requerido';
        }
        if (field?.hasError('email')) {
            return 'Email no válido';
        }
        if (field?.hasError('minlength')) {
            const minLength = field.getError('minlength').requiredLength;
            return `Mínimo ${minLength} caracteres`;
        }
        if (field?.hasError('pattern')) {
            return 'Debe contener mayúscula, minúscula y número';
        }
        if (field?.hasError('passwordMismatch')) {
            return 'Las contraseñas no coinciden';
        }

        return '';
    }


    togglePassword(field: 'current' | 'new' | 'confirm') {
        if (field === 'current') this.showCurrentPassword = !this.showCurrentPassword;
        if (field === 'new') this.showNewPassword = !this.showNewPassword;
        if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
    }
}
