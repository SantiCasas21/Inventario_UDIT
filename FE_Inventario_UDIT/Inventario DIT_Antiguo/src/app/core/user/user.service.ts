import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { User } from 'app/core/user/user.types';

@Injectable({ providedIn: 'root' })
export class UserService {
  private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
  private _currentUser: User | null = null;

  /** Setter & getter for user */
  set user(value: User | null) {
    this._currentUser = value;
    if (value) {
      this._user.next(value);
    }
  }

  get currentUser(): User | null {
    return this._currentUser;
  }

  get user$(): Observable<User> {
    return this._user.asObservable();
  }

  hasRole(roles: string | string[]): boolean {
    if (!this._currentUser || !this._currentUser.role) {
      return false;
    }
    const userRole = this._currentUser.role.toLowerCase();
    if (Array.isArray(roles)) {
      return roles.some(r => r.toLowerCase() === userRole);
    }
    return userRole === roles.toLowerCase();
  }

  /** Update user data locally */
  update(userData: Partial<User>): void {
    this._user.next(userData as User);
  }
}
