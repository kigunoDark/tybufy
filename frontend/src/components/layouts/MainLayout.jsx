import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../common/Header";
import Footer from "../common/Footer";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isLoginPage = location.pathname === "/login";
  const isLandingPage = location.pathname === "/";

  const showMainLayer = !isLoginPage;

  const getBackgroundClass = () => {
    if (isLandingPage && !isAuthenticated) {
      return "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50";
    }
    return "";
  };

  return (
    <div className={`min-h-screen flex flex-col ${getBackgroundClass()}`}>
      {showMainLayer && <Header />}

      <main className={`flex-1 ${showMainLayer ? "" : ""}`}>{children}</main>

      {showMainLayer && <Footer />}
    </div>
  );
};

export default MainLayout;
