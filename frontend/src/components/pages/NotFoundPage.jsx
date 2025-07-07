import PageLayout from "../components/layouts/PageLayout";
import Button from "../components/ui/Button";
import { ROUTES } from "../components/constants/routes";

const NotFoundPage = () => {
  return (
    <PageLayout>
      <div className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-slate-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The requested page does not exist
          </p>
          <Button to={ROUTES.HOME}>Return to Home</Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFoundPage;