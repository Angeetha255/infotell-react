import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { apiService } from "../../services/api";
import "./CategoryPage.css";
import { formatCompanyName, removeDuplicates } from "../../utils/helpers";

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
  const { city: cityParam, query: queryParam } = useParams();
  const city = decodeURIComponent(cityParam || "");
  const query = decodeURIComponent(queryParam || "");
  const location = useLocation();

  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [listings, setListings] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [relatedCategories, setRelatedCategories] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [activeAds, setActiveAds] = useState([]);
  const [dismissedAdIds, setDismissedAdIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bannersFetched, setBannersFetched] = useState(false);
  const [listingsFetched, setListingsFetched] = useState(false);
  const [sidebarFetched, setSidebarFetched] = useState(false);

  const [sortBy, setSortBy] = useState("relevance");
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterTrust, setFilterTrust] = useState(false);
  const [filterQuickResponse, setFilterQuickResponse] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Lead form state
  const [leadForm, setLeadForm] = useState({ name: "", mobile: "", location: "" });

  const triggerLazyBannerFetch = async () => {
    if (banners.length === 0 && !bannersFetched) {
      setBannersFetched(true);
      try {
        const response = await apiService.banners.getByCategory(query);
        if (response.data) {
          setBanners(response.data);
        } else {
          setBanners([]);
        }
      } catch (error) {
        // Silently handle banner fetch errors - banners are optional
        // Don't log 404 errors to console as endpoint may not exist
        if (error.response?.status !== 404) {
          console.error('Banner fetch error:', error);
        }
        setBanners([]);
      }
    }
  };

  /* ── Two-step API flow for category-based company listing ──
   *  1. Call Businesses API → find businesses whose `category` matches the query
   *  2. Collect their `companyId` values
   *  3. Call Companies API → get company details for those IDs
   *  4. Display only those matching companies
   *  
   *  OR for subcategory search:
   *  1. Call Subcategories API → find subcategory matching the query
   *  2. Get parent category ID from subcategory
   *  3. Call Businesses API → find businesses whose `category` matches the parent category
   *  4. Collect their `companyId` values
   *  5. Call Companies API → get company details for those IDs
   *  6. Display only those matching companies
   */
  const triggerLazyListingFetch = async () => {
    if (allListings.length === 0 && !listingsFetched) {
      setListingsFetched(true);
      try {
        setLoading(true);

        // Check if this is a subcategory search from navigation state
        const isSubcategorySearch = location.state?.isSubcategorySearch;
        const parentCategoryId = location.state?.parentCategoryId;

        // Step 1: Check if the query is a subcategory
        const subcategoriesResponse = await apiService.subcategories.getAll();
        const subcategoriesArray = Array.isArray(subcategoriesResponse.data)
          ? subcategoriesResponse.data
          : (subcategoriesResponse.data?.subcategories || subcategoriesResponse.data?.data || []);

        const normalizedQuery = query.trim().toLowerCase();
        let matchedSubcategory = null;

        // If we have parentCategoryId from state, use it to find the subcategory
        if (isSubcategorySearch && parentCategoryId) {
          matchedSubcategory = subcategoriesArray.find(sub => {
            const subId = sub.id || sub._id;
            const subParentId = sub.categoryId || sub.parentId;
            const subName = (sub.name || sub.subcategoryName || '').trim();
            const cleanedSubName = subName.replace(/"/g, '').toLowerCase();
            return (String(subParentId) === String(parentCategoryId)) && 
                   (cleanedSubName === normalizedQuery || cleanedSubName.includes(normalizedQuery) || normalizedQuery.includes(cleanedSubName));
          });
        } else {
          // Otherwise, search by query
          matchedSubcategory = subcategoriesArray.find(sub => {
            const subName = (sub.name || sub.subcategoryName || '').trim();
            const cleanedSubName = subName.replace(/"/g, '').toLowerCase();
            return cleanedSubName.includes(normalizedQuery) || normalizedQuery.includes(cleanedSubName);
          });
        }

        let matchedBusinesses = [];
        let targetCategory = query;

        if (matchedSubcategory) {
          // If it's a subcategory, get the parent category
          const subParentId = matchedSubcategory.categoryId || matchedSubcategory.parentId || parentCategoryId;
          if (subParentId) {
            try {
              const categoryResponse = await apiService.categories.getById(subParentId);
              const category = categoryResponse.data;
              targetCategory = category.name || category.categoryName || query;
            } catch (catError) {
              console.error("Error fetching parent category:", catError);
              targetCategory = query;
            }
          }
        }

        // Step 2: Fetch all businesses from Businesses API
        const businessesResponse = await apiService.businesses.getAll();
        const businessesArray = Array.isArray(businessesResponse.data)
          ? businessesResponse.data
          : (businessesResponse.data?.data || businessesResponse.data?.businesses || []);

        // Step 3: Filter businesses whose `category` matches the target category (case-insensitive, trimmed)
        // The category field may contain multiple categories separated by commas
        const normalizedTargetCategory = targetCategory.trim().toLowerCase();
        console.log("Target category:", normalizedTargetCategory);
        console.log("Matched subcategory:", matchedSubcategory);
        
        matchedBusinesses = businessesArray.filter(biz => {
          const bizCategory = (biz.category || biz.categoryName || '').trim();
          // Remove double quotes from the entire string first
          const cleanedCategory = bizCategory.replace(/"/g, '');
          // Split by comma and trim each category name
          const categoryList = cleanedCategory.split(',').map(cat => cat.trim().toLowerCase());
          // Check if the target category exists in the list
          const categoryMatch = categoryList.includes(normalizedTargetCategory);

          // If it's a subcategory search, check if the business contains the subcategory
          if (matchedSubcategory) {
            const subcategoryName = (matchedSubcategory.name || matchedSubcategory.subcategoryName || '').trim().replace(/"/g, '').toLowerCase();
            console.log("Looking for subcategory:", subcategoryName);
            console.log("Business subcategory field:", biz.subcategory);
            console.log("Business subcategories field:", biz.subcategories);
            
            // Check subcategory field (string)
            const bizSubcategory = (biz.subcategory || '').trim().replace(/"/g, '').toLowerCase();
            const subcategoryMatch = bizSubcategory.includes(subcategoryName) || subcategoryName.includes(bizSubcategory);
            
            // Check subcategories field (array)
            let subcategoriesMatch = false;
            if (biz.subcategories && Array.isArray(biz.subcategories)) {
              subcategoriesMatch = biz.subcategories.some(sub => {
                const cleanedSub = (sub || '').trim().replace(/"/g, '').toLowerCase();
                return cleanedSub.includes(subcategoryName) || subcategoryName.includes(cleanedSub);
              });
            }
            
            console.log("Category match:", categoryMatch, "Subcategory match:", subcategoryMatch, "Subcategories match:", subcategoriesMatch);
            
            // Business must contain the subcategory (category match is optional for subcategory search)
            // This allows businesses that have the subcategory but may not have the parent category in their category field
            return subcategoryMatch || subcategoriesMatch;
          }
          
          // For category search, just check category match
          return categoryMatch;
        });

        // Collect unique companyId values from matched businesses
        const matchedCompanyIds = [...new Set(
          matchedBusinesses
            .map(biz => biz.companyId)
            .filter(id => id != null)
        )];

        if (matchedCompanyIds.length === 0) {
          setAllListings([]);
          setListings([]);
          setLoading(false);
          return;
        }

        // Step 3: Fetch all companies from Companies API
        const companiesResponse = await apiService.publicCompanies.getAll();
        const companiesArray = Array.isArray(companiesResponse.data)
          ? companiesResponse.data
          : (companiesResponse.data?.companies || companiesResponse.data?.data || []);

        // Step 4: Filter companies whose `id` is in the matchedCompanyIds list
        // AND whose `district` matches the selected city (case-insensitive, trimmed)
        const normalizedCity = city.trim().toLowerCase();
        const matchedCompanies = companiesArray.filter(company => {
          // Must be in the matched company IDs from businesses
          const idMatch =
            matchedCompanyIds.includes(company.id) ||
            matchedCompanyIds.includes(company._id) ||
            matchedCompanyIds.includes(String(company.id)) ||
            matchedCompanyIds.includes(String(company._id));

          // Must match the selected city by district
          const companyDistrict = (company.district || company.city || company.area || '').trim().toLowerCase();
          const cityMatch = companyDistrict === normalizedCity;

          return idMatch && cityMatch;
        });

        // Map to listing format
        const mappedListings = matchedCompanies.map(company => ({
          id: company.id,
          name: formatCompanyName(company.businessName || company.name),
          rating: company.rating || 0,
          ratingCount: company.reviewCount || 0,
          topTag: (company.verify || company.verified) ? "Verified" : null,
          location: company.address || company.area || "",
          distance: company.distance || 0,
          popularity: company.popularity || 0,
          years: company.established ? `${company.established} Years in Business` : "",
          tags: company.categories || [],
          phone: company.mobileNumber || company.phone || "",
          img: company.image || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400",
          isVerified: (company.verify === 1 || company.verified === 1 || company.verify === true || company.verified === true),
          isTrust: (company.trust === 1 || company.trusted === 1 || company.trust === true || company.trusted === true),
          isQuickResponse: (company.quick_response === 1 || company.quickResponse === 1 || company.quick_response === true || company.quickResponse === true),
          isTopRated: (company.top_rated === 1 || company.topRated === 1 || company.top_rated === true || company.topRated === true),
          // Store full company data for navigation
          companyData: company,
        }));

        setAllListings(mappedListings);
        setListings(mappedListings);
      } catch (error) {
        // Silently handle listing fetch errors
        if (error.response?.status !== 404) {
          console.error('Listing fetch error:', error);
        }
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const triggerLazySidebarFetch = async () => {
    if (relatedCategories.length === 0 && !sidebarFetched) {
      setSidebarFetched(true);
      try {
        // Fetch all categories to find related ones
        const categoriesResponse = await apiService.categories.getAll();
        
        if (categoriesResponse.data) {
          const categoriesArray = Array.isArray(categoriesResponse.data)
            ? categoriesResponse.data
            : (categoriesResponse.data.categories || categoriesResponse.data.data || []);
          
          // Find the current category
          const currentCategory = categoriesArray.find(cat => 
            (cat.name || cat.categoryName || '').toLowerCase() === query.toLowerCase()
          );
          
          // Get related categories (same parent or siblings)
          let related = [];
          if (currentCategory) {
            const parentId = currentCategory.parentId || currentCategory.categoryId;
            
            if (parentId) {
              // Get categories with same parent (siblings)
              related = categoriesArray
                .filter(cat => 
                  (cat.parentId === parentId || cat.categoryId === parentId) &&
                  cat.id !== currentCategory.id &&
                  (cat.name || cat.categoryName)
                )
                .slice(0, 8)
                .map(cat => ({
                  id: cat.id,
                  name: `${cat.name || cat.categoryName} in ${city}`,
                  count: `${cat.businessCount || 0} options`
                }));
            } else {
              // If no parent, show other categories as fallback
              related = categoriesArray
                .filter(cat => {
                  if (cat.id === currentCategory.id) return false;
                  return (cat.name || cat.categoryName);
                })
                .slice(0, 8)
                .map(cat => ({
                  id: cat.id,
                  name: `${cat.name || cat.categoryName} in ${city}`,
                  count: `${cat.businessCount || 0} options`
                }));
            }
            
            // Remove duplicates based on category name
            const uniqueRelated = removeDuplicates(related.map(cat => cat.name))
              .map(name => related.find(cat => cat.name === name))
              .filter(cat => cat);
            
            setRelatedCategories(uniqueRelated.slice(0, 8));
          } else {
            // Fallback: if current category not found, show first 8 other categories
            const fallbackRelated = categoriesArray
              .filter(cat => (cat.name || cat.categoryName) && 
                (cat.name || cat.categoryName).toLowerCase() !== query.toLowerCase())
              .slice(0, 8)
              .map(cat => ({
                id: cat.id,
                name: `${cat.name || cat.categoryName} in ${city}`,
                count: `${cat.businessCount || 0} options`
              }));
            
            const uniqueFallback = removeDuplicates(fallbackRelated.map(cat => cat.name))
              .map(name => fallbackRelated.find(cat => cat.name === name))
              .filter(cat => cat);
            
            setRelatedCategories(uniqueFallback.slice(0, 8));
          }

          // Fetch subcategories for the current category as related keywords
          // First, get the current category to find its ID
          const currentCategoryForSub = categoriesArray.find(cat => 
            (cat.name || cat.categoryName || '').toLowerCase() === query.toLowerCase()
          );
          
          if (currentCategoryForSub && currentCategoryForSub.id) {
            const subcategoriesResponse = await apiService.subcategories.getByCategory(currentCategoryForSub.id);
            
            if (subcategoriesResponse.data) {
              const subcategoriesArray = Array.isArray(subcategoriesResponse.data)
                ? subcategoriesResponse.data
                : (subcategoriesResponse.data.subcategories || subcategoriesResponse.data.data || []);
              
              if (subcategoriesArray.length > 0) {
                const subcategoryNames = subcategoriesArray
                  .map(sub => sub.name || sub.subcategoryName || sub.categoryName)
                  .filter(name => name);
                
                // Clean keywords: remove quotes and trim
                const cleanedKeywords = subcategoryNames.map(kw => {
                  let cleaned = (kw || '').trim();
                  // Remove surrounding double quotes
                  cleaned = cleaned.replace(/^"|"$/g, '');
                  // Remove surrounding single quotes
                  cleaned = cleaned.replace(/^'|'$/g, '');
                  return cleaned.trim();
                });
                
                const uniqueKeywords = removeDuplicates(cleanedKeywords);
                setKeywords(uniqueKeywords);
              } else {
                // If no subcategories exist, hide the Related Keywords section
                setKeywords([]);
              }
            } else {
              // If subcategories endpoint returns no data, hide the section
              setKeywords([]);
            }
          } else {
            // If current category not found, hide the section
            setKeywords([]);
          }
        } else {
          setRelatedCategories([]);
          setKeywords([]);
        }
      } catch (error) {
        // Silently handle sidebar fetch errors
        if (error.response?.status !== 404) {
          console.error('Sidebar fetch error:', error);
        }
        setRelatedCategories([]);
        setKeywords([]);
      }
    }
  };

  useEffect(() => {
    // Reset fetch flags AND data when city or query changes
    setBannersFetched(false);
    setListingsFetched(false);
    setSidebarFetched(false);
    // Clear existing data to force re-fetch (the lazy fetchers check for empty arrays)
    setBanners([]);
    setAllListings([]);
    setListings([]);
    setRelatedCategories([]);
    setKeywords([]);
    triggerLazyBannerFetch();
    triggerLazyListingFetch();
    triggerLazySidebarFetch();
  }, [city, query]);

  const handleDismissAd = (adId) => {
    setDismissedAdIds((prev) => [...prev, adId]);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    try {
      await apiService.leads.create(leadForm);
      alert("Thank you! Your requirements have been sent.");
      setLeadForm({ name: "", mobile: "", location: "" });
    } catch (error) {
      console.error("Error submitting lead:", error);
      alert("Failed to send requirements. Please try again.");
    }
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  /* ── Company card click: navigate to Company Details page ── */
  const handleCompanyClick = (item) => {
    const companyId = item.id || item.companyData?.id || 'details';
    navigate(`/company/${companyId}`, { state: { companyData: item.companyData } });
  };

  const processedListings = useMemo(() => {
    let output = [...listings];
    if (filterVerified) output = output.filter((item) => item.isVerified);
    if (filterTrust) output = output.filter((item) => item.isTrust);
    if (filterQuickResponse) output = output.filter((item) => item.isQuickResponse);
    if (filterTopRated) output = output.filter((item) => item.isTopRated);

    if (sortBy === "rating") output.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "popular") output.sort((a, b) => b.popularity - a.popularity);
    else if (sortBy === "distance") output.sort((a, b) => a.distance - b.distance);
    else output.sort((a, b) => b.id - a.id);

    return output;
  }, [listings, filterVerified, filterTrust, filterQuickResponse, filterTopRated, sortBy]);

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
              <span 
                className="breadcrumb-item"
                onClick={() => handleBreadcrumbClick('/')}
              >
                Home
              </span>
              {' > '}
              <span 
                className="breadcrumb-item"
                onClick={() => handleBreadcrumbClick(`/category/${encodeURIComponent(city)}/${encodeURIComponent(query)}`)}
              >
                {city}
              </span>
              {' > '}
              <span 
                className="breadcrumb-item"
                onClick={() => handleBreadcrumbClick(`/category/${encodeURIComponent(city)}/${encodeURIComponent(query)}`)}
              >
                {query}
              </span>
              {' > '}
              <span className="breadcrumb-current">
                {processedListings.length}+ Listings
              </span>
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
                ✅ Verified
              </button>

              <button
                className={`filter-chip ${filterTrust ? "active-chip" : ""}`}
                onClick={() => setFilterTrust(!filterTrust)}
              >
                🛡 Trust
              </button>

              <button
                className={`filter-chip ${filterQuickResponse ? "active-chip" : ""}`}
                onClick={() => setFilterQuickResponse(!filterQuickResponse)}
              >
                ⚡ Quick Response
              </button>

              <button
                className={`filter-chip ${filterTopRated ? "active-chip" : ""}`}
                onClick={() => setFilterTopRated(!filterTopRated)}
              >
                ⭐ Top Rated
              </button>
            </div>

            {/* Left Segment: Main Content Area */}
            <div className="category-main-scrollable">
              <LazyViewElement onVisible={triggerLazyListingFetch}>
                {loading ? (
                  <div className="empty-results-fallback">
                    <p>Loading listings...</p>
                  </div>
                ) : processedListings.length === 0 ? (
                  <div className="empty-results-fallback">
                    <p>No companies found</p>
                  </div>
                ) : (
                  processedListings.flatMap((item, index) => {
                    const items = [];
                    items.push(
                      <div
                        key={`listing-${item.id}`}
                        className="listing-card"
                        onClick={() => handleCompanyClick(item)}
                        style={{ cursor: 'pointer' }}
                      >
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
                          
                          {/* Company Badges */}
                          <div className="company-badges">
                            {item.isVerified && (
                              <span className="badge badge-verified">✅ Verified</span>
                            )}
                            {item.isTrust && (
                              <span className="badge badge-trusted">🛡 Trusted</span>
                            )}
                            {item.isQuickResponse && (
                              <span className="badge badge-quick-response">⚡ Quick Response</span>
                            )}
                            {item.isTopRated && (
                              <span className="badge badge-top-rated">⭐ Top Rated</span>
                            )}
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
                            <a href={`tel:${item.phone}`} className="btn-call" onClick={(e) => e.stopPropagation()}>
                              <i className="fa-solid fa-phone"></i> {item.phone}
                            </a>
                            <button className="btn-whatsapp" onClick={(e) => e.stopPropagation()}>
                              <i className="fa-brands fa-whatsapp"></i> WhatsApp
                            </button>
                            <button
                              className="btn-price"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompanyClick(item);
                              }}
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
                 
                {/* <div className="sidebar-card">
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
                </div> */} 

                {/* Related Categories */}
                <div className="related-categories-card-box">
                  <h3 className="sidebar-title">Related Categories</h3>
                  <div className="related-categories-vertical-stack">
                    {relatedCategories.length > 0 ? (
                      relatedCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="related-category-row-item"
                          onClick={() => {
                            const categoryName = cat.name.replace(` in ${city}`, '').trim();
                            navigate(`/category/${encodeURIComponent(city)}/${encodeURIComponent(categoryName)}`);
                          }}
                        >
                          <span className="related-cat-name-link">
                            {cat.name}
                          </span>
                          <i className="fa-solid fa-chevron-right related-cat-arrow"></i>
                        </div>
                      ))
                    ) : (
                      <p>No related categories available</p>
                    )}
                  </div>
                </div>

                {/* Related Keywords Widget Segment */}
                {keywords.length > 0 && (
                  <div className="related-keywords-card-box">
                    <h3 className="sidebar-title">Related Keywords</h3>
                    <div className="keywords-flex-wrap">
                      {keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="keyword-pill-tag"
                          onClick={() => navigate(`/category/${encodeURIComponent(city)}/${encodeURIComponent(kw)}`)}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </LazyViewElement>
          </div>
        </div>
      </div>
    </div>
  );
}