import React, { lazy, Suspense, useEffect } from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { PincodeProvider } from '@/context/PincodeContext';
import './setup-fetch';

// ── Always-loaded (critical layouts + not-found) ─────────────────────────────
import { CustomerLayout } from "./components/layout/CustomerLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ExecutiveLayout } from "./components/layout/ExecutiveLayout";
import { MerchantLayout } from "./components/layout/MerchantLayout";
import NotFound from '@/pages/not-found';

// ── Lazy-loaded pages (saves ~261 KiB on initial load) ───────────────────────
const LandingPage        = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage          = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ProductsPage       = lazy(() => import('./pages/customer/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage  = lazy(() => import('./pages/customer/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const BookVisitPage      = lazy(() => import('./pages/customer/BookVisitPage').then(m => ({ default: m.BookVisitPage })));
const AccountPage        = lazy(() => import('./pages/customer/AccountPage').then(m => ({ default: m.AccountPage })));
const WishlistPage       = lazy(() => import('./pages/customer/WishlistPage').then(m => ({ default: m.WishlistPage })));
const CartPage           = lazy(() => import('./pages/customer/CartPage').then(m => ({ default: m.CartPage })));
const PartnerWithUsPage  = lazy(() => import('./pages/customer/PartnerWithUsPage').then(m => ({ default: m.PartnerWithUsPage })));
const HowItWorksPage     = lazy(() => import('./pages/customer/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const FaqPage            = lazy(() => import('./pages/customer/FaqPage').then(m => ({ default: m.FaqPage })));
const ContactPage        = lazy(() => import('./pages/customer/ContactPage').then(m => ({ default: m.ContactPage })));
const LegalPage          = lazy(() => import('./pages/customer/LegalPage').then(m => ({ default: m.LegalPage })));

// Admin pages (only loaded when navigating to /admin/*)
const AdminDashboard             = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminCategoriesPage        = lazy(() => import('./pages/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })));
const AdminProductsPage          = lazy(() => import('./pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminBookingsPage          = lazy(() => import('./pages/admin/AdminBookingsPage').then(m => ({ default: m.AdminBookingsPage })));
const AdminCustomersPage         = lazy(() => import('./pages/admin/AdminCustomersPage').then(m => ({ default: m.AdminCustomersPage })));
const AdminExecutivesPage        = lazy(() => import('./pages/admin/AdminExecutivesPage').then(m => ({ default: m.AdminExecutivesPage })));
const AdminMerchantsPage         = lazy(() => import('./pages/admin/AdminMerchantsPage').then(m => ({ default: m.AdminMerchantsPage })));
const AdminAnalyticsPage         = lazy(() => import('./pages/admin/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage })));
const AdminPartnersPage          = lazy(() => import('./pages/admin/AdminPartnersPage').then(m => ({ default: m.AdminPartnersPage })));
const AdminContentPage           = lazy(() => import('./pages/admin/AdminContentPage').then(m => ({ default: m.AdminContentPage })));
const AdminOrdersPage            = lazy(() => import('./pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminBrandsCommissionPage  = lazy(() => import('./pages/admin/AdminBrandsCommissionPage').then(m => ({ default: m.AdminBrandsCommissionPage })));
const AdminPincodesPage          = lazy(() => import('./pages/admin/AdminPincodesPage').then(m => ({ default: m.AdminPincodesPage })));

// Executive & merchant pages
const ExecutiveVisits    = lazy(() => import('./pages/executive/ExecutiveVisits').then(m => ({ default: m.ExecutiveVisits })));
const MerchantProductsPage = lazy(() => import('./pages/merchant/MerchantProductsPage').then(m => ({ default: m.MerchantProductsPage })));
const MerchantOrdersPage   = lazy(() => import('./pages/merchant/MerchantOrdersPage').then(m => ({ default: m.MerchantOrdersPage })));

// Simple spinner shown while a lazy chunk loads
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function CustomerRoutes() {
  return (
    <CustomerLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/merchant/login" component={LoginPage} />
          <Route path="/merchant-login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/products/:id" component={ProductDetailPage} />
          <Route path="/book-visit" component={BookVisitPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/wishlist" component={WishlistPage} />
          <Route path="/home-visit-cart" component={CartPage} />
          <Route path="/partner" component={PartnerWithUsPage} />
          <Route path="/how-it-works" component={HowItWorksPage} />
          <Route path="/about" component={HowItWorksPage} />
          <Route path="/faq" component={FaqPage} />
          <Route path="/faqs" component={FaqPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/contact-us" component={ContactPage} />
          <Route path="/privacy">{() => <LegalPage type="privacy" />}</Route>
          <Route path="/terms">{() => <LegalPage type="terms" />}</Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </CustomerLayout>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/" component={AdminDashboard} />
          <Route path="/admin/bookings" component={AdminBookingsPage} />
          <Route path="/admin/customers" component={AdminCustomersPage} />
          <Route path="/admin/executives" component={AdminExecutivesPage} />
          <Route path="/admin/merchants" component={AdminMerchantsPage} />
          <Route path="/admin/analytics" component={AdminAnalyticsPage} />
          <Route path="/admin/partners" component={AdminPartnersPage} />
          <Route path="/admin/content" component={AdminContentPage} />
          <Route path="/admin/categories" component={AdminCategoriesPage} />
          <Route path="/admin/products" component={AdminProductsPage} />
          <Route path="/admin/orders" component={AdminOrdersPage} />
          <Route path="/admin/brands" component={AdminBrandsCommissionPage} />
          <Route path="/admin/pincodes" component={AdminPincodesPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AdminLayout>
  );
}

function MerchantRoutes() {
  return (
    <MerchantLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/merchant" component={MerchantProductsPage} />
          <Route path="/merchant/" component={MerchantProductsPage} />
          <Route path="/merchant/products" component={MerchantProductsPage} />
          <Route path="/merchant/orders" component={MerchantOrdersPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </MerchantLayout>
  );
}

function ExecutiveRoutes() {
  return (
    <ExecutiveLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/executive" component={ExecutiveVisits} />
          <Route path="/executive/" component={ExecutiveVisits} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ExecutiveLayout>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/*" component={AdminRoutes} />
      <Route path="/executive" component={ExecutiveRoutes} />
      <Route path="/executive/*" component={ExecutiveRoutes} />
      <Route path="/merchant/login" component={CustomerRoutes} />
      <Route path="/merchant-login" component={CustomerRoutes} />
      <Route path="/merchant" component={MerchantRoutes} />
      <Route path="/merchant/*" component={MerchantRoutes} />
      <Route component={CustomerRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PincodeProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <ScrollToTop />
                <AppRouter />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </PincodeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
