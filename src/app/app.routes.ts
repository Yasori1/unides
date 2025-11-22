import { Routes } from '@angular/router';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { HomeComponent } from './pages/home/home.component';
import { HomeDemoTwoComponent } from './demos/home-demo-two/home-demo-two.component';
import { HomeDemoThreeComponent } from './demos/home-demo-three/home-demo-three.component';
import { HomeDemoFourComponent } from './demos/home-demo-four/home-demo-four.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { TeamPageComponent } from './pages/team-page/team-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { HowItWorksPageComponent } from './pages/how-it-works-page/how-it-works-page.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { ShopPageComponent } from './pages/shop-page/shop-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout-page/checkout-page.component';
import { ProductDetailsPageComponent } from './pages/product-details-page/product-details-page.component';
import { BlogGridPageComponent } from './pages/blog-grid-page/blog-grid-page.component';
import { BlogRightSidebarPageComponent } from './pages/blog-right-sidebar-page/blog-right-sidebar-page.component';
import { BlogLeftSidebarPageComponent } from './pages/blog-left-sidebar-page/blog-left-sidebar-page.component';
import { BlogDetailsPageComponent } from './pages/blog-details-page/blog-details-page.component';
import { BlogDetailsPage2Component } from './pages/blog-details-page2/blog-details-page2.component';
import { BlogDetailsPage3Component } from './pages/blog-details-page3/blog-details-page3.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { CategoriesPageComponent } from './pages/categories-page/categories-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { TermsConditionsPageComponent } from './pages/terms-conditions-page/terms-conditions-page.component';
import { ListingsPage1Component } from './pages/listings-page1/listings-page1.component';
import { ListingsPage2Component } from './pages/listings-page2/listings-page2.component';
import { ListingsPage3Component } from './pages/listings-page3/listings-page3.component';
import { ListingsPage4Component } from './pages/listings-page4/listings-page4.component';
import { ListingsPage5Component } from './pages/listings-page5/listings-page5.component';
import { ListingDetailsComponent } from './pages/listing-details/listing-details.component';
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
// Etkinlikler Component Importu
import { EventsComponent } from './pages/events-page/events.component';


export const routes: Routes = [
    {path: '', component: HomeComponent},
    // {path: 'index-2', component: HomeDemoTwoComponent},
    // {path: 'index-3', component: HomeDemoThreeComponent},
    // {path: 'index-4', component: HomeDemoFourComponent},
    {path: 'about', component: AboutPageComponent},
    {path: 'team', component: TeamPageComponent},
    {path: 'communities', component: CommunitiesPageComponent},
    
    // --- DÜZELTİLEN KISIM: Events rotası burada olmalı ---
    {path: 'events', component: EventsComponent },
    // -----------------------------------------------------

    // {path: 'how-it-works', component: HowItWorksPageComponent},
    // {path: 'categories', component: CategoriesPageComponent},
    // {path: 'listings', component: ListingsPage1Component},
    // {path: 'listings-2', component: ListingsPage2Component},
    // {path: 'listings-3', component: ListingsPage3Component},
    // {path: 'listings-4', component: ListingsPage4Component},
    // {path: 'listings-5', component: ListingsPage5Component},
    // {path: 'listing-details', component: ListingDetailsComponent},
    {path: 'faq', component: FaqPageComponent},
    {path: 'login', component: LoginPageComponent},
    {path: 'register', component: RegisterPageComponent},
    // {path: 'shop', component: ShopPageComponent},
    // {path: 'cart', component: CartPageComponent},
    // {path: 'checkout', component: CheckoutPageComponent},
    // {path: 'product-details', component: ProductDetailsPageComponent},
    // {path: 'blog-grid', component: BlogGridPageComponent},
    // {path: 'blog-right-sidebar', component: BlogRightSidebarPageComponent},
    // {path: 'blog-left-sidebar', component: BlogLeftSidebarPageComponent},
    // {path: 'blog-details', component: BlogDetailsPageComponent},
    // {path: 'blog-details-2', component: BlogDetailsPage2Component},
    // {path: 'blog-details-3', component: BlogDetailsPage3Component},
    {path: 'privacy-policy', component: PrivacyPolicyPageComponent},
    {path: 'terms-conditions', component: TermsConditionsPageComponent},
    {path: 'contact', component: ContactPageComponent},
    {
        path: 'dashboard',
        component: AdminDashboardComponent,
        children: [
            {path: '', component: DashboardComponent},
            {path: 'my-listings', component: MyListingsComponent},
            {path: 'bookings', component: BookingsComponent},
            {path: 'reviews', component: ReviewsComponent},
            {path: 'bookmarks', component: BookmarksComponent},
            {path: 'invoices', component: InvoicesComponent},
            {path: 'add-listing', component: AddListingComponent},
            {path: 'emails', component: EmailsComponent},
            {path: 'email-read', component: EmailReadComponent},
            {path: 'email-compose', component: EmailComposeComponent},
            {path: 'messages', component: MessagesComponent},
            {path: 'to-do-list', component: ToDoListComponent},
            {path: 'my-profile', component: MyProfileComponent},
            // Events buradan kaldırıldı
        ]
    },
    
    {path: '**', component: ErrorPageComponent} 
];