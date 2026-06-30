import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PopularTrending from '../PopularTrending/PopularTrending';
import FloatingDust from '../Effects/Canvas/FloatingDust';
import { apiService } from '../../services/api';
import './HomePage.css';

/* ── Helper: get currently selected city from Header dropdown ── */
function getSelectedCity() {
  const selectEl = document.querySelector('.location-box');
  if (selectEl && selectEl.value) {
    return selectEl.value;
  }
  return 'Madurai'; // fallback to first city
}

/* ── Components ── */
function HeroCarousel({ slides }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides]);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="home-carousel">
      {slides.map((slide, i) => (
        <div key={i} className={`carousel-slide${i === current ? ' active' : ''}`}>
          <img src={slide.src} alt={slide.alt} />
        </div>
      ))}
      <div className="carousel-controls">
        <button className="carousel-btn" onClick={prev}><i className="fa fa-chevron-left"></i></button>
        <button className="carousel-btn" onClick={next}><i className="fa fa-chevron-right"></i></button>
      </div>
    </div>
  );
}

/* ── Main Export ── */
export default function HomePage() {
  const navigate = useNavigate();
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [heroCategories, setHeroCategories] = useState([]);
  const [dialCategories, setDialCategories] = useState([]);
  const [serviceSections, setServiceSections] = useState([]);
  const [trendingCards, setTrendingCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHomePageData = async () => {
      setLoading(true);
      try {
        // Banners endpoint not available - set empty
        setCarouselSlides([]);

        // Fetch categories from API
        const categoriesResponse = await apiService.categories.getAll();
        console.log("Categories API response:", categoriesResponse);
        console.log("Categories data type:", typeof categoriesResponse.data);
        console.log("Categories data:", categoriesResponse.data);

        // Handle different response structures
        const categoriesArray = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : (categoriesResponse.data?.categories || categoriesResponse.data?.data || []);

        if (categoriesArray.length > 0) {
          const featured = categoriesArray.slice(0, 4).map(cat => ({
            src: cat.image || cat.icon || './img/product-images/entertenment.png',
            label: cat.name || cat.categoryName || cat.title,
            cls: 'bg-entertainment'
          }));
          setHeroCategories(featured);

          const allCats = categoriesArray.map(cat => ({
            src: cat.icon || cat.image || './img/icon/restaurants.png',
            label: cat.name || cat.categoryName || cat.title
          }));
          setDialCategories(allCats);

          const sections = [
            {
              title: 'Beauty & Spa',
              items: categoriesArray.slice(0, 3).map(cat => ({
                src: cat.image || cat.icon || './img/product-images/beauty-parlours.webp',
                label: cat.name || cat.categoryName || cat.title
              }))
            },
            {
              title: 'Event Management',
              items: categoriesArray.slice(3, 6).map(cat => ({
                src: cat.image || cat.icon || './img/product-images/wedding-hall.avif',
                label: cat.name || cat.categoryName || cat.title
              }))
            },
          ];
          setServiceSections(sections);
        } else {
          setHeroCategories([]);
          setDialCategories([]);
          setServiceSections([]);
        }

        // Trending searches endpoint not available - set empty
        setTrendingCards([]);
      } catch (error) {
        console.error("Error fetching home page data:", error);
        setCarouselSlides([]);
        setHeroCategories([]);
        setDialCategories([]);
        setServiceSections([]);
        setTrendingCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  /* ── Category click handler: navigate to CategoryPage with clean URL ── */
  const handleCategoryClick = (categoryLabel) => {
    const city = getSelectedCity();
    navigate(`/category/${encodeURIComponent(city)}/${encodeURIComponent(categoryLabel)}`);
  };

  return (
    <div className="home-page">
      {/* Cosmic Effects */}
      <FloatingDust />

      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <HeroCarousel slides={carouselSlides} />
            <div className="hero-categories">
              {loading ? (
                <p>Loading featured categories...</p>
              ) : heroCategories.length > 0 ? (
                heroCategories.map((cat) => (
                  <div
                    key={cat.label}
                    className={`hero-cat-card ${cat.cls}`}
                    onClick={() => handleCategoryClick(cat.label)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={cat.src} alt={cat.label} />
                    <p className="hero-cat-label">{cat.label}</p>
                  </div>
                ))
              ) : (
                <p>No featured categories available</p>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Dial Categories */}
      <section className="dial-category-section">
        <div className="container">
          <div className="dial-grid">
            {loading ? (
              <p>Loading categories...</p>
            ) : dialCategories.length > 0 ? (
              dialCategories.map((cat, i) => (
                <div
                  key={cat.label}
                  className="category-box"
                  style={{ animationDelay: `${i * 0.03}s`, cursor: 'pointer' }}
                  onClick={() => handleCategoryClick(cat.label)}
                >
                  <img src={cat.src} alt={cat.label} />
                  <p>{cat.label}</p>
                </div>
              ))
            ) : (
              <p>No categories available</p>
            )}
          </div>
        </div>
      </section>

      {/* Service sections */}
      <section className="service-sections">
        <div className="container">
          <div className="row">
            {loading ? (
              <p>Loading service sections...</p>
            ) : serviceSections.length > 0 ? (
              serviceSections.map((sec) => (
                <div key={sec.title} className="col-lg-6 service-category-row">
                  <div className="service-row-header">
                    <h3 className="service-row-title">{sec.title}</h3>
                    <button className="view-all-btn">View All</button>
                  </div>
                  <div className="items-slider-container">
                    {sec.items.map((item) => (
                      <div
                        key={item.label}
                        className="item-card"
                        onClick={() => handleCategoryClick(item.label)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src={item.src} alt={item.label} />
                        <p>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p>No service sections available</p>
            )}
          </div>
        </div>
      </section>

      {/* Trending nearby */}
      <section className="trending-section">
        <div className="container">
          <div className="trending-section-header">
            <div className="trending-section-title">
              Trending Searches Near You
              <span className="badge-new">NEW</span>
            </div>
          </div>
          <div className="trending-cards-wrapper">
            {loading ? (
              <p>Loading trending searches...</p>
            ) : trendingCards.length > 0 ? (
              trendingCards.map((card) => (
                <div key={card.title} className="trending-card">
                  <div className="trending-card-img">
                    <img src={card.src} alt={card.title} />
                  </div>
                  <div className="trending-card-body">
                    <div className="trending-card-title">{card.title}</div>
                    <a href="#" className="trending-card-link">
                      Explore <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p>No trending searches available</p>
            )}
          </div>
        </div>
      </section>

      {/* Popular & Trending categories */}
      <PopularTrending />

    </div>
  );
}