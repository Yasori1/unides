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
import { CorporateLoginComponent } from './pages/corporate-login/corporate-login';
import { CommunityLoginComponent } from './pages/community-login/community-login';
import { CorporateRegisterComponent } from './pages/corporate-register/corporate-register';
import { CommunityRegisterComponent } from './pages/community-register/community-register';
import { DevelopersPageComponent } from './pages/developers-page/developers-page.component';
import { CorporateDashboardComponent } from './pages/corporate-dashboard/corporate-dashboard';
import { AnnouncementsPageComponent } from './pages/announcements-page/announcements-page.component';
import { AnnouncementDetailComponent } from './pages/announcement-detail/announcement-detail.component';
import { StudentLoginComponent } from './pages/student-login/student-login.component';
import { StudentProfileComponent } from './pages/student-profile/student-profile.component';
import { CommunityDetailComponent } from './pages/community-detail/community-detail.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { CommunityDashboardComponent } from './pages/community-dashboard/community-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  // Ana Sayfalar
  { path: 'developers', component: DevelopersPageComponent },
  { path: 'communities', component: CommunitiesPageComponent },
  { path: 'communities/:id', component: CommunityDetailComponent },
  { path: 'events', component: EventsComponent },
  { path: 'announcements', component: AnnouncementsPageComponent },
  { path: 'announcements/:id', component: AnnouncementDetailComponent },

  { path: 'about', component: AboutPageComponent },
  { path: 'team', component: TeamPageComponent },
  { path: 'faq', component: FaqPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'privacy-policy', component: PrivacyPolicyPageComponent },
  { path: 'terms-conditions', component: TermsConditionsPageComponent },

  // --- LOGIN & REGISTER ROTALARI ---
  { path: 'login', component: ComingSoonComponent, data: { title: 'Giriş Yap' } },
  { path: 'corporate-login', component: CorporateLoginComponent },
  { path: 'community-login', component: CommunityLoginComponent },

  { path: 'register', component: ComingSoonComponent, data: { title: 'Kayıt Ol' } },
  { path: 'corporate-register', component: CorporateRegisterComponent },
  { path: 'community-register', component: CommunityRegisterComponent },

  { path: 'coming-soon', component: ComingSoonComponent, data: { title: 'Bu Sayfa' } },

  // ŞİFRE SIFIRLAMA
  { path: 'reset-password', component: ResetPasswordComponent },

  // KURUMSAL DASHBOARD
  { path: 'corporate-dashboard', component: CorporateDashboardComponent },
  // TOPLULUK DASHBOARD
  { path: 'community-dashboard', component: CommunityDashboardComponent },

  // ÖĞRENCİ GİRİŞ SONRASI SAYFA
  // { path: 'student-login', component: StudentLoginComponent },
  // { path: 'profile', component: StudentProfileComponent },

  // Admin Dashboard (Eski/Mevcut)
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

  { path: '**', component: ErrorPageComponent },
];