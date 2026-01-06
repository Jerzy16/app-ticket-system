import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconService } from '../../../shared/data-access/icon';
import { TeamService, TeamGroup, TeamMember } from '../services/team';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-staff',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
    templateUrl: './staff.html',
    styleUrls: ['./staff.css']
})
export class StaffComponent implements OnInit {
    private teamService = inject(TeamService);
    private iconService = inject(IconService);
    private fb = inject(FormBuilder);

    teamGroups: TeamGroup[] = [];
    filteredGroups: TeamGroup[] = [];
    isLoading = true;
    searchTerm = '';

    showModal = false;
    isEditMode = false;

    userForm!: FormGroup;

    positions = [
        'Jefe de Redes',
        'Coordinador de Operaciones',
        'Técnico de Campo',
        'Técnico de Instalaciones',
        'Técnico de Mantenimiento',
        'Soporte Técnico',
        'Operadora NOC'
    ];

    availableRoles = ['ADMIN', 'USER', 'TECH'];

    ngOnInit() {
        this.initForm();
        this.loadTeam();
    }

    initForm() {
        this.userForm = this.fb.group({
            id: [''],
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: [''],
            name: ['', [Validators.required, Validators.minLength(2)]],
            lastname: ['', [Validators.required, Validators.minLength(2)]],
            position: ['', Validators.required],
            photo: [''],
            roles: this.fb.group({
                ADMIN: [false],
                USER: [false],
                TECH: [false]
            })
        });
    }

    loadTeam() {
        this.isLoading = true;
        this.teamService.getTeam().subscribe({
            next: (data) => {
                this.teamGroups = Array.isArray(data) ? data : [];
                this.filteredGroups = this.teamGroups;
                this.isLoading = false;
                console.log('Equipo cargado:', this.teamGroups);
            },
            error: (error) => {
                console.error('Error al cargar el personal:', error);
                this.teamGroups = [];
                this.filteredGroups = [];
                this.isLoading = false;
            }
        });
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchTerm = input.value;

        if (!this.searchTerm.trim()) {
            this.filteredGroups = this.teamGroups;
            return;
        }

        if (!Array.isArray(this.teamGroups)) {
            this.filteredGroups = [];
            return;
        }

        const term = this.searchTerm.toLowerCase();
        this.filteredGroups = this.teamGroups.map(group => ({
            ...group,
            members: group.members.filter(member =>
                member.name.toLowerCase().includes(term) ||
                member.post.toLowerCase().includes(term)
            )
        })).filter(group => group.members.length > 0);
    }

    openAddModal() {
        this.isEditMode = false;
        this.userForm.reset();
        this.userForm.get('password')?.setValidators([
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
        ]);
        this.userForm.get('password')?.updateValueAndValidity();
        this.showModal = true;
    }

    openEditModal(member: TeamMember) {
        this.isEditMode = true;
        this.userForm.patchValue({
            id: member.id,
            username: '',
            email: '',
            name: member.name.split(' ')[0] || '',
            lastname: member.name.split(' ').slice(1).join(' ') || '',
            position: member.post,
            photo: member.photo
        });
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.userForm.reset();
    }

    onSubmit() {
        if (this.userForm.invalid) {
            Object.keys(this.userForm.controls).forEach(key => {
                this.userForm.get(key)?.markAsTouched();
            });
            return;
        }

        const formValue = this.userForm.value;
        const rolesGroup = formValue.roles;
        const selectedRoles = Object.keys(rolesGroup).filter(role => rolesGroup[role]);

        if (selectedRoles.length === 0) {
            alert('Debe seleccionar al menos un rol');
            return;
        }

        const userData = {
            id: formValue.id || undefined,
            username: formValue.username,
            email: formValue.email,
            password: formValue.password || undefined,
            name: formValue.name,
            lastName: formValue.lastname,
            position: formValue.position,
            photo: formValue.photo || null,
            roles: selectedRoles
        };

        if (this.isEditMode && !userData.password) {
            delete userData.password;
        }


        if (this.isEditMode) {
            this.teamService.updateUser(userData.id!, userData).subscribe({
                next: (response) => {
                    console.log('Usuario actualizado:', response);
                    toast.success('Usuario actualizado exitosamente');
                    this.closeModal();
                    this.loadTeam();
                },
                error: (error) => {
                    console.error('Error al actualizar usuario:', error);
                    const errorMessage = error.error?.message || 'Error al actualizar el usuario';
                    toast.error(errorMessage);
                }
            });
        } else {
            this.teamService.createUser(userData).subscribe({
                next: (response) => {
                    console.log('Usuario creado:', response);
                    toast.success('Usuario creado exitosamente');
                    this.closeModal();
                    this.loadTeam();
                },
                error: (error) => {
                    console.error('Error al crear usuario:', error);
                    const errorMessage = error.error?.message || 'Error al crear el usuario';
                    toast.error(errorMessage);
                }
            });
        }
    }

    deleteMember(member: TeamMember) {
        if (confirm(`¿Estás seguro de eliminar a ${member.name}?`)) {
            this.teamService.deleteUser(member.id).subscribe({
                next: () => {
                    this.loadTeam();
                },
                error: (error) => {
                    console.error('Error al eliminar usuario:', error);
                }
            });
        }
    }

    getIcon(name: string) {
        return this.iconService.getIcon(name);
    }

    getMemberCount(): number {
        if (!Array.isArray(this.teamGroups)) {
            return 0;
        }
        return this.teamGroups.reduce((sum, group) => sum + group.members.length, 0);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.userForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getErrorMessage(fieldName: string): string {
        const field = this.userForm.get(fieldName);
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
            if (fieldName === 'password') {
                return 'Debe contener mayúscula, minúscula y número';
            }
            return 'Formato no válido';
        }
        return '';
    }
}
