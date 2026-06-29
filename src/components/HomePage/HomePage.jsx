import React, { useState, useEffect } from 'react';
import PopularTrending from '../PopularTrending/PopularTrending';
import FloatingDust from '../Effects/Canvas/FloatingDust';
import './HomePage.css';

/* ── Data ── */
const CAROUSEL_SLIDES = [
  { src: './img/product-images/travel-ticket-booking.webp', alt: 'Travel' },
  { src: './img/product-images/travel-ticket-booking.webp', alt: 'Booking' },
  { src: './img/product-images/travel-ticket-booking.webp', alt: 'Services' },
];

const HERO_CATEGORIES = [
  { src: './img/product-images/entertenment.png',    label: 'Entertainment', cls: 'bg-entertainment' },
  { src: './img/product-images/profesionalist.png',  label: 'Professionalist', cls: 'bg-professional' },
  { src: './img/product-images/repair-services-01.webp', label: 'Repairs', cls: 'bg-repair' },
  { src: './img/product-images/doctor.webp',         label: 'Doctors', cls: 'bg-doctor' },
];

const DIAL_CATEGORIES = [
  { src: './img/icon/restaurants.png',            label: 'Restaurants' },
  { src: './img/icon/hotel-01.png',               label: 'Hotels' },
  { src: './img/icon/beauty-spa.png',             label: 'Beauty Spa' },
  { src: './img/icon/home-decor-01.png',          label: 'Home Decor' },
  { src: './img/icon/wedding-planning.png',       label: 'Wedding Planning' },
  { src: './img/icon/education.png',              label: 'Education' },
  { src: './img/icon/rent.png',                   label: 'Rent & Hire' },
  { src: './img/icon/hospital-02.png',            label: 'Hospitals' },
  { src: './img/icon/contractors.png',            label: 'Contractors' },
  { src: './img/icon/pet-shops.png',              label: 'Pet Shops' },
  { src: './img/icon/hostels.png',                label: 'Hostels' },
  { src: './img/icon/dentists.png',               label: 'Dentists' },
  { src: './img/icon/Gym.png',                    label: 'Gym' },
  { src: './img/icon/loan.png',                   label: 'Loans Agencies' },
  { src: './img/icon/event.png',                  label: 'Event Organisers' },
  { src: './img/icon/driving-school.png',         label: 'Driving Schools' },
  { src: './img/icon/transport.png',              label: 'Transport' },
  { src: './img/icon/courier-service.png',        label: 'Courier Service' },
  { src: './img/icon/horticulture.png',           label: 'Horticulture' },
  { src: './img/icon/auto-compenent.png',         label: 'Auto Components' },
  { src: './img/icon/banks.png',                  label: 'Banks' },
  { src: './img/icon/construction-companies.png', label: 'Constructions' },
  { src: './img/icon/land-promoters.png',         label: 'Land Promoters' },
  { src: './img/icon/coaching-centres.png',       label: 'Coaching Centers' },
  { src: './img/icon/theaters.png',               label: 'Theaters' },
  { src: './img/icon/cafes.png',                  label: 'Cafes' },
  { src: './img/icon/home-appliances.png',        label: 'Home Appliance' },
  { src: './img/icon/pharmacy.png',               label: 'Pharmacy' },
  { src: './img/icon/tours-travels.png',          label: 'Tours And Travels' },
  { src: './img/icon/software-it-companies.png',  label: 'Software Companies' },
  { src: './img/icon/textile-garments.png',       label: 'Textile & Garments' },
  { src: './img/icon/construction-materials.png', label: 'Construction Materials' },
  { src: './img/icon/mobile-shops.png',           label: 'Mobile Shops' },
  { src: './img/icon/auditors.png',               label: 'Auditors' },
  { src: './img/icon/water-purifier-ro-service.png', label: 'Purifier Dealers' },
  { src: './img/icon/medical-labs.png',           label: 'Medical Labs' },
  { src: './img/icon/imports-exports.png',        label: 'Imports & Exports' },
  { src: './img/icon/logistics-frights.png',      label: 'Logistics & Freights' },
  { src: './img/icon/temples.png',                label: 'Temples' },
  { src: './img/icon/chemical-industry.png',      label: 'Chemical Industries' },
];

const SERVICE_SECTIONS = [
  {
    title: 'Beauty & Spa',
    items: [
      { src: './img/product-images/beauty-parlours.webp', label: 'Beauty Parlours' },
      { src: './img/product-images/spa-massages.jpg',     label: 'Spa & Massages' },
      { src: './img/product-images/salons.jpg',           label: 'Salons' },
    ],
  },
  {
    title: 'Event Management',
    items: [
      { src: './img/product-images/wedding-hall.avif',         label: 'Banquet Halls' },
      { src: './img/product-images/bridal-makeup-studio.jpg',  label: 'Bridal Requisite' },
      { src: './img/product-images/caterers.avif',             label: 'Caterers' },
    ],
  },
  {
    title: 'Food & Dining',
    items: [
      { src: './img/product-images/wedding-hall.avif',         label: 'Banquet Halls' },
      { src: './img/product-images/bridal-makeup-studio.jpg',  label: 'Fine Dining' },
      { src: './img/product-images/caterers.avif',             label: 'Caterers' },
    ],
  },
  {
    title: 'Home Services',
    items: [
      { src: './img/product-images/wedding-hall.avif',         label: 'Cleaning' },
      { src: './img/product-images/bridal-makeup-studio.jpg',  label: 'Electricians' },
      { src: './img/product-images/caterers.avif',             label: 'Plumbers' },
    ],
  },
];

const TRENDING_CARDS = [
  { src: './img/product-images/college.jfif',   title: 'Colleges' },
  { src: './img/product-images/resturent.jfif', title: 'Restaurant' },
  { src: './img/product-images/book-shop.webp', title: 'Book Shops' },
  { src: './img/product-images/tourism.webp',   title: 'Tourism' },
];

/* ── Components ── */
function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % CAROUSEL_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  const next = () => setCurrent((c) => (c + 1) % CAROUSEL_SLIDES.length);

  return (
    <div className="home-carousel">
      {CAROUSEL_SLIDES.map((slide, i) => (
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
  return (
    <div className="home-page">
      {/* Cosmic Effects */}
      <FloatingDust />

      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <HeroCarousel />
            <div className="hero-categories">
              {HERO_CATEGORIES.map((cat) => (
                <div key={cat.label} className={`hero-cat-card ${cat.cls}`}>
                  <img src={cat.src} alt={cat.label} />
                  <p className="hero-cat-label">{cat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Dial Categories */}
      <section className="dial-category-section">
        <div className="container">
          <div className="dial-grid">
            {DIAL_CATEGORIES.map((cat, i) => (
              <div
                key={cat.label}
                className="category-box"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <img src={cat.src} alt={cat.label} />
                <p>{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service sections */}
      <section className="service-sections">
        <div className="container">
          <div className="row">
            {SERVICE_SECTIONS.map((sec) => (
              <div key={sec.title} className="col-lg-6 service-category-row">
                <div className="service-row-header">
                  <h3 className="service-row-title">{sec.title}</h3>
                  <button className="view-all-btn">View All</button>
                </div>
                <div className="items-slider-container">
                  {sec.items.map((item) => (
                    <div key={item.label} className="item-card">
                      <img src={item.src} alt={item.label} />
                      <p>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
            {/* <p className="trending-section-sub">Stay updated with the latest local trends.</p> */}
          </div>
          <div className="trending-cards-wrapper">
            {TRENDING_CARDS.map((card) => (
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
            ))}
          </div>
        </div>
      </section>

      {/* Popular & Trending categories */}
      <PopularTrending />

    </div>
  );
}
