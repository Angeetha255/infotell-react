import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import routes from './routes';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LoginModal from './components/Login/LoginModal';
import { useSelector } from 'react-redux';

function App() {
  const isLoginOpen = useSelector((state) => state.ui.isLoginOpen);

  return (
    <Router>
      <div className="app-wrapper">
        <Header />
        <main className="main-content">
          <Routes>
            {routes.map(({ path, element: Element }) => (
              <Route key={path} path={path} element={<Element />} />
            ))}
          </Routes>
        </main>
        <Footer />
        {isLoginOpen && <LoginModal />}
      </div>
    </Router>
  );
}

export default App;
