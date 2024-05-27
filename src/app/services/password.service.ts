import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { ActivatedRoute, Router } from '@angular/router';
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  firestore = inject(FirestoreService);
  newPassword!: string;
  actionCode = this.getParameterByName('oobCode');
  continueUrl = this.getParameterByName('continueUrl');
  lang = this.getParameterByName('lang') || 'en';
  constructor(private route: ActivatedRoute, private router: Router) { }


  /**
 * Retrieves the value of a URL parameter with the specified name.
 * 
 * @param name The name of the URL parameter to retrieve.
 * @returns The value of the URL parameter if found, or null if not found.
 */
  getParameterByName(name: string): string | null {
    return this.route.snapshot.queryParamMap.get(name) || null;
  }


  /**
   * This function updates the new password to the user.
   * @param code 
   * @param newPassword 
   */
  updatePassword(code: any, newPassword: any) {

    confirmPasswordReset(this.firestore.auth, code, newPassword)
      .then(() => {
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);

      })
      .catch(function () {
        // Invalid code
      })
  }
}
