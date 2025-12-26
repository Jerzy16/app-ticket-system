import { Injectable } from '@angular/core';
import {
    faArrowDown,
    faArrowUp,
    faBars,
    faBell,
    faCalendar,
    faChartLine,
    faCheck,
    faChevronRight,
    faCircle,
    faCircleNotch,
    faClose,
    faDotCircle,
    faEdit,
    faEye,
    faEyeSlash,
    faHammer,
    faHome,
    faList,
    faMinus,
    faOutdent,
    faPlus,
    faSave,
    faSearch,
    faStar,
    faTrash,
    faUser,
    faUsersGear,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

@Injectable({
    providedIn: 'root',
})
export class IconService {
    icons: { [key: string]: IconDefinition } = {
        close: faClose,
        edit: faEdit,
        delete: faTrash,
        eye: faEye,
        'eye-slash': faEyeSlash,
        plus: faPlus,
        check: faCheck,
        circle: faCircle,
        'dot-circle': faDotCircle,
        search: faSearch,
        save: faSave,
        loading: faCircleNotch,
        bars: faBars,
        home: faHome,
        'chevron-right': faChevronRight,
        star: faStar,
        list: faList,
        outdent: faOutdent,
        bell: faBell,
        hammer: faHammer,
        'users-gear': faUsersGear,
        'chart-line': faChartLine,
        calendar: faCalendar,
        user: faUser,
        'arrow-down': faArrowDown,
        'arrow-up': faArrowUp,
        minus: faMinus
    };

    getIcon(name: string): IconDefinition {
        return this.icons[name] || faCircle;
    }
}
