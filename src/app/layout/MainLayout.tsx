import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <div className="app-container">
      <main>
        <Outlet />
      </main>
    </div>
  );
};
