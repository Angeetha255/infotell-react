import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setQuery, setLocation } from "../../store/store";
import { setLoginOpen } from "../../store/store";
import "./Header.css";
import { useDispatch } from "react-redux";

const POPULAR_SEARCHES = [
  { icon: "fa-magnifying-glass", text: "Software Companies" },
  { icon: "fa-magnifying-glass", text: "Web Development Services" },
  { icon: "fa-code", text: "Mobile App Developers" },
  { icon: "fa-bullhorn", text: "Digital Marketing Agencies" },
];

const POPULAR_CITIES = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Tiruchirappalli",
  "Salem",
  "Tiruppur",
  "Erode",
  "Tuticorin",
  "Tirunelveli",
  "Dindigul",
  "Thanjavur",
  "Ooty",
  "Kodaikanal",
  "Yercaud",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
  "Lucknow",
  "Kochi",
  "Visakhapatnam",
  "Mysore",
  "Bhopal",
  "Noida",
  "Vijayawada",
];

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [showLocationView, setShowLocationView] = useState(false);
  const [filtered, setFiltered] = useState(POPULAR_SEARCHES);
  const [city, setCity] = useState(POPULAR_CITIES?.[0] || "");
  const [query, setQuery] = useState("");

  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // Checks exclusively for mobile screen sizes (below 1200px)
  const isMobileSize = () => window.innerWidth < 1200;

  /* Sticky header controller */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close desktop dropdown when clicking outside */
  useEffect(() => {
    const handler = (e) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Sync body scrolling lock toggle when Mobile Overlay mounts */
  useEffect(() => {
    if (isMobileModalOpen) {
      document.body.style.overflow = "hidden";
      setShowLocationView(false);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileModalOpen]);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    const f = POPULAR_SEARCHES.filter((i) =>
      i.text.toLowerCase().includes(val.toLowerCase()),
    );
    setFiltered(f);
    setShowDrop(val.length > 0 ? f.length > 0 : true);
  };

  const handleSelect = (text) => {
    setShowDrop(false);
    setIsMobileModalOpen(false);

    if (city !== undefined && text !== undefined && text.trim() !== "") {
      navigate(`/category?city=${city}&query=${text}`);
    } else {
      console.log("Condition failed: city or query is missing");
    }
  };

  const handleCitySelectInOverlay = (selectedCity) => {
    setCity(selectedCity);
    setShowLocationView(false);
  };

  const handleFocus = () => {
    if (isMobileSize()) {
      inputRef.current?.blur();
      setIsMobileModalOpen(true);
      return;
    }
    setFiltered(query ? filtered : POPULAR_SEARCHES);
    setShowDrop(true);
  };

  const onSearchClick = (e) => {
    if (city !== undefined && query !== undefined && query.trim() !== "") {
      navigate(`/category?city=${city}&query=${query}`);
    } else {
      console.log("Condition failed: city or query is missing");
    }
  };

  return (
    <>
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container header-inner">
          {/* Brand Column */}
          <div className="brand-row">
            <Link to="/" className="brand-link">
              <div className="brand-name">Infotell</div>
            </Link>
          </div>

          {/* Normal View Search (Includes Desktop & Tablets >= 992px) */}
          {!isMobileSize() && (
            <div
              className="search-relative"
              ref={dropRef}
              style={{
                position: "relative",
                zIndex: showDrop ? 99999 : 2,
              }}
            >
              <div className="search-wrapper">
                <i className="fa-solid fa-location-dot"></i>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="location-box"
                  aria-label="Select City"
                >
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="search-input-box" id="searchBox">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    ref={inputRef}
                    id="searchInput"
                    type="text"
                    className="search-input"
                    placeholder="Search for Services, Shops, or Companies"
                    value={query}
                    onChange={handleInput}
                    onFocus={handleFocus}
                    onKeyDown={(e) => e.key === "Enter" && handleSelect(query)}
                    autoComplete="off"
                  />
                </div>
                <button
                  className="search-btn"
                  onClick={(event) => onSearchClick()}
                >
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>

              {/* Desktop Dropdown Box Panel */}
              {showDrop && (
                <div className="search-dropdown" id="searchDropdown">
                  <div className="search-dropdown-label">Popular Searches</div>
                  {filtered.map((item, idx) => (
                    <div
                      key={idx}
                      className="search-item"
                      onClick={() => handleSelect(item.text)}
                    >
                      <i className={`fa-solid ${item.icon}`}></i>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Header Action Buttons (Always Visible) */}
          <div className="header-actions">
            <button
              className="login-btn"
              onClick={() => dispatch(setLoginOpen(true))}
            >
              Sign Up
            </button>
            <button className="btn-listing" aria-label="Add Listing">
              Add Listing
            </button>
          </div>
        </div>

        {/* Mobile Screen Only View Search Layer (Hidden above 1200px, Location Box omitted) */}
        {isMobileSize() && (
          <div className="container mobile-search-row-container">
            <div
              className="search-relative mobile-only-variant"
              onClick={() => setIsMobileModalOpen(true)}
            >
              <div className="search-wrapper">
                <div className="search-input-box">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search for Services, Shops, or Companies"
                    value={query}
                    readOnly
                    onFocus={handleFocus}
                    autoComplete="off"
                  />
                </div>
                <button className="search-btn">
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Fullscreen Search / Location Overlay Engine Box */}
      {isMobileModalOpen && (
        <div className="search-overlay">
          <div className="search-overlay-header">
            <button
              className="back-btn"
              onClick={() => {
                if (showLocationView) {
                  setShowLocationView(false);
                } else {
                  setIsMobileModalOpen(false);
                }
              }}
            >
              ←
            </button>

            {/* Persistent Central Location Selection Button */}
            <div
              className="overlay-location-picker centered-header-picker"
              onClick={() => setShowLocationView(true)}
            >
              <i className="fa-solid fa-location-dot loc-icon"></i>
              <span className="overlay-city-display-label">
                {city || "Select City"}
              </span>
            </div>

            <div style={{ width: "24px" }}></div>
          </div>

          {!showLocationView ? (
            <>
              <div className="search-overlay-bar-wrapper">
                <i className="fa-solid fa-magnifying-glass bar-search-icon"></i>
                <input
                  type="text"
                  autoFocus
                  placeholder="Search for Services, Shops..."
                  value={query}
                  onChange={handleInput}
                  onKeyDown={(e) => e.key === "Enter" && handleSelect(query)}
                  className="overlay-main-input"
                />
                <i className="fa-solid fa-microphone mic-btn"></i>
                <button
                  className="overlay-search-submit-btn"
                  onClick={() => handleSelect(query)}
                  aria-label="Submit Search"
                >
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>

              <div className="search-overlay-content">
                <h3 className="trending-title">
                  {query ? "Matching Results" : "Popular Searches"}
                </h3>
                <div className="trending-list">
                  {filtered.map((item, idx) => (
                    <div
                      key={idx}
                      className="trending-item"
                      onClick={() => handleSelect(item.text)}
                    >
                      <div className="trending-icon-box">
                        <i className={`fa-solid ${item.icon}`}></i>
                      </div>
                      <div className="trending-text-box">
                        <span className="trending-name">{item.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="search-overlay-content location-selection-view animated fadeIn">
              <h3 className="trending-title">Select Local City Area</h3>
              <div className="trending-list static-cities-vertical-scroll">
                {POPULAR_CITIES.map((c, idx) => (
                  <div
                    key={idx}
                    className={`trending-item city-row-item ${city === c ? "active-city" : ""}`}
                    onClick={() => handleCitySelectInOverlay(c)}
                  >
                    <div className="trending-icon-box">
                      <i className="fa-solid fa-location-arrow"></i>
                    </div>
                    <div className="trending-text-box">
                      <span className="trending-name">{c}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
