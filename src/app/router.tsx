import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "./layout/MainLayout";

import { POSPage } from "./pages/pos/POSPage";
import { KitchenPage } from "./pages/kitchen/KitchenPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";
import { ProductsManager } from "./pages/admin/ProductsManager";
import { CategoriesManager } from "./pages/admin/CategoriesManager";
import { CashClose } from "./pages/admin/CashClose";
import { UsersManager } from "./pages/admin/UsersManager";
import { FlavorsManager } from "./pages/admin/FlavorsManager";
import { SizesManager } from "./pages/admin/SizesManager";
import { IngredientsManager } from "./pages/admin/IngredientsManager";
import { CombosManager } from "./pages/admin/CombosManager";
import { AccompanimentsManager } from "./pages/admin/AccompanimentsManager";
import { RulesManager } from "./pages/admin/RulesManager";

const LoginPage = () => <div>Login</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: "pos", element: <POSPage /> },
      { path: "kitchen", element: <KitchenPage /> },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "products", element: <ProductsManager /> },
          { path: "categories", element: <CategoriesManager /> },
          { path: "orders", element: <CashClose /> },
          { path: "users", element: <UsersManager /> },
          { path: "flavors", element: <FlavorsManager /> },
          { path: "sizes", element: <SizesManager /> },
          { path: "ingredients", element: <IngredientsManager /> },
          { path: "combos", element: <CombosManager /> },
          { path: "accompaniments", element: <AccompanimentsManager /> },
          { path: "rules", element: <RulesManager /> },
        ]
      }
    ],
  },
]);
