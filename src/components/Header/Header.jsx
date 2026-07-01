import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { setLoginOpen } from "../../store/store";
import { apiService } from "../../services/api";
import "./Header.css";
import { useDispatch } from "react-redux";
import { generateSlug } from "../../utils/helpers";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [showLocationView, setShowLocationView] = useState(false);
  const [popularSearches, setPopularSearches] = useState([]);
  const [cities, setCities] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Derive initial city from URL, localStorage, or empty
  const getInitialCity = () => {
    // Priority 1: URL path - handle both old (/category/city/query) and new (/city/category) patterns
    const oldCategoryMatch = location.pathname.match(/^\/category\/([^/]+)\/([^/]+)/);
    if (oldCategoryMatch) {
      return decodeURIComponent(oldCategoryMatch[1]);
    }
    const newCategoryMatch = location.pathname.match(/^\/([^/]+)\/([^/]+)$/);
    if (newCategoryMatch && !['login', 'company', 'product'].includes(newCategoryMatch[1])) {
      return decodeURIComponent(newCategoryMatch[1]);
    }
    // Priority 2: localStorage (persists across refresh for all pages)
    const storedCity = localStorage.getItem('infotell_selected_city');
    if (storedCity) {
      return storedCity;
    }
    // Priority 3: empty (will be filled from API default)
    return "";
  };

  const [city, setCity] = useState(getInitialCity());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  const inputRef = useRef(null);
  const dropRef = useRef(null);

  const isMobileSize = () => window.innerWidth < 1200;

  // Persist city to localStorage whenever it changes
  useEffect(() => {
    if (city) {
      localStorage.setItem('infotell_selected_city', city);
    }
  }, [city]);

  /* Fetch cities and popular searches from API */
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const citiesResponse = await apiService.cities.getAll();

        const citiesArray = Array.isArray(citiesResponse.data)
          ? citiesResponse.data
          : (citiesResponse.data?.districts || citiesResponse.data?.data || []);

        if (citiesArray.length > 0) {
          const citiesData = citiesArray.map(c => c.name || c.districtName || c.district);
          setCities(citiesData);
          // Only set city from API if city is not already set from URL or localStorage
          if (!city) {
            setCity(citiesData[0] || "");
          }
        } else {
          setCities([]);
          if (!city) {
            setCity("");
          }
        }

        setPopularSearches([]);
        setFiltered([]);

        await fetchCompanies();
        await fetchBusinesses();
        await fetchSubcategories();
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setCities([]);
        if (!city) {
          setCity("");
        }
        setPopularSearches([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    setCompaniesError(null);
    try {
      const response = await apiService.publicCompanies.getAll();
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

  const fetchBusinesses = async () => {
    setBusinessesLoading(true);
    try {
      const response = await apiService.businesses.getAll();
      const businessesArray = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || response.data?.businesses || []);
      setBusinesses(businessesArray);
      
      // Populate popular searches with individual categories from businesses
      const allCategories = [];
      businessesArray.forEach(biz => {
        const bizCategory = (biz.category || biz.categoryName || '').trim();
        if (bizCategory) {
          // Remove double quotes from the entire string first
          const cleanedCategory = bizCategory.replace(/"/g, '');
          // Split by comma and trim each category
          const categoryList = cleanedCategory.split(',').map(cat => cat.trim()).filter(cat => cat);
          categoryList.forEach(cat => {
            allCategories.push(cat);
          });
        }
      });
      
      // Remove duplicates and set as popular searches
      const uniqueCategories = [...new Set(allCategories)];
      const popularCategories = uniqueCategories.map(cat => ({
        text: cat,
        icon: 'fa-tag',
        companyData: null,
        type: 'category'
      }));
      setPopularSearches(popularCategories);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      setBusinesses([]);
    } finally {
      setBusinessesLoading(false);
    }
  };

  const fetchSubcategories = async () => {
    setSubcategoriesLoading(true);
    try {
      const response = await apiService.subcategories.getAll();
      const subcategoriesArray = Array.isArray(response.data)
        ? response.data
        : (response.data?.subcategories || response.data?.data || []);
      setSubcategories(subcategoriesArray);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  /* Sync city from URL when on a category page */
  useEffect(() => {
    const categoryMatch = location.pathname.match(/^\/category\/([^/]+)\/([^/]+)/);
    if (categoryMatch) {
      const urlCity = decodeURIComponent(categoryMatch[1]);
      if (urlCity && urlCity !== city) {
        setCity(urlCity);
      }
    }
  }, [location.pathname]);

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
    
    const filteredCompanies = companies.filter((company) => {
      const districtMatch = company.district === city;
      const nameMatch = company.businessName && 
        company.businessName.toLowerCase().includes(val.toLowerCase());
      return districtMatch && nameMatch;
    });
    
    const mappedFiltered = filteredCompanies.map((company) => ({
      text: company.businessName,
      icon: 'fa-building',
      companyData: company,
      type: 'company'
    }));

    if (val.trim().length > 0) {
      const normalizedVal = val.trim().toLowerCase();
      
      // Split comma-separated categories from all businesses and collect individual categories
      const allCategories = [];
      businesses.forEach(biz => {
        const bizCategory = (biz.category || biz.categoryName || '').trim();
        if (bizCategory) {
          // Remove double quotes from the entire string first
          const cleanedCategory = bizCategory.replace(/"/g, '');
          // Split by comma and trim each category
          const categoryList = cleanedCategory.split(',').map(cat => cat.trim()).filter(cat => cat);
          categoryList.forEach(cat => {
            allCategories.push(cat);
          });
        }
      });
      
      // Filter categories that match the search value
      const matchedCategories = [...new Set(
        allCategories.filter(cat => cat.toLowerCase().includes(normalizedVal))
      )];

      matchedCategories.forEach(catName => {
        const alreadyExists = mappedFiltered.some(item => 
          item.text.toLowerCase() === catName.toLowerCase()
        );
        if (!alreadyExists) {
          mappedFiltered.push({
            text: catName,
            icon: 'fa-tag',
            companyData: null,
            type: 'category'
          });
        }
      });

      // Check for subcategory matches
      const matchedSubcategories = subcategories.filter(sub => {
        const subName = (sub.name || sub.subcategoryName || '').trim();
        // Remove double quotes before comparison
        const cleanedSubName = subName.replace(/"/g, '').toLowerCase();
        return cleanedSubName.includes(normalizedVal);
      });

      matchedSubcategories.forEach(sub => {
        const subName = (sub.name || sub.subcategoryName || '').trim();
        // Remove double quotes from display name
        const cleanedSubName = subName.replace(/"/g, '');
        const alreadyExists = mappedFiltered.some(item => 
          item.text.toLowerCase() === cleanedSubName.toLowerCase()
        );
        if (!alreadyExists) {
          mappedFiltered.push({
            text: cleanedSubName,
            icon: 'fa-tags',
            companyData: null,
            type: 'subcategory',
            subcategoryData: sub
          });
        }
      });
    }
    
    setFiltered(mappedFiltered);
    setShowDrop(val.length > 0);
  };

  const updateCategoryPageCity = (newCity) => {
    const oldCategoryMatch = location.pathname.match(/^\/category\/([^/]+)\/([^/]+)/);
    if (oldCategoryMatch) {
      const query = oldCategoryMatch[2];
      navigate(`/category/${encodeURIComponent(newCity)}/${encodeURIComponent(query)}`, { replace: true });
    } else {
      const newCategoryMatch = location.pathname.match(/^\/([^/]+)\/([^/]+)$/);
      if (newCategoryMatch && !['login', 'company', 'product'].includes(newCategoryMatch[1])) {
        const query = newCategoryMatch[2];
        navigate(`/${generateSlug(newCity)}/${generateSlug(query)}`, { replace: true });
      }
    }
  };

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setCity(newCity);
    updateCategoryPageCity(newCity);
  };

  const handleCitySelectInOverlay = (selectedCity) => {
    setCity(selectedCity);
    setShowLocationView(false);
    updateCategoryPageCity(selectedCity);
  };

  const handleSelect = (text, companyData = null, type = 'company', subcategoryData = null) => {
    setShowDrop(false);
    setIsMobileModalOpen(false);

    if (city !== undefined && text !== undefined && text.trim() !== "") {
      setQuery(text.trim());

      if (type === 'subcategory' && subcategoryData) {
        // For subcategory, navigate with the subcategory name itself
        // Pass parent category ID in state for filtering
        const parentCategoryId = subcategoryData.categoryId || subcategoryData.parentId;
        navigate(`/${generateSlug(city)}/${generateSlug(text.trim())}`, {
          state: { isSubcategorySearch: true, parentCategoryId }
        });
      } else if (type === 'category') {
        navigate(`/${generateSlug(city)}/${generateSlug(text.trim())}`);
      } else if (companyData) {
        const companyName = companyData.businessName || companyData.name || '';
        const companySlug = generateSlug(companyName);
        navigate(`/${companySlug}`, { state: { companyData } });
      } else {
        const trimmedText = text.trim();
        const matchingCompanies = companies.filter((company) => {
          const districtMatch = company.district === city;
          const nameMatch = company.businessName && 
            company.businessName.toLowerCase().includes(trimmedText.toLowerCase());
          return districtMatch && nameMatch;
        });
        
        if (matchingCompanies.length > 0) {
          const company = matchingCompanies[0];
          const companyName = company.businessName || company.name || '';
          const companySlug = generateSlug(companyName);
          navigate(`/${companySlug}`, { state: { companyData: company } });
        } else {
          navigate(`/${generateSlug(city)}/${generateSlug(trimmedText)}`);
        }
      }
    }
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
      
      const matchingCompanies = companies.filter((company) => {
        const districtMatch = company.district === city;
        const nameMatch = company.businessName && 
          company.businessName.toLowerCase().includes(trimmedQuery.toLowerCase());
        return districtMatch && nameMatch;
      });
      
      if (matchingCompanies.length > 0) {
        const company = matchingCompanies[0];
        const companyName = company.businessName || company.name || '';
        const companySlug = generateSlug(companyName);
        navigate(`/${companySlug}`, { state: { companyData: company } });
      } else {
        navigate(`/${generateSlug(city)}/${generateSlug(trimmedQuery)}`);
      }
    }
  };

  return (
    <>
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container header-inner">
          <div className="brand-row">
            <Link to="/" className="brand-link">
              <div className="brand-name">Infotell</div>
            </Link>
          </div>

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
                  onChange={handleCityChange}
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

              {showDrop && (
                <div className="search-dropdown" id="searchDropdown">
                  <div className="search-dropdown-label">
                    {query ? "Matching Results" : "Popular Searches"}
                  </div>
                  {companiesLoading || businessesLoading ? (
                    <div className="search-item">Loading...</div>
                  ) : companiesError ? (
                    <div className="search-item">{companiesError}</div>
                  ) : filtered.length === 0 && query ? (
                    <div className="search-item">No results found</div>
                  ) : (
                    filtered.map((item, idx) => (
                      <div
                        key={idx}
                        className="search-item"
                        onClick={() => handleSelect(item.text, item.companyData, item.type, item.subcategoryData)}
                      >
                        <i className={`fa-solid ${item.icon}`}></i>
                        <span>
                          {item.text}
                          {item.type === 'category' && (
                            <span className="search-item-type-badge" style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>Category</span>
                          )}
                          {item.type === 'subcategory' && (
                            <span className="search-item-type-badge" style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>Subcategory</span>
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

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
                  {companiesLoading || businessesLoading ? (
                    <div className="trending-item">Loading...</div>
                  ) : companiesError ? (
                    <div className="trending-item">{companiesError}</div>
                  ) : filtered.length === 0 && query ? (
                    <div className="trending-item">No results found</div>
                  ) : (
                    filtered.map((item, idx) => (
                      <div
                        key={idx}
                        className="trending-item"
                        onClick={() => handleSelect(item.text, item.companyData, item.type, item.subcategoryData)}
                      >
                        <div className="trending-icon-box">
                          <i className={`fa-solid ${item.icon}`}></i>
                        </div>
                        <div className="trending-text-box">
                          <span className="trending-name">
                            {item.text}
                            {item.type === 'category' && (
                              <span className="search-item-type-badge" style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>Category</span>
                            )}
                            {item.type === 'subcategory' && (
                              <span className="search-item-type-badge" style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>Subcategory</span>
                            )}
                          </span>
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