import React, { useEffect, lazy, Suspense } from 'react';
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserProvider } from "./contexts/UserContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Clarity from "@microsoft/clarity";
import { ErrorBoundary } from "./Components/ErrorBoundary";
import { PageSkeleton } from "./Components/Loading";

// Providers
import { SessionProvider } from "./contexts/SessionContext";
import { CalendarProvider } from "./contexts/CalendarContext";
import { UploadProvider } from './contexts/UploadContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Router guards
import { ProtectedRoute } from "./router/ProtectedRoute";
import { AdminProtectedRoute } from "./router/AdminProtectedRoute";

// Layout (small — keep static)
import { Layout } from "./Pages/CRM/Layout";

// Auth pages (small, needed early — keep static)
import { Login } from "./Pages/Auth/Login";
import { Signup } from "./Pages/Auth/Signup";
import { ForgotPassword } from "./Pages/Auth/ForgotPassword";
import { ResetPassword } from "./Pages/Auth/ResetPassword";
import { HomeRoute } from "./router/HomeRoute";

// Lazy-loaded pages
const Onboarding         = lazy(() => import('./Pages/Onboarding/Onboarding').then(m => ({ default: m.Onboarding })));
const Dashboard          = lazy(() => import('./Pages/CRM/Dashboard').then(m => ({ default: m.Dashboard })));
const Calendar           = lazy(() => import('./Pages/CRM/Calendar/Calendar').then(m => ({ default: m.Calendar })));
const Leads              = lazy(() => import('./Pages/CRM/Leads/Leads').then(m => ({ default: m.Leads })));
const LeadDetailPage     = lazy(() => import('./Pages/CRM/Leads/LeadDetailPage').then(m => ({ default: m.LeadDetailPage })));
const Projects           = lazy(() => import('./Pages/CRM/Project/Projects').then(m => ({ default: m.Projects })));
const ProjectDetail      = lazy(() => import('./Pages/CRM/Project/ProjectDetail').then(m => ({ default: m.ProjectDetail })));
const ProjectGalleryPage = lazy(() => import('./Pages/CRM/Project/ProjectGalleryPage').then(m => ({ default: m.ProjectGalleryPage })));
const Clients            = lazy(() => import('./Pages/CRM/Clients/Clients').then(m => ({ default: m.Clients })));
const StudioEditor       = lazy(() => import('./Pages/CRM/Leads/forms/StudioEditor').then(m => ({ default: m.StudioEditor })));
const StudioProfile      = lazy(() => import('./Pages/CRM/StudioProfile').then(m => ({ default: m.StudioProfile })));
const AccountsOverview   = lazy(() => import('./Pages/CRM/Accounts/AccountsOverview').then(m => ({ default: m.AccountsOverview })));
const PaymentDues        = lazy(() => import('./Pages/CRM/Accounts/PaymentDues').then(m => ({ default: m.PaymentDues })));
const ExpensesList       = lazy(() => import('./Pages/CRM/Accounts/ExpensesList').then(m => ({ default: m.ExpensesList })));
const ProfitLoss         = lazy(() => import('./Pages/CRM/Accounts/ProfitLoss').then(m => ({ default: m.ProfitLoss })));
const Crew               = lazy(() => import('./Pages/CRM/Crew/Crew').then(m => ({ default: m.Crew })));
const Inventory          = lazy(() => import('./Pages/CRM/Inventory/Inventory').then(m => ({ default: m.Inventory })));
const Gallery            = lazy(() => import('./Pages/CRM/Gallery/Gallery').then(m => ({ default: m.Gallery })));
const Templates          = lazy(() => import('./Pages/CRM/Templates/Templates').then(m => ({ default: m.Templates })));
const TemplateEditor     = lazy(() => import('./Pages/CRM/Templates/TemplateEditor').then(m => ({ default: m.TemplateEditor })));
const PricingSetup       = lazy(() => import('./Pages/CRM/Pricing/PricingSetup').then(m => ({ default: m.PricingSetup })));
const CreateQuotation    = lazy(() => import('./Pages/CRM/Leads/CreateQuotation').then(m => ({ default: m.CreateQuotation })));
const CreateContract     = lazy(() => import('./Pages/CRM/Leads/CreateContract').then(m => ({ default: m.CreateContract })));
const HelpCentre         = lazy(() => import('./Pages/CRM/Helpcenter/Helpcenter').then(m => ({ default: m.HelpCentre })));
const KnowledgeBase      = lazy(() => import('./Pages/CRM/Helpcenter/HelpKnowledge'));
const MyTickets          = lazy(() => import('./Pages/CRM/Helpcenter/MyTickets'));
const InviteFlow         = lazy(() => import('./Pages/CRM/Crew/CrewAccept'));
const SuperAdminDashboard = lazy(() => import('./Pages/SuperAdmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const TicketsPage        = lazy(() => import('./Pages/SuperAdmin/TicketsPage').then(m => ({ default: m.TicketsPage })));
const StudioDetailPage   = lazy(() => import('./Pages/SuperAdmin/StudioDetailPage').then(m => ({ default: m.StudioDetailPage })));

// Public pages (lazy — rarely visited by logged-in users)
const PublicLeadForm        = lazy(() => import('./Pages/Public/LeadForm').then(m => ({ default: m.LeadForm })));
const PublicGallery         = lazy(() => import('./Pages/Public/PublicGallery').then(m => ({ default: m.PublicGallery })));
const FoundingStudioOnboard = lazy(() => import('./Pages/Public/FoundingStudioOnboard').then(m => ({ default: m.FoundingStudioOnboard })));
const ConfirmQuotation      = lazy(() => import('./Pages/Public/ConfirmQuotation'));
const QuotationConfirmed    = lazy(() => import('./Pages/Public/QuotationConfirmed'));
const QuotationRejected     = lazy(() => import('./Pages/Public/QuotationRejected'));
const OurStory              = lazy(() => import('./Pages/Landing/OurStoriesSection'));
const PrivacyPolicy         = lazy(() => import('./Pages/Landing/PrivacyPolicy'));
const TermsAndConditions    = lazy(() => import('./Pages/Landing/TermsAndConditions'));
const CookiePolicy          = lazy(() => import('./Pages/Landing/CookiePolicy'));
const DataDeletion          = lazy(() => import('./Pages/Landing/DataDeletion'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "984680497806-nrmbkqmeueibrglvvo2197oig1ila2qo.apps.googleusercontent.com";

function AppProviders({ children }) {
  return (
    <UserProvider>
      <SubscriptionProvider>
        <UploadProvider>
          <SessionProvider>
            <CalendarProvider>
              {children}
            </CalendarProvider>
          </SessionProvider>
        </UploadProvider>
      </SubscriptionProvider>
    </UserProvider>
  );
}

function AppRoutes() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<ProtectedRoute requireOnboardingComplete={false}><Onboarding /></ProtectedRoute>} />

          {/* SuperAdmin */}
          <Route path="/superadmin" element={<AdminProtectedRoute><SuperAdminDashboard /></AdminProtectedRoute>} />
          <Route path="/superadmin/tickets" element={<AdminProtectedRoute><TicketsPage /></AdminProtectedRoute>} />
          <Route path="/superadmin/studios/:refNo" element={<AdminProtectedRoute><StudioDetailPage /></AdminProtectedRoute>} />

          {/* Public */}
          <Route path="/gallery/:slug" element={<PublicGallery />} />
          <Route path="/:studioName/leadform" element={<PublicLeadForm />} />
          <Route path="/foundingStudioOnboard" element={<FoundingStudioOnboard />} />
          <Route path="/confirm-quotation/:leadId/quotation" element={<ConfirmQuotation />} />
          <Route path="/quotation-confirmed" element={<QuotationConfirmed />} />
          <Route path="/quotation-rejected" element={<QuotationRejected />} />
          <Route path="/invite" element={<InviteFlow />} />

          {/* Protected CRM */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/form" element={<StudioEditor />} />
            <Route path="/leads/:leadId" element={<LeadDetailPage />} />
            <Route path="/leads/:leadId/quotation-create" element={<CreateQuotation />} />
            <Route path="/leads/:leadId/quotation/:quotationId/edit" element={<CreateQuotation />} />
            <Route path="/leads/:leadId/quotation/:quotationId/convert-to-contract" element={<CreateContract />} />
            <Route path="/leads/:leadId/contract-create" element={<CreateContract />} />
            <Route path="/forms" element={<StudioEditor />} />
            <Route path="/project" element={<Projects />} />
            <Route path="/project/:projectId" element={<ProjectDetail />} />
            <Route path="/project/:projectId/gallery" element={<ProjectGalleryPage />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/crew" element={<Crew />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/gallery/:eventId" element={<Gallery />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/accounts" element={<Navigate to="/accounts/overview" replace />} />
            <Route path="/accounts/overview" element={<AccountsOverview />} />
            <Route path="/accounts/paymentdues" element={<PaymentDues />} />
            <Route path="/accounts/expenses" element={<ExpensesList />} />
            <Route path="/accounts/profit-loss" element={<ProfitLoss />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/:id/edit" element={<TemplateEditor />} />
            <Route path="/pricing" element={<PricingSetup />} />
            <Route path="/studio/profile" element={<StudioProfile />} />
            <Route path="/helpcenter" element={<HelpCentre />} />
            <Route path="/helpcenter/knowledge/:id" element={<KnowledgeBase />} />
            <Route path="/my-tickets" element={<MyTickets />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  useEffect(() => {
    const projectID = import.meta.env.VITE_PROJECT_ID;
    if (projectID) Clarity.init(projectID);
  }, []);

  const routes = (
    <Router>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </Router>
  );

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {routes}
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
