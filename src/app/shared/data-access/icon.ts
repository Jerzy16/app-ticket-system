import { Injectable } from '@angular/core';
import {
  faBars,
  faBell,
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
  faOutdent,
  faPlus,
  faSave,
  faSearch,
  faStar,
  faTrash,
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
    'chart-line': faChartLine
  };

  getIcon(name: string): IconDefinition {
    return this.icons[name] || faCircle;
  }
}
