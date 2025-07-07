import PageLayout from "../layouts/PageLayout";

const LoadingSpinner = () => {
  return (
    <PageLayout>
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    </PageLayout>
  );
};

export default LoadingSpinner;
