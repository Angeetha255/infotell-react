import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductPage.css";
import ReviewRating from "../ReviewRating/ReviewRating";
import ImageCardXFlow from "../ImageCardXFlow/ImageCardXFlow";
import ShareButton from "../ShareButton/ShareButton";

// ── SIMULATED EXTENDED DATABASE MOCK MODEL ──
const MOCK_PRODUCT_DATABASE = {
  "prod-101": {
    name: "Custom Cloud Enterprise Resource Planning Premium Suite Pack",
    price: "₹45,000 / Module",
    description:
      "An end-to-end industry scale architecture deployment mapping accounting ledger automation, supply-chain routing logs, automated human asset pipelines, and telemetry performance tracking protocols.",
    specs: [
      { label: "Sheet Material", value: "Color Coated Steel" },
      { label: "Sheet Thickness", value: "0.47 mm" },
      { label: "Thickness", value: "0.47mm, 0.50mm" },
      { label: "Profile Type", value: "Corrugated" },
    ],
    media: [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  "prod-102": {
    name: "E-Commerce Framework Implementation",
    price: "₹25,000 Startup Flat Rate",
    description:
      "Turnkey headless commerce architecture deployments engineered utilizing modern reactive component design blocks.",
    specs: [
      { label: "Framework Platform", value: "Next.js Headless v14" },
      {
        label: "Performance Metric",
        value: "Sub 200ms Server Side Render Generation",
      },
    ],
    media: [
      "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    ],
  },
};

const SIMILAR_PRODUCTS = {
  products: [
    {
      id: "prod-1",
      name: "CloudScale Custom Automated Enterprise ERP Workspace Platform",
      price: "₹45,000 / Year",
      images: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=300&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80",
        "https://images.unsplash.com/photo-1504868584819-f8e8b446d2e4?auto=format&fit=crop&w=300&q=80",
      ],
    },
    {
      id: "prod-2",
      name: "OmniChannel Responsive E-Commerce Software Engine Suite",
      price: "₹25,000 One-time",
      images: [
        "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=300&q=80",
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80",
      ],
    },
    {
      id: "prod-3",
      name: "SecureGate Corporate Cyber-Security Threat Shield Firewall Proxy Node",
      price: "Contact for Quote",
      images: [
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80",
        "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=300&q=80",
      ],
    },
    {
      id: "prod-4",
      name: "OmniChannel Responsive E-Commerce Software Engine Suite",
      price: "₹25,000 One-time",
      images: [
        "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=300&q=80",
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80",
      ],
    },
    {
      id: "prod-5",
      name: "SecureGate Corporate Cyber-Security Threat Shield Firewall Proxy Node",
      price: "Contact for Quote",
      images: [
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80",
        "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=300&q=80",
      ],
    },
  ],
};

const MOCK_COMPANY_INFO = {
  name: "Gv Solutions Private Limited",
  phone: "+91 84605 06156",
  email: "procure@gvsolutions.dev",
  address: "Surveyor Colony, Madurai, Tamil Nadu - 625007",
  rating: "5.0",
  totalReviews: 6,
};

const INITIAL_COMMENTS = [
  {
    id: 1,
    user: "Arun Kumar",
    rating: 5,
    date: "2 weeks ago",
    text: "Exceptional architecture stack. The deployment setup was incredibly quick and saved us weeks of native infrastructure configuration work.",
  },
  {
    id: 2,
    user: "Priya Sharma",
    rating: 5,
    date: "1 month ago",
    text: "The dynamic specification parameters accurately mapped directly with our backend manufacturing tracking systems seamlessly.",
  },
  {
    id: 3,
    user: "David M.",
    rating: 4,
    date: "2 months ago",
    text: "Extremely robust framework build blocks. Customer assistance query response speed was fast and helpful during deployment.",
  },
  {
    id: 4,
    user: "Rajesh T.",
    rating: 5,
    date: "3 months ago",
    text: "High quality steel corrugated sheets mapping matches up exactly with simulated parameters. Highly recommended product line.",
  },
];

export default function ProductPage() {
  const { city, company, productId } = useParams();
  const navigate = useNavigate();

  const productEntity =
    MOCK_PRODUCT_DATABASE[productId] || MOCK_PRODUCT_DATABASE["prod-101"];

  // UI State hooks
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(2);
  const [userComments, setUserComments] = useState(INITIAL_COMMENTS);

  const thumbnailScrollContainerRef = useRef(null);

  // SVG Circular progress configurations
  const satisfactionScore = 92;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (satisfactionScore / 100) * circumference;

  const handleShowMoreComments = () => {
    setVisibleCommentsCount((prev) => Math.min(prev + 2, userComments.length));
  };

  const handleProductNavigation = (productId) => {
    // Navigates passing selections via location query parameters
    navigate(`/product?city=Madurai&company=Gv-Solutions&product=${productId}`);
  };

  return (
    <div className="pdp-v4-root-wrapper">
      <div className="container pdp-v4-main-container">
        <div className="pdp-v4-breadcrumb-trail">
          {city || "Madurai"} &gt; {company || "Gv Solutions"} &gt; Products
          &gt;{" "}
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
                      {MOCK_COMPANY_INFO.name}
                    </h4>
                    <p className="pdp-v4-company-location-sub">
                      <i className="fas fa-map-marker-alt sidebar-info-icon"></i>{MOCK_COMPANY_INFO.address}
                    </p>
                  </div>
                  <div className="pdp-v4-company-stars-summary">
                    <span className="pdp-v4-stars-badge">
                      {MOCK_COMPANY_INFO.rating} ★
                    </span>
                    <span className="pdp-v4-stars-label">
                      ({MOCK_COMPANY_INFO.totalReviews} Reviews)
                    </span>
                  </div>
                </div>

                <div className="company-card-actions">
                  <a
                    href={`tel:${MOCK_COMPANY_INFO.phone}`}
                    className="pdp-v4-action-btn pdp-v4-btn-phone"
                  >
                    <i className="fas fa-phone"></i> {MOCK_COMPANY_INFO.phone}
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
                    href={`https://wa.me/${MOCK_COMPANY_INFO.phone.replace(/[^0-9]/g, "")}`}
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
                      {MOCK_COMPANY_INFO.name}
                    </h4>
                    <p className="pdp-v4-company-location-sub">
                      {MOCK_COMPANY_INFO.address}
                    </p>
                  </div>
                  <div className="pdp-v4-company-stars-summary">
                    <span className="pdp-v4-stars-badge">
                      {MOCK_COMPANY_INFO.rating} ★
                    </span>
                    <span className="pdp-v4-stars-label">
                      ({MOCK_COMPANY_INFO.totalReviews} Reviews)
                    </span>
                  </div>
                </div>

                <div className="pdp-v4-company-embedded-action-dock">
                  <a
                    href={`tel:${MOCK_COMPANY_INFO.phone}`}
                    className="pdp-v4-action-btn pdp-v4-btn-phone"
                  >
                    <i className="fas fa-phone-alt"></i> {MOCK_COMPANY_INFO.phone}
                  </a>
                  {/* <button
                    type="button"
                    className="pdp-v4-action-btn pdp-v4-btn-enquire"
                    onClick={() =>
                      alert("Requirement enquiry transmission opened.")
                    }
                  >
                    Enquire
                  </button>
                  <a
                    href={`https://wa.me/${MOCK_COMPANY_INFO.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="pdp-v4-action-btn pdp-v4-btn-whatsapp"
                  >
                    <i className="fab fa-whatsapp"></i> WhatsApp
                  </a> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SIMILAR PRODUCTS GRID (MATCHING COMPANYPAGE STRUCTURE) ── */}
        <ImageCardXFlow
          cardTitle={"Similar Product"}
          DATAS={SIMILAR_PRODUCTS.products}
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
