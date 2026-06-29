import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";
import "./ProductPage.css";
import ReviewRating from "../ReviewRating/ReviewRating";
import ImageCardXFlow from "../ImageCardXFlow/ImageCardXFlow";
import ShareButton from "../ShareButton/ShareButton";

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';
const BACKEND_BASE_URL = 'http://localhost:5006';

export default function ProductPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const city = searchParams.get('city') || 'Madurai';
  const company = searchParams.get('company') || 'Company';
  const productId = searchParams.get('product');

  const [productData, setProductData] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [userComments, setUserComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI State hooks
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(2);

  const thumbnailScrollContainerRef = useRef(null);

  // SVG Circular progress configurations
  const satisfactionScore = 92;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (satisfactionScore / 100) * circumference;

  // Resolve relative image path to full URL
  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${BACKEND_BASE_URL}/uploads/${imagePath}`;
  };

  // Build media array: always include coverImage first, then add productImages, fall back to placeholder
  const buildMediaArray = (product) => {
    const images = [];
    const resolvedCoverImage = resolveImageUrl(product.coverImage);
    if (resolvedCoverImage) {
      images.push(resolvedCoverImage);
    }
    if (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0) {
      product.productImages.forEach(img => {
        const resolved = resolveImageUrl(img);
        if (resolved && !images.includes(resolved)) {
          images.push(resolved);
        }
      });
    }
    if (images.length === 0) {
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        product.images.forEach(img => {
          const resolved = resolveImageUrl(img);
          if (resolved && !images.includes(resolved)) {
            images.push(resolved);
          }
        });
      } else if (product.image) {
        const resolved = resolveImageUrl(product.image);
        if (resolved) images.push(resolved);
      }
    }
    if (images.length === 0) {
      images.push(PLACEHOLDER_IMAGE);
    }
    return images;
  };

  // Scroll thumbnails left/right
  const handleScrollThumbnails = (direction) => {
    if (thumbnailScrollContainerRef.current) {
      const scrollAmount = 120;
      const currentScroll = thumbnailScrollContainerRef.current.scrollLeft;
      thumbnailScrollContainerRef.current.scrollTo({
        left: direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Fetch product data on mount
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Fetch product details
        const productResponse = await apiService.products.getById(productId);
        if (productResponse.data) {
          setProductData(productResponse.data);

          // Fetch similar products
          const similarResponse = await apiService.products.getByCategory(productResponse.data.categoryId);
          if (similarResponse.data) {
            const similarArray = Array.isArray(similarResponse.data)
              ? similarResponse.data
              : (similarResponse.data.products || similarResponse.data.data || []);
            
            const mappedSimilar = similarArray
              .filter(p => p.id !== productId)
              .slice(0, 5)
              .map(p => {
                let simImages;
                if (p.productImages && Array.isArray(p.productImages) && p.productImages.length > 0) {
                  simImages = p.productImages.map(img => resolveImageUrl(img));
                } else if (p.coverImage) {
                  simImages = [resolveImageUrl(p.coverImage)];
                } else if (p.images && p.images.length > 0) {
                  simImages = p.images.map(img => resolveImageUrl(img));
                } else if (p.image) {
                  simImages = [resolveImageUrl(p.image)];
                } else {
                  simImages = [PLACEHOLDER_IMAGE];
                }
                const displayPrice = p.discountPrice || p.productMrp || p.price || '';
                return {
                  id: p.id,
                  name: p.productName || p.name || 'Product',
                  price: displayPrice ? `₹${displayPrice}` : '',
                  images: simImages
                };
              });
            setSimilarProducts(mappedSimilar);
          }

          // Fetch company info
          if (productResponse.data.businessId) {
            const companyResponse = await apiService.businesses.getById(productResponse.data.businessId);
            if (companyResponse.data) {
              setCompanyInfo(companyResponse.data);
            }
          }

          // Fetch product reviews
          const reviewsResponse = await apiService.reviews.getByProduct(productId);
          if (reviewsResponse.data) {
            const mappedComments = reviewsResponse.data.map(r => ({
              id: r.id,
              user: r.userName,
              rating: r.rating,
              date: new Date(r.createdAt).toLocaleDateString(),
              text: r.comment
            }));
            setUserComments(mappedComments);
          }
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductData();
    }
  }, [productId]);

  const handleShowMoreComments = () => {
    setVisibleCommentsCount((prev) => Math.min(prev + 2, userComments.length));
  };

  const handleProductNavigation = (productId) => {
    navigate(`/product?city=${city || 'Madurai'}&company=${company || 'Company'}&product=${productId}`);
  };

  if (loading) {
    return <div className="pdp-v4-root-wrapper"><div className="container"><p>Loading product details...</p></div></div>;
  }

  if (!productData) {
    return <div className="pdp-v4-root-wrapper"><div className="container"><p>Product not found.</p></div></div>;
  }

  const displayPrice = productData.discountPrice || productData.productMrp || productData.price || '';

  const productEntity = {
    name: productData.productName || productData.name || 'Product',
    price: displayPrice ? `₹${displayPrice}` : '',
    description: productData.description,
    specs: productData.specs || [],
    media: buildMediaArray(productData)
  };

  return (
    <div className="pdp-v4-root-wrapper">
      <div className="container pdp-v4-main-container">
        <div className="pdp-v4-breadcrumb-trail">
          {city || "Madurai"} {'>'} {company || "Gv Solutions"} {'>'} Products
          {'>'}{" "}
          <span className="pdp-v4-breadcrumb-current">
            {productEntity.name}
          </span>
        </div>

        {/* ── SECTION 1: MASTER PRODUCT PROFILE CONTAINER ── */}
        <div className="pdp-v4-display-card">
          <div className="row pdp-v4-split-grid">
            {/* Visualizer Frame Block (Left Column) */}
            <div className="col-md-6 pdp-v4-visualizer-block">
              <div className="pdp-v4-primary-viewport">
                <img
                  src={productEntity.media[selectedImgIdx]}
                  alt={productEntity.name}
                  className="pdp-v4-main-img"
                />
              </div>

              {/* Image Carousel Control Row */}
              <div className="pdp-v4-slider-controls-row">
                <button
                  type="button"
                  className="pdp-v4-slider-arrow"
                  onClick={() => handleScrollThumbnails("left")}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                <div
                  className="pdp-v4-slider-x-track"
                  ref={thumbnailScrollContainerRef}
                >
                  {productEntity.media.map((src, idx) => (
                    <div
                      key={idx}
                      className={`pdp-v4-slider-node${idx === selectedImgIdx ? " pdp-v4-node-active" : ""}`}
                      onClick={() => setSelectedImgIdx(idx)}
                    >
                      <img src={src} alt="thumbnail thumbnail view item" />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="pdp-v4-slider-arrow"
                  onClick={() => handleScrollThumbnails("right")}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              {/* Company profile context card (Desktop Placement) */}
              <div className="pdp-v4-company-embedded-card pdp-v4-desktop-only-company">
                <div className="pdp-v4-company-embedded-header">
                  <div>
                    <h4 className="pdp-v4-company-title-text">
                      {companyInfo?.name || company || "Company"}
                    </h4>
                    <p className="pdp-v4-company-location-sub">
                      <i className="fas fa-map-marker-alt sidebar-info-icon"></i>{companyInfo?.address || "Address not available"}
                    </p>
                  </div>
                  <div className="pdp-v4-company-stars-summary">
                    <span className="pdp-v4-stars-badge">
                      {companyInfo?.rating || "0.0"} ★
                    </span>
                    <span className="pdp-v4-stars-label">
                      ({companyInfo?.reviewCount || 0} Reviews)
                    </span>
                  </div>
                </div>

                <div className="company-card-actions">
                  <a
                    href={`tel:${companyInfo?.phone || ''}`}
                    className="pdp-v4-action-btn pdp-v4-btn-phone"
                  >
                    <i className="fas fa-phone"></i> {companyInfo?.phone || "Phone not available"}
                  </a>
                </div>
              </div>
            </div>

            {/* Description Details Block (Right Column) */}
            <div className="col-md-6 pdp-v4-details-block">
              <h1 className="pdp-v4-product-title">{productEntity.name}</h1>
              <div className="pdp-v4-product-price">{productEntity.price}</div>

              <hr className="pdp-v4-divider" />

              <h4 className="pdp-v4-section-subtitle">
                Technical Specifications
              </h4>
              <div className="pdp-v4-specs-table">
                {productEntity.specs.map((item, index) => (
                  <div key={index} className="pdp-v4-specs-row">
                    <span className="pdp-v4-spec-key">{item.label}:</span>
                    <span className="pdp-v4-spec-val">{item.value}</span>
                  </div>
                ))}
              </div>

              <h4 className="pdp-v4-section-subtitle">Product Description</h4>
              <p className="pdp-v4-description-text">
                {productEntity.description}
              </p>

              <div className="pdp-v4-company-embedded-action-dock mt-5">
                                   
                  <button
                    type="button"
                    className="pdp-v4-action-btn pdp-v4-btn-enquire"
                    onClick={() =>
                      alert("Requirement enquiry transmission opened.")
                    }
                  >
                    Enquire Now
                  </button>
                  <a
                    href={`https://wa.me/${companyInfo?.phone?.replace(/[^0-9]/g, "") || ''}`}
                    target="_blank"
                    rel="noreferrer"
                    className="pdp-v4-action-btn pdp-v4-btn-whatsapp"
                  >
                    <i className="fab fa-whatsapp"></i> WhatsApp
                  </a>

                  
                  <button className="btn-share">
                    <ShareButton 
                      title={productEntity.name}
                      text={`Check out this premium item: ${productEntity.name} available at ${productEntity.price}!`} 
                      url={window.location.href}
                    />
                  </button>
              </div>

              {/* Company profile card (Mobile View Reordering Target Placement) */}
              <div className="pdp-v4-company-embedded-card pdp-v4-mobile-only-company">
                <div className="pdp-v4-company-embedded-header">
                  <div>
                    <h4 className="pdp-v4-company-title-text">
                      {companyInfo?.name || company || "Company"}
                    </h4>
                    <p className="pdp-v4-company-location-sub">
                      {companyInfo?.address || "Address not available"}
                    </p>
                  </div>
                  <div className="pdp-v4-company-stars-summary">
                    <span className="pdp-v4-stars-badge">
                      {companyInfo?.rating || "0.0"} ★
                    </span>
                    <span className="pdp-v4-stars-label">
                      ({companyInfo?.reviewCount || 0} Reviews)
                    </span>
                  </div>
                </div>

                <div className="pdp-v4-company-embedded-action-dock">
                  <a
                    href={`tel:${companyInfo?.phone || ''}`}
                    className="pdp-v4-action-btn pdp-v4-btn-phone"
                  >
                    <i className="fas fa-phone-alt"></i> {companyInfo?.phone || "Phone not available"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SIMILAR PRODUCTS GRID (MATCHING COMPANYPAGE STRUCTURE) ── */}
        <ImageCardXFlow
          cardTitle={"Similar Product"}
          DATAS={similarProducts}
          onCardClick={handleProductNavigation}
        />

        {/* ── SECTION 3: USER SATISFACTION CARD & REVIEWS & RATINGS ── */}
        <div className="pdp-v4-display-card">
          <h3 className="pdp-v4-inner-card-heading">
            User Satisfaction & Ratings Summary
          </h3>
          <div className="row align-items-center mb-4">
            {/* SVG Circular Progress Bar Display Segment */}
            <div className="col-sm-4 text-center d-flex flex-column align-items-center justify-content-center">
              <div className="pdp-v4-circular-gauge-wrapper">
                <svg
                  className="pdp-v4-circular-gauge-svg"
                  width="120"
                  height="120"
                >
                  <circle
                    className="pdp-v4-gauge-bg-circle"
                    cx="60"
                    cy="60"
                    r={radius}
                  />
                  <circle
                    className="pdp-v4-gauge-filled-circle"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="pdp-v4-gauge-percentage-text">
                  {satisfactionScore}%
                </div>
              </div>
              <div className="pdp-v4-metric-subtitle-label mt-2">
                Response
              </div>
            </div>
            <div className="col-sm-4 text-center d-flex flex-column align-items-center justify-content-center">
              <div className="pdp-v4-circular-gauge-wrapper">
                <svg
                  className="pdp-v4-circular-gauge-svg"
                  width="120"
                  height="120"
                >
                  <circle
                    className="pdp-v4-gauge-bg-circle"
                    cx="60"
                    cy="60"
                    r={radius}
                  />
                  <circle
                    className="pdp-v4-gauge-filled-circle"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="pdp-v4-gauge-percentage-text">
                  {satisfactionScore}%
                </div>
              </div>
              <div className="pdp-v4-metric-subtitle-label mt-2">
                Quality
              </div>
            </div>
            <div className="col-sm-4 text-center d-flex flex-column align-items-center justify-content-center">
              <div className="pdp-v4-circular-gauge-wrapper">
                <svg
                  className="pdp-v4-circular-gauge-svg"
                  width="120"
                  height="120"
                >
                  <circle
                    className="pdp-v4-gauge-bg-circle"
                    cx="60"
                    cy="60"
                    r={radius}
                  />
                  <circle
                    className="pdp-v4-gauge-filled-circle"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="pdp-v4-gauge-percentage-text">
                  {satisfactionScore}%
                </div>
              </div>
              <div className="pdp-v4-metric-subtitle-label mt-2">
                Delivery
              </div>
            </div>
          </div>

          <h4 className="pdp-v4-section-subtitle">
            Verified User Review Comments
          </h4>
          {/* Clamped fixed height 100% width scrolling window frame */}
          <div className="pdp-v4-comments-clamped-scrollbox">
            {userComments.slice(0, visibleCommentsCount).map((comment) => (
              <div key={comment.id} className="pdp-v4-comment-row-node">
                <div className="pdp-v4-comment-header-meta">
                  <span className="pdp-v4-comment-author">{comment.user}</span>
                  <span className="pdp-v4-comment-stars">
                    {"★".repeat(comment.rating)}
                    {"☆".repeat(5 - comment.rating)}
                  </span>
                  <span className="pdp-v4-comment-date">{comment.date}</span>
                </div>
                <p className="pdp-v4-comment-body-paragraph">{comment.text}</p>
              </div>
            ))}
          </div>

          {/* Step wise incremental controls toggle button trigger block */}
          {visibleCommentsCount < userComments.length && (
            <div className="text-center mt-3">
              <button
                type="button"
                className="pdp-v4-btn-show-more-comments"
                onClick={handleShowMoreComments}
              >
                Show More Feedback Comments{" "}
                <i className="fas fa-chevron-down ms-1"></i>
              </button>
            </div>
          )}
        </div>
        <ReviewRating reviewType={"product"} />
      </div>
    </div>
  );
}