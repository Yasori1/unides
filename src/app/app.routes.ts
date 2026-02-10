import { Routes } from '@angular/router';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { TeamPageComponent } from './pages/team-page/team-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { ComingSoonComponent } from './pages/coming-soon/coming-soon.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { TermsConditionsPageComponent } from './pages/terms-conditions-page/terms-conditions-page.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { DashboardComponent } from './admin-dashboard/dashboard/dashboard.component';
import { MyListingsComponent } from './admin-dashboard/my-listings/my-listings.component';
import { BookingsComponent } from './admin-dashboard/bookings/bookings.component';
import { ReviewsComponent } from './admin-dashboard/reviews/reviews.component';
import { BookmarksComponent } from './admin-dashboard/bookmarks/bookmarks.component';
import { InvoicesComponent } from './admin-dashboard/invoices/invoices.component';
import { AddListingComponent } from './admin-dashboard/add-listing/add-listing.component';
import { MyProfileComponent } from './admin-dashboard/my-profile/my-profile.component';
import { EmailsComponent } from './admin-dashboard/emails/emails.component';
import { MessagesComponent } from './admin-dashboard/messages/messages.component';
import { ToDoListComponent } from './admin-dashboard/to-do-list/to-do-list.component';
import { EmailReadComponent } from './admin-dashboard/email-read/email-read.component';
import { EmailComposeComponent } from './admin-dashboard/email-compose/email-compose.component';
import { CommunitiesPageComponent } from './pages/communities-page/communities-page.component';
import { EventsComponent } from './pages/events-page/events.component';
import { EventsDetailComponent } from './pages/events-detail/events-detail.component';
import { CorporateLoginComponent } from './pages/corporate-login/corporate-login';
import { CommunityLoginComponent } from './pages/community-login/community-login';
import { CorporateRegisterComponent } from './pages/corporate-register/corporate-register';
import { CommunityRegisterComponent } from './pages/community-register/community-register';
import { DevelopersPageComponent } from './pages/developers-page/developers-page.component';
import { CorporateDashboardComponent } from './pages/corporate-dashboard/corporate-dashboard.component';
import { AnnouncementsPageComponent } from './pages/announcements-page/announcements-page.component';
import { AnnouncementDetailComponent } from './pages/announcement-detail/announcement-detail.component';
import { StudentLoginComponent } from './pages/student-login/student-login.component';
import { StudentProfileComponent } from './pages/student-profile/student-profile.component';
import { CommunityDetailComponent } from './pages/community-detail/community-detail.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { CommunityDashboardComponent } from './pages/community-dashboard/community-dashboard.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { KvkkPageComponent } from './pages/kvkk-page/kvkk-page.component';
import { EmailVerificationWaitingComponent } from './pages/email-verification/email-verification-waiting.component';
import { EmailVerificationConfirmComponent } from './pages/email-verification/email-verification-confirm.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  // Ana Sayfalar
  { path: 'developers', component: DevelopersPageComponent },
  { path: 'communities', component: CommunitiesPageComponent },
  { path: 'communities/:id', component: CommunityDetailComponent },
  { path: 'events', component: EventsComponent },
  { path: 'events/:id', component: EventsDetailComponent },
  { path: 'announcements', component: AnnouncementsPageComponent },
  { path: 'announcements/:id', component: AnnouncementDetailComponent },

  { path: 'about', component: AboutPageComponent },
  { path: 'team', component: TeamPageComponent },
  { path: 'faq', component: FaqPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'privacy-policy', component: PrivacyPolicyPageComponent },
  { path: 'terms-conditions', component: TermsConditionsPageComponent },
  { path: 'kvkk', component: KvkkPageComponent },

  // --- LOGIN & REGISTER ROTALARI ---
  // Sadece Topluluk Girişi ve Kurumsal Giriş aktif. Öğrenci Girişi/Kayıt/Dashboard şu an kapalı (ileride açılabilir).
  // { path: 'login', component: LoginPageComponent },
  { path: 'login', redirectTo: '/', pathMatch: 'full' },
  { path: 'corporate-login', component: CorporateLoginComponent },
  { path: 'community-login', component: CommunityLoginComponent },

  // Topluluk Kaydı açık (3 adımlı: e-posta/şifre → doğrulama → topluluk bilgileri)
  { path: 'community-register', component: CommunityRegisterComponent },

  // Backend GET verify-email topluluk başkanını buraya yönlendirir (/create-community?setupToken=...)
  { path: 'create-community', component: CommunityRegisterComponent },

  // Kayıt: Sadece Topluluk Kaydı açık (/register ve /community-register)
  { path: 'register', component: CommunityRegisterComponent },

  // Kurumsal kayıt: Bakanlık yetkilisi tarafından yönetilir
  { path: 'corporate-register', component: ComingSoonComponent, data: { title: 'Kurumsal Kayıt' } },

  // Öğrenci giriş/kayıt şu an çalışmayacak (ileride açılabilir)
  { path: 'student-register', redirectTo: '/', pathMatch: 'full' },
  // { path: 'register', component: RegisterPageComponent },
  // { path: 'community-register', component: ComingSoonComponent },

  { path: 'coming-soon', component: ComingSoonComponent, data: { title: 'Bu Sayfa' } },

  // ŞİFRE SIFIRLAMA
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // E-POSTA DOĞRULAMA (mail linki: /verify-email?token=...)
  { path: 'email-verification-waiting', component: EmailVerificationWaitingComponent },
  { path: 'verify-email', component: EmailVerificationConfirmComponent },
  { path: 'email-verification-confirm', component: EmailVerificationConfirmComponent },

  // KURUMSAL DASHBOARD
  {
    path: 'corporate-dashboard',
    component: CorporateDashboardComponent,
    canActivate: [roleGuard],
    data: { expectedRole: 'corporate' },
  },
  // TOPLULUK DASHBOARD
  {
    path: 'community-dashboard',
    component: CommunityDashboardComponent,
    canActivate: [roleGuard],
    data: { expectedRole: 'community' },
  },

  // ÖĞRENCİ DASHBOARD - Şu an çalışmayacak (ileride açılabilir)
  { path: 'student-dashboard', redirectTo: '/', pathMatch: 'full' },
  { path: 'profile', redirectTo: '/', pathMatch: 'full' },
  // (Eski route'lar yorum satırında)
  // {
  //   path: 'student-dashboard',
  //   component: StudentProfileComponent,
  //   canActivate: [roleGuard],
  //   data: { expectedRole: 'student' }
  // },
  // {
  //   path: 'profile',
  //   component: StudentProfileComponent,
  //   canActivate: [roleGuard],
  //   data: { expectedRole: 'student' }
  // },

  // Admin Dashboard (Eski/Mevcut)
  /*
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'my-listings', component: MyListingsComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: 'reviews', component: ReviewsComponent },
      { path: 'bookmarks', component: BookmarksComponent },
      { path: 'invoices', component: InvoicesComponent },
      { path: 'add-listing', component: AddListingComponent },
      { path: 'emails', component: EmailsComponent },
      { path: 'email-read', component: EmailReadComponent },
      { path: 'email-compose', component: EmailComposeComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'to-do-list', component: ToDoListComponent },
      { path: 'my-profile', component: MyProfileComponent },
    ],
  },
  */

  { path: '**', component: ErrorPageComponent },
];
