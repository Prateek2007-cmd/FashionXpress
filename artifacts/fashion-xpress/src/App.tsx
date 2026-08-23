import React, { useEffect } from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import './setup-fetch';

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Layouts
import { CustomerLayout } from "./components/layout/CustomerLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ExecutiveLayout } from "./components/layout/ExecutiveLayout";
import { MerchantLayout } from "./components/layout/MerchantLayout";

// Customer Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ProductsPage } from "./pages/customer/ProductsPage";
import { ProductDetailPage } from "./pages/customer/ProductDetailPage";
import { BookVisitPage } from "./pages/customer/BookVisitPage";
import { AccountPage } from "./pages/customer/AccountPage";
import { WishlistPage } from "./pages/customer/WishlistPage";
import { CartPage } from "./pages/customer/CartPage";
import { PartnerWithUsPage } from "./pages/customer/PartnerWithUsPage";
import { HowItWorksPage } from "./pages/customer/HowItWorksPage";
import { FaqPage } from "./pages/customer/FaqPage";
import { ContactPage } from "./pages/customer/ContactPage";
import { LegalPage } from "./pages/customer/LegalPage";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminBookingsPage } from "./pages/admin/AdminBookingsPage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
import { AdminExecutivesPage } from "./pages/admin/AdminExecutivesPage";
import { AdminMerchantsPage } from "./pages/admin/AdminMerchantsPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminPartnersPage } from "./pages/admin/AdminPartnersPage";
import { AdminContentPage } from "./pages/admin/AdminContentPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";

// Executive Pages
import { ExecutiveVisits } from "./pages/executive/ExecutiveVisits";

// Merchant Pages
import { MerchantProductsPage } from "./pages/merchant/MerchantProductsPage";
import { MerchantOrdersPage } from "./pages/merchant/MerchantOrdersPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function CustomerRoutes() {
  return (
    <CustomerLayout>
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
    </CustomerLayout>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
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
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function MerchantRoutes() {
  return (
    <MerchantLayout>
      <Switch>
        <Route path="/merchant" component={MerchantProductsPage} />
        <Route path="/merchant/" component={MerchantProductsPage} />
        <Route path="/merchant/products" component={MerchantProductsPage} />
        <Route path="/merchant/orders" component={MerchantOrdersPage} />
        <Route component={NotFound} />
      </Switch>
    </MerchantLayout>
  );
}

function ExecutiveRoutes() {
  return (
    <ExecutiveLayout>
      <Switch>
        <Route path="/executive" component={ExecutiveVisits} />
        <Route path="/executive/" component={ExecutiveVisits} />
        <Route component={NotFound} />
      </Switch>
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
      {/* Customer routes handle the base path and everything else not caught above */}
      <Route component={CustomerRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <ScrollToTop />
              <AppRouter />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
