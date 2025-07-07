// src/components/layouts/MainLayout.js
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../common/Header";
import Footer from "../common/Footer";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isLoginPage = location.pathname === "/login";
  const isAuthPage = location.pathname === "/auth";
  const isLandingPage = location.pathname === "/";

  const showHeader = !isLoginPage && !isAuthPage;

  const getBackgroundClass = () => {
    if (isLandingPage && !isAuthenticated) {
      return "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50";
    }
    return "";
  };

  return (
    <div className={`min-h-screen flex flex-col ${getBackgroundClass()}`}>
      {showHeader && <Header />}

      <main className={`flex-1 ${showHeader ? "" : ""}`}>{children}</main>

      {showHeader && <Footer />}
    </div>
  );
};

export default MainLayout;
