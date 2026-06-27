import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./CategoryPage.css";

// ── BACKEND DATA MODELS ──
const BACKEND_BANNERS = [
  {
    src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    alt: "Software Engineering Services",
  },
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    alt: "Innovative Tech Space",
  },
];

const BACKEND_LISTINGS = [
  {
    id: 1,
    name: "Gv Solutions",
    rating: 5.0,
    ratingCount: 6,
    topTag: "Top Search",
    location: "Madurai Main",
    distance: 1.2,
    popularity: 98,
    years: "12 Years in Business",
    tags: ["Software Companies", "Online Websites"],
    phone: "08460506156",
    img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400",
    isVerified: true,
    isTrust: true,
  },
  {
    id: 2,
    name: "TechNest Systems",
    rating: 4.8,
    ratingCount: 14,
    topTag: "JD Verified",
    location: "Anna Nagar, Madurai",
    distance: 3.5,
    popularity: 85,
    years: "8 Years in Business",
    tags: ["Mobile Apps", "Web Design"],
    phone: "09876543210",
    img: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=400",
    isVerified: true,
    isTrust: false,
  },
  {
    id: 3,
    name: "PixelForge Studio",
    rating: 4.5,
    ratingCount: 9,
    topTag: null,
    location: "KK Nagar, Madurai",
    distance: 0.8,
    popularity: 72,
    years: "5 Years in Business",
    tags: ["UI/UX Design", "Branding"],
    phone: "07890123456",
    img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400",
    isVerified: false,
    isTrust: true,
  },
  {
    id: 4,
    name: "Apex Digital Systems",
    rating: 4.2,
    ratingCount: 22,
    topTag: "Popular",
    location: "Simmakkal, Madurai",
    distance: 4.1,
    popularity: 91,
    years: "10 Years in Business",
    tags: ["Cloud Computing", "ERP Software"],
    phone: "09441234567",
    img: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=400",
    isVerified: true,
    isTrust: true,
  },
];

const BACKEND_RELATED_CATEGORIES = [
  { id: "rel-1", name: "Web Designers in Madurai", count: "142 options" },
  { id: "rel-2", name: "Mobile App Developers", count: "98 options" },
  { id: "rel-3", name: "Digital Marketing Agencies", count: "210 options" },
];

const BACKEND_KEYWORDS = [
  "Custom ERP",
  "SaaS Solutions",
  "React Developers",
  "Madurai IT Hub",
  "E-Commerce Build",
  "Cloud Hosting",
  "UI/UX Audits",
  "SEO Strategy",
];

const BACKEND_ADS = [
  {
    id: "ad-pos-1",
    insertAfterIndex: 1,
    title: "Upgrade to Premium Enterprise Cloud Storage",
    content:
      "Get 2TB high-speed redundant storage for your agency. 50% discount for local Madurai enterprises this month.",
    img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400",
    cta: "Claim Offer",
  },
];

// ── LAZY-LOAD VIEWPORT WRAPPER COMPONENT ──
function LazyViewElement({ children, onVisible }) {
  const elementRef = useRef(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasLoaded(true);
          if (onVisible) onVisible();
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );

    const currentRef = elementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.disconnect();
    };
  }, [onVisible]);

  return (
    <div
      ref={elementRef}
      className={`lazy-element-container ${hasLoaded ? "loaded" : "is-loading"}`}
    >
      {hasLoaded ? children : <div className="backend-lazy-skeleton">Loading...</div>}
    </div>
  );
}

// ── INTERACTIVE AD CARD MODULE ──
function AdCard({ ad, onClose }) {
  return (
    <div className="advertisement-card-container">
      <button
        className="ad-close-trigger"
        onClick={onClose}
        aria-label="Close Ad"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
      <div className="ad-badge-label">Sponsored</div>
      <div className="ad-card-inner-layout">
        {ad.img && (
          <div className="ad-graphics-frame">
            <img src={ad.img} alt={ad.title} />
          </div>
        )}
        <div className="ad-copywritten-content">
          <h4 className="ad-marketing-title">{ad.title}</h4>
          <p className="ad-body-text">{ad.content}</p>
          <button className="ad-cta-action-btn">{ad.cta}</button>
        </div>
      </div>
    </div>
  );
}

// ── BANNER COMPONENT ──
function CategoryBanner({ banners }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!banners || banners.length === 0) return;
    const t = setInterval(
      () => setCurrent((c) => (c + 1) % banners.length),
      6000
    );
    return () => clearInterval(t);
  }, [banners]);

  return (
    <div className="category-banner">
      {banners.map((b, i) => (
        <div
          key={i}
          className={`category-banner-slide${i === current ? " active" : ""}`}
        >
          <img src={b.src} alt={b.alt} />
        </div>
      ))}
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function CategoryPage() {
  const [searchParams] = useSearchParams();
  const city = searchParams.get("city") || "";
  const query = searchParams.get("query") || "";

  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [listings, setListings] = useState([]);
  const [relatedCategories, setRelatedCategories] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [activeAds, setActiveAds] = useState([]);
  const [dismissedAdIds, setDismissedAdIds] = useState([]);

  const [sortBy, setSortBy] = useState("relevance");
  const [filterVerified, setFilterVerified] = useState(true);
  const [filterTrust, setFilterTrust] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Lead form state
  const [leadForm, setLeadForm] = useState({ name: "", mobile: "", location: "" });

  const triggerLazyBannerFetch = () => {
    if (banners.length === 0) setBanners(BACKEND_BANNERS);
  };

  const filteredData = useMemo(() => {
    return BACKEND_LISTINGS.filter((item) => {
      const cleanSearchLocation = city.toLowerCase().trim();
      const cleanSearchTag = query.toLowerCase().trim();

      const matchesLocation =
        cleanSearchLocation === "" ||
        item.location.toLowerCase().includes(cleanSearchLocation);

      const matchesTag =
        cleanSearchTag === "" ||
        item.tags.some((tag) => tag.toLowerCase().includes(cleanSearchTag));

      return matchesLocation && matchesTag;
    });
  }, [city, query]);

  const triggerLazyListingFetch = () => {
    setListings(filteredData);
  };

  const triggerLazySidebarFetch = () => {
    if (relatedCategories.length === 0) {
      setRelatedCategories(BACKEND_RELATED_CATEGORIES);
      setKeywords(BACKEND_KEYWORDS);
      setActiveAds(BACKEND_ADS);
    }
  };

  useEffect(() => {
    triggerLazyBannerFetch();
    triggerLazyListingFetch();
    triggerLazySidebarFetch();
  }, [city, query, filteredData]);

  const handleDismissAd = (adId) => {
    setDismissedAdIds((prev) => [...prev, adId]);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = () => {
    console.log("Requirements Sent:", leadForm);
    alert("Thank you! Your requirements have been sent.");
    setLeadForm({ name: "", mobile: "", location: "" });
  };

  const processedListings = useMemo(() => {
    let output = [...listings];
    if (filterVerified) output = output.filter((item) => item.isVerified);
    if (filterTrust) output = output.filter((item) => item.isTrust);

    if (sortBy === "rating") output.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "popular") output.sort((a, b) => b.popularity - a.popularity);
    else if (sortBy === "distance") output.sort((a, b) => a.distance - b.distance);
    else output.sort((a, b) => b.id - a.id);

    return output;
  }, [listings, filterVerified, filterTrust, sortBy]);

  return (
    <div className="category-page">
      <LazyViewElement onVisible={triggerLazyBannerFetch}>
        <div className="container">
          <CategoryBanner banners={banners} />
        </div>
      </LazyViewElement>

      <div className="container category-layout">
        <div className="row category-layout-row">
          <div className="col-lg-8">
            <div className="breadcrumb-nav">
              {city} &gt; {query} &gt;
              <span> {processedListings.length}+ Listings</span>
            </div>

            <h1 className="category-page-title">
              {query} in {city}
            </h1>
            <div className="filter-chips">
              <div className="sort-dropdown-wrapper">
                <button
                  className={`filter-chip ${sortBy !== "relevance" ? "active-chip" : ""}`}
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  Sort by:{" "}
                  <span className="current-sort-label">
                    {sortBy.toUpperCase()}
                  </span>{" "}
                  <i
                    className="fa fa-chevron-down"
                    style={{ fontSize: "0.65rem" }}
                  ></i>
                </button>

                {showSortDropdown && (
                  <div className="sort-interactive-select-panel">
                    <div
                      className={`sort-option ${sortBy === "relevance" ? "selected" : ""}`}
                      onClick={() => {
                        setSortBy("relevance");
                        setShowSortDropdown(false);
                      }}
                    >
                      Relevance
                    </div>
                    <div
                      className={`sort-option ${sortBy === "rating" ? "selected" : ""}`}
                      onClick={() => {
                        setSortBy("rating");
                        setShowSortDropdown(false);
                      }}
                    >
                      Highest Rating
                    </div>
                    <div
                      className={`sort-option ${sortBy === "popular" ? "selected" : ""}`}
                      onClick={() => {
                        setSortBy("popular");
                        setShowSortDropdown(false);
                      }}
                    >
                      Popularity
                    </div>
                    <div
                      className={`sort-option ${sortBy === "distance" ? "selected" : ""}`}
                      onClick={() => {
                        setSortBy("distance");
                        setShowSortDropdown(false);
                      }}
                    >
                      Distance
                    </div>
                  </div>
                )}
              </div>

              <button
                className={`filter-chip ${filterVerified ? "active-chip" : ""}`}
                onClick={() => setFilterVerified(!filterVerified)}
              >
                {filterVerified && <i className="fa fa-check-circle"></i>}{" "}
                Verified
              </button>

              <button
                className={`filter-chip ${filterTrust ? "active-chip" : ""}`}
                onClick={() => setFilterTrust(!filterTrust)}
              >
                {filterTrust && <i className="fa fa-check-circle"></i>} Trust
              </button>
            </div>

            {/* Left Segment: Main Content Area */}
            <div className="category-main-scrollable">
              <LazyViewElement onVisible={triggerLazyListingFetch}>
                {processedListings.length === 0 ? (
                  <div className="empty-results-fallback">
                    <p>No listings found matching the criteria.</p>
                  </div>
                ) : (
                  processedListings.flatMap((item, index) => {
                    const items = [];
                    items.push(
                      <div key={`listing-${item.id}`} className="listing-card">
                        <div className="listing-img">
                          <img src={item.img} alt={item.name} />
                        </div>

                        <div className="listing-info">
                          <div className="listing-name">{item.name}</div>
                          <div className="listing-rating-row">
                            <span className="rating-badge">
                              {item.rating.toFixed(1)}
                            </span>
                            <span className="rating-count">
                              {item.ratingCount} Ratings
                            </span>
                            {item.topTag && (
                              <span className="tag-top-search">
                                {item.topTag}
                              </span>
                            )}
                            <span className="proximity-geo-tag">
                              {item.distance} km
                            </span>
                          </div>
                          <div className="listing-meta">
                            <span>
                              <i className="fa-solid fa-location-dot"></i>{" "}
                              {item.location}
                            </span>
                            <span>
                              <i className="fa-solid fa-briefcase"></i>{" "}
                              {item.years}
                            </span>
                          </div>
                          <div className="listing-tags">
                            {item.tags.map((t) => (
                              <span key={t} className="listing-tag">
                                {t}
                              </span>
                            ))}
                          </div>
                          <div className="listing-actions">
                            <a href={`tel:${item.phone}`} className="btn-call">
                              <i className="fa-solid fa-phone"></i> {item.phone}
                            </a>
                            <button className="btn-whatsapp">
                              <i className="fa-brands fa-whatsapp"></i> WhatsApp
                            </button>
                            <button
                              className="btn-price"
                              onClick={() => navigate("/company")}
                            >
                              Enquire Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );

                    const ad = activeAds.find(
                      (a) =>
                        a.insertAfterIndex === index &&
                        !dismissedAdIds.includes(a.id)
                    );
                    if (ad) {
                      items.push(
                        <AdCard
                          key={`ad-${ad.id}`}
                          ad={ad}
                          onClose={() => handleDismissAd(ad.id)}
                        />
                      );
                    }
                    return items;
                  })
                )}
              </LazyViewElement>
            </div>
          </div>

          {/* Right Segment: Fixed Sidebar Area */}
          <div className="col-lg-4 category-sidebar-fixed">
            <LazyViewElement onVisible={triggerLazySidebarFetch}>
              <div className="sidebar-sticky-enclosure">
                {/* Lead Form */}
                <div className="sidebar-card">
                  <h3 className="sidebar-title">Get List of Top Companies</h3>
                  <p className="sidebar-subtitle">
                    Verified options sent instantly.
                  </p>
                  <input
                    className="sidebar-input"
                    type="text"
                    name="name"
                    value={leadForm.name}
                    onChange={handleFormChange}
                    placeholder="Your Name"
                  />
                  <input
                    className="sidebar-input"
                    type="tel"
                    name="mobile"
                    value={leadForm.mobile}
                    onChange={handleFormChange}
                    placeholder="Mobile Number"
                  />
                  <input
                    className="sidebar-input"
                    type="text"
                    name="location"
                    value={leadForm.location}
                    onChange={handleFormChange}
                    placeholder="Your Location"
                  />
                  <button className="sidebar-submit" onClick={handleFormSubmit}>
                    Send Requirements
                  </button>
                </div>

                {/* Related Categories */}
                <div className="related-categories-card-box">
                  <h3 className="sidebar-title">Related Categories</h3>
                  <div className="related-categories-vertical-stack">
                    {relatedCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="related-category-row-item"
                        onClick={() => navigate("/category")}
                      >
                        <span className="related-cat-name-link">
                          {cat.name}
                        </span>
                        <i className="fa-solid fa-chevron-right related-cat-arrow"></i>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Keywords Widget Segment */}
                <div className="related-keywords-card-box">
                  <h3 className="sidebar-title">Related Keywords</h3>
                  <div className="keywords-flex-wrap">
                    {keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="keyword-pill-tag"
                        onClick={() => navigate("/category")}
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </LazyViewElement>
          </div>
        </div>
      </div>
    </div>
  );
}