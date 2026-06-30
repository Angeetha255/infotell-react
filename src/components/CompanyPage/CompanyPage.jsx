import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiService } from '../../services/api';
import './CompanyPage.css';
import ReviewRating from '../ReviewRating/ReviewRating';
import ImageCardXFlow from '../ImageCardXFlow/ImageCardXFlow';
import ShareButton from '../ShareButton/ShareButton';

const TABS = ['Overview', 'Photos', 'Catalogue', 'Reviews'];
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';
const BACKEND_BASE_URL = 'http://localhost:5006';

export default function CompanyPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Overview');
  const [companyData, setCompanyData] = useState(null);
  const [businessHours, setBusinessHours] = useState(null);
  const [companyDescription, setCompanyDescription] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [businessesError, setBusinessesError] = useState(null);
  const [products, setProducts] = useState([]);

  // Login & Review Form States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Resolve relative image path to full URL
  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${BACKEND_BASE_URL}/uploads/${imagePath}`;
  };

  // Fetch company data on mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      setLoading(true);
      let resolvedCompanyId = null;
      try {
        // Check if company data is passed via navigation state
        if (location.state?.companyData) {
          setCompanyData(location.state.companyData);
          resolvedCompanyId = location.state.companyData.id || id;
          
          // Fetch reviews for this company
          try {
            const reviewsResponse = await apiService.reviews.getByBusiness(id);
            if (reviewsResponse.data) {
              const mappedReviews = reviewsResponse.data.map(r => ({
                id: r.id,
                name: r.userName,
                pic: r.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
                rating: r.rating,
                comment: r.comment
              }));
              setReviews(mappedReviews);
            }
          } catch (reviewError) {
            // Silently handle reviews fetch errors - reviews are optional
            setReviews([]);
          }
        } else {
          // Fetch from Public Companies API using ID
          const response = await apiService.publicCompanies.getById(id);
          if (response.data) {
            setCompanyData(response.data);
            resolvedCompanyId = response.data.id || id;

            // Fetch reviews for this company
            try {
              const reviewsResponse = await apiService.reviews.getByBusiness(id);
              if (reviewsResponse.data) {
                const mappedReviews = reviewsResponse.data.map(r => ({
                  id: r.id,
                  name: r.userName,
                  pic: r.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
                  rating: r.rating,
                  comment: r.comment
                }));
                setReviews(mappedReviews);
              }
            } catch (reviewError) {
              // Silently handle reviews fetch errors - reviews are optional
              setReviews([]);
            }
          }
        }

        // Fetch businesses data to get business hours
        setBusinessesLoading(true);
        setBusinessesError(null);
        try {
          const businessesResponse = await apiService.publicBusinesses.getAll();
          if (businessesResponse.data) {
            const businessesArray = Array.isArray(businessesResponse.data)
              ? businessesResponse.data
              : (businessesResponse.data.data || businessesResponse.data.businesses || []);
            
            // Determine the company identifier to match
            const companyId = companyData?.id || location.state?.companyData?.id || id;
            
            // Try to match by companyId first, then businessId, then id
            const matchedBusiness = businessesArray.find(b => 
              (b.companyId && String(b.companyId) === String(companyId)) ||
              (b.businessId && String(b.businessId) === String(companyId)) ||
              (b.id && String(b.id) === String(companyId))
            );
            
            if (matchedBusiness) {
              if (matchedBusiness.businessHours) {
                setBusinessHours(matchedBusiness.businessHours);
              } else if (matchedBusiness.hours) {
                setBusinessHours(matchedBusiness.hours);
              } else {
                setBusinessHours(null);
              }
              // Fetch description from businesses API
              if (matchedBusiness.description) {
                setCompanyDescription(matchedBusiness.description);
              }
            } else {
              setBusinessHours(null);
            }
          }
        } catch (bizError) {
          console.error("Error fetching businesses data:", bizError);
          setBusinessesError("Failed to load business hours");
          setBusinessHours(null);
        } finally {
          setBusinessesLoading(false);
        }

        // Fetch all products and filter by companyId
        try {
          const productsResponse = await apiService.products.getAll();
          if (productsResponse.data) {
            // The API returns { products: [...] } structure
            const productsArray = Array.isArray(productsResponse.data)
              ? productsResponse.data
              : (productsResponse.data.products || productsResponse.data.data || []);
            
            // Filter products to only show those matching the current company
            const companyIdNum = resolvedCompanyId ? Number(resolvedCompanyId) : null;
            const filteredProducts = companyIdNum
              ? productsArray.filter(p => Number(p.companyId) === companyIdNum)
              : productsArray;
            
            setProducts(filteredProducts);

            // Extract gallery images from filtered products
            const allGalleryImages = [];
            filteredProducts.forEach(product => {
              if (product.gallery && Array.isArray(product.gallery)) {
                product.gallery.forEach(img => {
                  if (img) {
                    allGalleryImages.push(resolveImageUrl(img));
                  }
                });
              }
            });
            setGalleryImages(allGalleryImages);
          }
        } catch (prodError) {
          console.error("Error fetching products:", prodError);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id || location.state?.companyData) {
      fetchCompanyData();
    }
  }, [id, location.state]);

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  
  const fileRef = useRef(null);

  const handleEmailSignIn = (e) => {
    e.preventDefault();
    if (!userEmail.trim() || !userEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setAuthLoading(true);
    // Simulate API authorization response latency
    setTimeout(() => {
      setIsLoggedIn(true);
      setAuthLoading(false);
    }, 800);
  };

  const handleReviewSubmission = async (e) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) {
      alert('Please fill out both your user name and review text.');
      return;
    }

    try {
      const response = await apiService.reviews.create({
        businessId: id,
        userName: newReviewName,
        rating: parseInt(newReviewRating),
        comment: newReviewComment
      });

      if (response.data) {
        const compiledReviewObj = {
          id: response.data.id,
          name: newReviewName,
          pic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
          rating: parseInt(newReviewRating),
          comment: newReviewComment
        };

        setReviews([compiledReviewObj, ...reviews]);
        setNewReviewName('');
        setNewReviewComment('');
        setNewReviewRating(5);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const handleProductNavigation = (productId) => {
    navigate(`/product/${productId}`, { 
      state: { 
        city: companyData?.city || companyData?.district || 'Madurai', 
        company: companyData?.name || companyData?.businessName || 'Company',
        companyId: companyData?.id || id,
        category: companyData?.category || ''
      } 
    });
  };

  // Helper function to determine open status from businessHours
  const getOpenStatus = (hoursData) => {
    if (!hoursData || typeof hoursData !== 'object') {
      return "Business hours not available";
    }

    const now = new Date();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = daysOfWeek[now.getDay()]; // e.g., "monday"
    
    // Capitalize first letter for matching API format: "Monday", "Tuesday", etc.
    const apiDayKey = currentDayName.charAt(0).toUpperCase() + currentDayName.slice(1);

    // Try to match the current day in the businessHours object
    const todayHours = hoursData[apiDayKey] || hoursData[currentDayName] || hoursData[currentDayName.toLowerCase()];

    if (!todayHours || typeof todayHours !== 'object') {
      return "Closed";
    }

    // Check if it's a working day
    if (todayHours.isWorkingDay === false) {
      return "Closed";
    }

    const openTime = todayHours.openTime || todayHours.open || todayHours.start;
    const closeTime = todayHours.closeTime || todayHours.close || todayHours.end;

    if (!openTime || !closeTime) {
      return "Closed";
    }

    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    if (isNaN(openHour) || isNaN(openMin) || isNaN(closeHour) || isNaN(closeMin)) {
      return "Closed";
    }

    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (currentTime >= openMinutes && currentTime < closeMinutes) {
      return "Open Now";
    }

    return "Closed";
  };

  // Map products from API to the format expected by ImageCardXFlow
  const mappedProducts = products.map(p => {
    // Resolve image URLs using the backend base URL
    const resolveProductImages = (images) => {
      if (images && Array.isArray(images) && images.length > 0) {
        return images.map(img => resolveImageUrl(img));
      }
      return null;
    };

    const resolvedCoverImage = resolveImageUrl(p.coverImage);
    const resolvedProductImages = resolveProductImages(p.productImages);

    // Build images array: always include coverImage first, then add productImages
    let images = [];
    if (resolvedCoverImage) {
      images.push(resolvedCoverImage);
    }
    if (resolvedProductImages && resolvedProductImages.length > 0) {
      // Only add productImages that are not duplicates of coverImage
      resolvedProductImages.forEach(img => {
        if (!images.includes(img)) {
          images.push(img);
        }
      });
    }
    if (images.length === 0) {
      images = [PLACEHOLDER_IMAGE];
    }

    // Determine display price
    const displayPrice = p.discountPrice || p.productMrp || p.price || '';

    return {
      id: p.id,
      name: p.productName || 'Product',
      price: displayPrice ? `₹${displayPrice}` : '',
      images: images,
      // Structured price data for new price layout
      productMrp: p.productMrp,
      discountPrice: p.discountPrice,
      discountPercentage: p.discountPercentage,
      priceFlag: p.displayPrice !== false
    };
  });

  const rawAggregateScore = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const evaluatedAverageRating = reviews.length > 0 ? (rawAggregateScore / reviews.length).toFixed(1) : "0.0";

  if (loading) {
    return <div className="company-page"><div className="container"><p>Loading company details...</p></div></div>;
  }

  if (!companyData) {
    return <div className="company-page"><div className="container"><p>Company not found.</p></div></div>;
  }

  return (
    <div className="company-page">
      <div className="container company-layout">
        <div className="row company-layout-row">

          {/* ── LEFT COLUMN SEGMENT: SCROLLABLE MAIN DATA CONTAINER ── */}
          <div className="col-lg-8 company-main-scrollable">

            {/* Profile Primary Summary Card */}
            <div className="profile-card">
              <div className="profile-header">
                <div>
                  <h1 className="profile-name">
                    {companyData.businessName || companyData.name}
                    {companyData.verified && <i className="fas fa-check-circle verified-badge-icon"></i>}
                  </h1>
                  <div className="profile-rating-row">
                    <span className="profile-rating-badge">{evaluatedAverageRating} ★</span>
                    <span className="profile-rating-text">{reviews.length} Ratings Verified | Claimed Account</span>
                  </div>
                  <div className="profile-location">
                    <i className="fas fa-map-marker-alt"></i> {companyData.area && companyData.district && companyData.state ? `${companyData.area}, ${companyData.district}, ${companyData.state}` : (companyData.address || "Address not available")} &nbsp;•&nbsp;
                    <span className="open-status">{getOpenStatus(businessHours)}</span>
                  </div>
                </div>
                <button className="btn-wishlist" aria-label="Bookmark Workspace">
                  <i className="far fa-heart"></i>
                </button>
              </div>

              <div className="company-actions">
                <a href={`tel:${companyData.mobileNumber || companyData.phone || ''}`} className="btn-company-call">
                  <i className="fas fa-phone"></i> {companyData.mobileNumber || companyData.phone || "Phone not available"}
                </a>
                <button className="btn-enquire">
                  Enquire Now
                </button>
                <button className="btn-company-whatsapp">
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button className="btn-share">
                  <ShareButton
                    title={companyData.businessName || companyData.name}
                    text={`Check out this company: ${companyData.businessName || companyData.name}!`}
                    url={window.location.href}
                  />
                </button>
              </div>

              {/* Functional Component Context Tab Navigation */}
              <div className="company-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    className={`company-tab${activeTab === tab ? ' active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* DYNAMIC FUNCTIONAL VIEWPORT ROUTER CONTAINER */}
              <div className="tab-render-window">
                
                {/* VIEW 1: OVERVIEW COMPONENT BLOCK */}
                {activeTab === 'Overview' && (
                  <div className="tab-pane-content animation-fade-in">
                    <p className="tab-body-description">{companyDescription || companyData.description || "No description available."}</p>
                  </div>
                )}

                {/* VIEW 2: PHOTOS GRID LAYOUT COMPONENT */}
                {activeTab === 'Photos' && (
                  <div className="tab-pane-content animation-fade-in">
                    <div className="photos-thumbnail-bounded-matrix">
                      {galleryImages.length > 0 ? (
                        galleryImages.map((src, idx) => (
                          <div key={idx} className="strict-photo-box-card">
                            <img src={src} alt={`Gallery Image ${idx + 1}`} />
                          </div>
                        ))
                      ) : (
                        <p>No photos available</p>
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW 3: CATALOGUE MANAGEMENT PIPELINE COMPONENT */}
                {activeTab === 'Catalogue' && (
                  <div className="tab-pane-content animation-fade-in">
                    <div className="catalogue-grid-layout">
                      {companyData.catalogue && companyData.catalogue.length > 0 ? (
                        companyData.catalogue.map((catItem) => (
                          <div key={catItem.id} className="catalogue-interactive-card">
                            <div className="catalogue-img-frame">
                              <img src={catItem.src} alt={catItem.title} />
                            </div>
                            <div className="catalogue-details-panel">
                              <h6 className="catalogue-item-title">{catItem.title}</h6>
                              <button className="catalogue-download-action-btn" onClick={() => alert(`Downloading Brochure PDF...`)}>
                                <i className="fas fa-arrow-alt-circle-down"></i> Download Brochure PDF
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No catalogue items available</p>
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW 4: ACTIVE REVIEWS DISPLAY LIST LAYER */}
                {activeTab === 'Reviews' && (
                  <div className="tab-pane-content animation-fade-in">
                    <div className="reviews-vertical-feed-stack">
                      {reviews.length === 0 ? (
                        <p className="empty-state-text">No verified feedback has been indexed for this facility yet.</p>
                      ) : (
                        reviews.map((rev) => (
                          <div key={rev.id} className="review-row-feed-item">
                            <img className="review-user-avatar" src={rev.pic} alt={rev.name} />
                            <div className="review-feed-meta-box">
                              <div className="review-user-header-line">
                                <span className="review-feed-username">{rev.name}</span>
                                <span className="review-feed-stars-badge">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                              </div>
                              <p className="review-feed-body-comment">{rev.comment}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* PRODUCT LISTING CARD CAROUSEL - Only render if products exist */}
            {mappedProducts.length > 0 && (
              <ImageCardXFlow cardTitle={"Product"} DATAS={mappedProducts} onCardClick={handleProductNavigation} />
            )}

            {/* ESTABLISHMENT DATA SEGMENT SECTION CARD */}
            <div className="profile-card">
              <h2 className="section-card-heading">Establishment Track Profile</h2>
              <div className="establishment-details-grid">
                <div className="establishment-grid-node">
                  <span className="establishment-node-label">Year of Corporate Registration</span>
                  <span className="establishment-node-value">{companyData.established || "N/A"}</span>
                </div>
                <div className="establishment-grid-node">
                  <span className="establishment-node-label">Current Operational Scale Status</span>
                  <span className="establishment-node-value verified-accent-text">{companyData.verified ? "Fully Verified & Compliant" : "Pending Verification"}</span>
                </div>
                <div className="establishment-grid-node">
                  <span className="establishment-node-label">Entity Classification Hierarchy</span>
                  <span className="establishment-node-value">{companyData.category || "Business"}</span>
                </div>
              </div>
            </div>

            {/* REVIEW & RATING SECTION WITH CONDITIONAL EMAIL VERIFICATION GATEWAY */}
            <ReviewRating reviewType={'company'}/>

          </div>

          {/* ── RIGHT COLUMN SEGMENT: STICKY/FIXED METADATA ENCLOSURE AREA ── */}
          <div className="col-lg-4 company-sidebar-fixed">
            <div className="sidebar-sticky-enclosure-stack">
              
              {/* Box Segment 1: Business Information */}
              <div className="company-sidebar-card">
                <h4 className="company-sidebar-title">Business Information</h4>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-building sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Business Name</div>
                    <div className="sidebar-info-value">{companyData.businessName || companyData.name || "N/A"}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-user sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Owner Name</div>
                    <div className="sidebar-info-value">{companyData.ownerName || "N/A"}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-envelope sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Email</div>
                    <div className="sidebar-info-value">{companyData.email || "N/A"}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-phone sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Mobile Number</div>
                    <div className="sidebar-info-value">{companyData.mobileNumber || companyData.phone || "N/A"}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-calendar-alt sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Year of Establishment</div>
                    <div className="sidebar-info-value">{companyData.yearOfEstablishment || companyData.established || "N/A"}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-file-invoice sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">GST Number</div>
                    <div className="sidebar-info-value">{companyData.gstNumber || "N/A"}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-chart-line sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Yearly Turnover</div>
                    <div className="sidebar-info-value">{companyData.yearlyTurnover || "N/A"}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-users sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Number of Employees</div>
                    <div className="sidebar-info-value">{companyData.numberOfEmployees || "N/A"}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-map-marker-alt sidebar-info-icon"></i></div>
                  <div className="sidebar-info-value-full">
                    <div className="sidebar-info-label">Address</div>
                    <div className="address-single-row">
                      <span className="address-field">{companyData.country || "N/A"}</span>
                      <span className="address-separator">,</span>
                      <span className="address-field">{companyData.state || "N/A"}</span>
                      <span className="address-separator">,</span>
                      <span className="address-field">{companyData.district || "N/A"}</span>
                      <span className="address-separator">,</span>
                      <span className="address-field">{companyData.area || "N/A"}</span>
                      <span className="address-separator">,</span>
                      <span className="address-field">{companyData.pincode || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {companyData.mapLink && (
                  <div className="sidebar-info-row">
                    <div className="sidebar-info-icon-container"><i className="fas fa-directions sidebar-info-icon"></i></div>
                    <div>
                      <div className="sidebar-info-label">Map Link</div>
                      <div className="sidebar-info-value">
                        <a href={companyData.mapLink} target="_blank" rel="noopener noreferrer" className="map-link">
                          View on Map
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Box Segment 2: Relevant Categories Layout */}
              <div className="company-sidebar-card">
                <h4 className="company-sidebar-title">Relevant Categories</h4>
                <div className="sidebar-vertical-navigation-links">
                  {companyData.relatedCategories && companyData.relatedCategories.length > 0 ? (
                    companyData.relatedCategories.map((category) => (
                      <div key={category.id} className="sidebar-navigation-row-link" onClick={() => alert(`Redirecting to node directory index: ${category.name}`)}>
                        <span className="nav-row-text-label">{category.name}</span>
                        <i className="fas fa-chevron-right nav-row-arrow-indicator"></i>
                      </div>
                    ))
                  ) : (
                    <p>No related categories available</p>
                  )}
                </div>
              </div>

              {/* Box Segment 3: Relevant Keywords Widget Section */}
              <div className="company-sidebar-card">
                <h4 className="company-sidebar-title">Relevant Keywords</h4>
                <div className="sidebar-keywords-flex-matrix-dock">
                  {companyData.relatedKeywords && companyData.relatedKeywords.length > 0 ? (
                    companyData.relatedKeywords.map((keyword, i) => (
                      <span key={i} className="sidebar-keyword-pill-tag-node" onClick={() => alert(`Executing automated directory index database fetch for keyword token: #${keyword}`)}>
                        #{keyword}
                      </span>
                    ))
                  ) : (
                    <p>No keywords available</p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}