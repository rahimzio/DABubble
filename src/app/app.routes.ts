import { Routes } from '@angular/router';
import { LogInComponent } from './log-in/log-in.component';
import { CreateAccountComponent } from './create-account/create-account.component';
import { SelectAvatarComponent } from './select-avatar/select-avatar.component';
import { ResetPasswortComponent } from './log-in/reset-passwort/reset-passwort.component';
import { NewPasswortComponent } from './log-in/reset-passwort/new-passwort/new-passwort.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ImprintComponent } from './imprint/imprint.component';
import { DataprotectionComponent } from './dataprotection/dataprotection.component';
import { ThreadComponent } from './dashboard/thread/thread.component';
import { UserMenuDialogComponent } from './dashboard/head-dashboard/user-menu-dialog/user-menu-dialog.component';
import { UserProfileDialogComponent } from './dashboard/head-dashboard/user-profile-dialog/user-profile-dialog.component';

export const routes: Routes = [
  { path: '', component: LogInComponent },
  { path: 'create-account', component: CreateAccountComponent },
  { path: 'select-avatar/:id', component: SelectAvatarComponent },
  { path: 'reset-password', component: ResetPasswortComponent },
  { path: 'new-password', component: NewPasswortComponent },
  { path: 'dashboard/:id', component: DashboardComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'dataprotection', component: DataprotectionComponent },
  { path: 'thread', component: ThreadComponent },
];
