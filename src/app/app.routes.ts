import { Routes } from '@angular/router';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { TeamPageComponent } from './pages/team-page/team-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { TermsConditionsPageComponent } from './pages/terms-conditions-page/terms-conditions-page.component';

// Admin Dashboard Importları
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

// --- ÖZEL SAYFALAR ---
import { EventsComponent } from './pages/events-page/events.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';

// DÜZELTME BURADA: Dosya adı 'community.component' olmalı


export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'about', component: AboutPageComponent },
    { path: 'team', component: TeamPageComponent },
    { path: 'communities', component: CommunitiesPageComponent },
    { path: 'contact', component: ContactPageComponent },
    { path: 'login', component: LoginPageComponent },
    { path: 'register', component: RegisterPageComponent },
    { path: 'privacy-policy', component: PrivacyPolicyPageComponent },
    { path: 'terms-conditions', component: TermsConditionsPageComponent },

    // --- ÖZEL SAYFALAR ROTALARI ---
    { path: 'events', component: EventsComponent },
    { path: 'sss', component: FaqPageComponent },
    
    // ------------------------------

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
        ]
    },
    
    { path: '**', component: ErrorPageComponent } 
];