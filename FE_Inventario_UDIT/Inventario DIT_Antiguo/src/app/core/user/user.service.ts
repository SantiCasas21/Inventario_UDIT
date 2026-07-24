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

  /** Update user data locally */
  update(userData: Partial<User>): void {
    this._user.next(userData as User);
  }
}
