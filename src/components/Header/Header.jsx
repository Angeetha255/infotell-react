import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setQuery, setLocation } from "../../store/store";
import { setLoginOpen } from "../../store/store";
import { apiService } from "../../services/api";
import "./Header.css";
import { useDispatch } from "react-redux";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [showLocationView, setShowLocationView] = useState(false);
  const [popularSearches, setPopularSearches] = useState([]);
  const [cities, setCities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState(null);

  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // Checks exclusively for mobile screen sizes (below 1200px)
  const isMobileSize = () => window.innerWidth < 1200;

  /* Fetch cities and popular searches from API */
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch cities from /districts endpoint
        const citiesResponse = await apiService.cities.getAll();
        console.log("Cities API response:", citiesResponse);
        console.log("Cities data type:", typeof citiesResponse.data);
        console.log("Cities data:", citiesResponse.data);

        // Handle different response structures
        const citiesArray = Array.isArray(citiesResponse.data)
          ? citiesResponse.data
          : (citiesResponse.data?.districts || citiesResponse.data?.data || []);

        if (citiesArray.length > 0) {
          const citiesData = citiesArray.map(c => c.name || c.districtName || c.district);
          setCities(citiesData);
          setCity(citiesData[0] || "");
        } else {
          setCities([]);
          setCity("");
        }

        // Popular searches - will be empty until backend provides endpoint
        setPopularSearches([]);
        setFiltered([]);

        // Fetch all companies for search functionality
        await fetchCompanies();
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setCities([]);
        setCity("");
        setPopularSearches([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  /* Fetch all companies from Public Companies API */
  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    setCompaniesError(null);
    try {
      const response = await apiService.publicCompanies.getAll();
      console.log("Companies API response:", response);
      
      const companiesArray = Array.isArray(response.data)
        ? response.data
        : (response.data?.companies || response.data?.data || []);
      
      setCompanies(companiesArray);
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompaniesError("Failed to load companies. Please try again.");
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

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
    
    // Filter companies by district (city) and businessName (query)
    const filteredCompanies = companies.filter((company) => {
      const districtMatch = company.district === city;
      const nameMatch = company.businessName && 
        company.businessName.toLowerCase().includes(val.toLowerCase());
      return districtMatch && nameMatch;
    });
    
    // Map to the format expected by the dropdown
    const mappedFiltered = filteredCompanies.map((company) => ({
      text: company.businessName,
      icon: 'fa-building',
      companyData: company
    }));
    
    setFiltered(mappedFiltered);
    setShowDrop(val.length > 0);
  };

  const handleSelect = (text, companyData = null) => {
    setShowDrop(false);
    setIsMobileModalOpen(false);

    if (city !== undefined && text !== undefined && text.trim() !== "") {
      if (companyData) {
        // Navigate to company page with company data
        const companyId = companyData.id || companyData._id || 'details';
        navigate(`/company/${companyId}`, { state: { companyData } });
      } else {
        const trimmedText = text.trim();
        // Use the same filtering logic as the autocomplete dropdown
        const matchingCompanies = companies.filter((company) => {
          const districtMatch = company.district === city;
          const nameMatch = company.businessName && 
            company.businessName.toLowerCase().includes(trimmedText.toLowerCase());
          return districtMatch && nameMatch;
        });
        
        if (matchingCompanies.length > 0) {
          const company = matchingCompanies[0];
          const companyId = company.id || company._id || 'details';
          navigate(`/company/${companyId}`, { state: { companyData: company } });
        } else {
          navigate(`/category?city=${city}&query=${trimmedText}`);
        }
      }
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
    setFiltered(query ? filtered : popularSearches);
    setShowDrop(true);
  };

  const onSearchClick = (e) => {
    if (city !== undefined && query !== undefined && query.trim() !== "") {
      const trimmedQuery = query.trim();
      
      // Use the same filtering logic as the autocomplete dropdown (handleInput)
      const matchingCompanies = companies.filter((company) => {
        const districtMatch = company.district === city;
        const nameMatch = company.businessName && 
          company.businessName.toLowerCase().includes(trimmedQuery.toLowerCase());
        return districtMatch && nameMatch;
      });
      
      if (matchingCompanies.length > 0) {
        // Navigate to the first matching company's detail page (same as handleSelect)
        const company = matchingCompanies[0];
        const companyId = company.id || company._id || 'details';
        navigate(`/company/${companyId}`, { state: { companyData: company } });
      } else {
        // Fallback to category search page when no exact match found
        navigate(`/category?city=${city}&query=${trimmedQuery}`);
      }
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
                  disabled={loading}
                >
                  {loading ? (
                    <option>Loading cities...</option>
                  ) : cities.length > 0 ? (
                    cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  ) : (
                    <option value="">No cities available</option>
                  )}
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
                  <div className="search-dropdown-label">
                    {query ? "Matching Companies" : "Popular Searches"}
                  </div>
                  {companiesLoading ? (
                    <div className="search-item">Loading companies...</div>
                  ) : companiesError ? (
                    <div className="search-item">{companiesError}</div>
                  ) : filtered.length === 0 && query ? (
                    <div className="search-item">No companies found</div>
                  ) : (
                    filtered.map((item, idx) => (
                      <div
                        key={idx}
                        className="search-item"
                        onClick={() => handleSelect(item.text, item.companyData)}
                      >
                        <i className={`fa-solid ${item.icon}`}></i>
                        <span>{item.text}</span>
                      </div>
                    ))
                  )}
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
                  {query ? "Matching Companies" : "Popular Searches"}
                </h3>
                <div className="trending-list">
                  {companiesLoading ? (
                    <div className="trending-item">Loading companies...</div>
                  ) : companiesError ? (
                    <div className="trending-item">{companiesError}</div>
                  ) : filtered.length === 0 && query ? (
                    <div className="trending-item">No companies found</div>
                  ) : (
                    filtered.map((item, idx) => (
                      <div
                        key={idx}
                        className="trending-item"
                        onClick={() => handleSelect(item.text, item.companyData)}
                      >
                        <div className="trending-icon-box">
                          <i className={`fa-solid ${item.icon}`}></i>
                        </div>
                        <div className="trending-text-box">
                          <span className="trending-name">{item.text}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="search-overlay-content location-selection-view animated fadeIn">
              <h3 className="trending-title">Select Local City Area</h3>
              <div className="trending-list static-cities-vertical-scroll">
                {loading ? (
                  <div className="trending-item">Loading cities...</div>
                ) : cities.length > 0 ? (
                  cities.map((c, idx) => (
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
                  ))
                ) : (
                  <div className="trending-item">No cities available</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
