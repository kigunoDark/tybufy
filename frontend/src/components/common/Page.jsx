import PageLayout from "../layouts/PageLayout";
import { usePage } from "../hooks/usePage";

const Page = ({
  children,
  title,
  description,
  className = "",
  showContainer = true,
}) => {
  usePage(title, description);

  const content = showContainer ? (
    <div className="container mx-auto px-4 py-8">{children}</div>
  ) : (
    children
  );

  return <PageLayout className={className}>{content}</PageLayout>;
};

export default Page;
