import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedServiceService {

  private selectedUserIdSource = new BehaviorSubject<string>('');
  selectedUserId$ = this.selectedUserIdSource.asObservable();

  setSelectedUserId(userId: string){
    this.selectedUserIdSource.next(userId);
  }
}
