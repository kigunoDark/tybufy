const PageLayout = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${className}`}>
      {children}
    </div>
  );
};

export default PageLayout;