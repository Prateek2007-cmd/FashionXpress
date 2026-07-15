import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AuthProvider } from '@/context/AuthContext';
import './setup-fetch';

// Layouts
import { CustomerLayout } from "./components/layout/CustomerLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ExecutiveLayout } from "./components/layout/ExecutiveLayout";

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

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminBookingsPage } from "./pages/admin/AdminBookingsPage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
import { AdminExecutivesPage } from "./pages/admin/AdminExecutivesPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminPartnersPage } from "./pages/admin/AdminPartnersPage";
import { AdminContentPage } from "./pages/admin/AdminContentPage";

// Executive Pages
import { ExecutiveVisits } from "./pages/executive/ExecutiveVisits";

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
        <Route path="/register" component={RegisterPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/products/:id" component={ProductDetailPage} />
        <Route path="/book-visit" component={BookVisitPage} />
        <Route path="/account" component={AccountPage} />
        <Route path="/wishlist" component={WishlistPage} />
        <Route path="/home-visit-cart" component={CartPage} />
        <Route path="/partner" component={PartnerWithUsPage} />
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
        <Route path="/admin/bookings" component={AdminBookingsPage} />
        <Route path="/admin/customers" component={AdminCustomersPage} />
        <Route path="/admin/executives" component={AdminExecutivesPage} />
        <Route path="/admin/analytics" component={AdminAnalyticsPage} />
        <Route path="/admin/partners" component={AdminPartnersPage} />
        <Route path="/admin/content" component={AdminContentPage} />
        <Route path="/admin/categories" component={AdminCategoriesPage} />
        <Route path="/admin/products" component={AdminProductsPage} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function ExecutiveRoutes() {
  return (
    <ExecutiveLayout>
      <Switch>
        <Route path="/executive" component={ExecutiveVisits} />
        {/* We will add more executive routes later */}
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
      {/* Customer routes handle the base path and everything else not caught above */}
      <Route component={CustomerRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
