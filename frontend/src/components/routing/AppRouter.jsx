import { Routes, Route } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import TubifyLanding from "../pages/TubifyLanding";
import AuthPage from "../Auth/AuthPage";
import HelpCenter from "../pages/HelpCenter";
import AboutUs from "../pages/AboutUs";
import ProtectedRoute from "../Auth/ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import VideoEditorAppPage from "../pages/VideoEditorAppPage";
import LoadingScreen from "../common/LoadingScreen";
import TermsOfUsePage from "../pages/TermsOfUsePage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import { ROUTES } from "../constants/routes";

const AppRouter = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<TubifyLanding />} />
      <Route path={ROUTES.AUTH} element={<AuthPage />} />
      <Route path={ROUTES.HELP_CENTER} element={<HelpCenter />} />
      <Route path={ROUTES.ABOUT_US} element={<AboutUs />} />

      <Route
        path={ROUTES.APP}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VIDEO_MAKER}
        element={
          <ProtectedRoute>
            <VideoEditorAppPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <div>Profile Page - Coming Soon</div>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SETTINGS}
        element={
          <ProtectedRoute>
            <div>Settings Page - Coming Soon</div>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.UPGRADE}
        element={
          <ProtectedRoute>
            <div>Upgrade Page - Coming Soon</div>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.FEATURES}
        element={<div>Features Page - Coming Soon</div>}
      />
      <Route
        path={ROUTES.PRICING}
        element={<div>Pricing Page - Coming Soon</div>}
      />
      <Route path={ROUTES.TERMS_OF_USE} element={<TermsOfUsePage />} />
      <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicyPage />} />

      <Route path={ROUTES.NOT_FOUND} element={<TubifyLanding />} />
    </Routes>
  );
};

export default AppRouter;
