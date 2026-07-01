import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import CompanyPage from './pages/CompanyPage';
import LoginPage from './pages/LoginPage';
import ProductPage from './pages/ProductPage';
import SlugResolver from './components/SlugResolver/SlugResolver';
import EmailVerifyResult from './components/EmailVerification/EmailVerifyResult';

const routes = [
  { path: '/',                    element: HomePage,      exact: true },
  // Static routes first (highest priority)
  { path: '/login',               element: LoginPage },
  // Email verification result page (after clicking magic link)
  { path: '/verify-email-result', element: EmailVerifyResult },
  // Backward compatibility routes (old patterns - specific paths)
  { path: '/category/:city/:query', element: CategoryPage },
  { path: '/company/:id?',        element: CompanyPage },
  { path: '/product/:productId',  element: ProductPage },
  // New SEO-friendly routes (dynamic paths - must come after specific paths)
  { path: '/:city/:categorySlug', element: CategoryPage },
  // Catch-all for single-segment slugs (must be last)
  { path: '/:slug',              element: SlugResolver },
];

export default routes;