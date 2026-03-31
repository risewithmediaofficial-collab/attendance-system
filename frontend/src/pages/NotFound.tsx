import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-card rounded-3xl px-10 py-12 text-center max-w-lg w-full">
        <h1 className="mb-4 text-5xl font-semibold mono-title">404</h1>
        <p className="mb-5 text-lg text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-foreground underline hover:text-foreground/80">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
