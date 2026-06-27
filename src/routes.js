import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import CompanyPage from './pages/CompanyPage';
import LoginPage from './pages/LoginPage';
import ProductPage from './pages/ProductPage';

const routes = [
  { path: '/',           element: HomePage,    exact: true },
  { path: '/category',   element: CategoryPage },
  { path: '/company',    element: CompanyPage },
  { path: '/product',    element: ProductPage },
  { path: '/login',      element: LoginPage },
];

export default routes;
