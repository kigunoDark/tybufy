import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./components/layouts/MainLayout";
import AppRouter from "./components/routing/AppRouter";
import ErrorBoundary from "./components/common/ErrorBoundary";
import NotificationSystem from "./components/NotificationSystem";
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <MainLayout>
            <AppRouter />
          </MainLayout>
          <NotificationSystem />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
