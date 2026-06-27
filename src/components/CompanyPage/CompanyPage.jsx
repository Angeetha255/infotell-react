import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompanyPage.css';
import ReviewRating from '../ReviewRating/ReviewRating';
import ImageCardXFlow from '../ImageCardXFlow/ImageCardXFlow';
import ShareButton from '../ShareButton/ShareButton';

// ── BACKEND STATIC SIMULATION DATABASE ──
const BACKEND_COMPANY_DATA = {
  overview: {
    content: "Gv Solutions is a premier technology consulting and custom software development agency based out of Madurai. We architect cutting-edge cloud architectures, cross-platform mobile environments, and automated custom enterprise resource planning (ERP) suites engineered to scale local business digital footprints internationally.",
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80', alt: 'Workspace Environment' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', alt: 'Collaborative Dev Session' }
    ]
  },
  photos: [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=300&q=80'
  ],
  catalogue: [
    { id: 'cat-1', title: 'Enterprise Software Spec Brochure', src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80', downloadUrl: '#' },
    { id: 'cat-2', title: 'Web Design Portfolio Booklet', src: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=300&q=80', downloadUrl: '#' },
    { id: 'cat-3', title: 'Cloud Infrastructure Matrix Tech Sheet', src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80', downloadUrl: '#' }
  ],
  initialReviews: [
    { id: 1, name: "Arun Kumar", pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80", rating: 5, comment: "Exceptional architecture design delivery. Built our e-commerce operations layout cleanly ahead of aggressive launch timelines." },
    { id: 2, name: "Deepika Ram", pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80", rating: 5, comment: "The UI/UX revamp increased our conversion baseline analytics by roughly forty percent. Highly recommended team!" }
  ],
  // NEW CRITERION: Dynamic Product List with Multi-Image Sliders
  products: [
    {
      id: 'prod-1',
      name: 'CloudScale Custom Automated Enterprise ERP Workspace Platform',
      price: '₹45,000 / Year',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1504868584819-f8e8b446d2e4?auto=format&fit=crop&w=300&q=80'
      ]
    },
    {
      id: 'prod-2',
      name: 'OmniChannel Responsive E-Commerce Software Engine Suite',
      price: '₹25,000 One-time',
      images: [
        'https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80'
      ]
    },
    {
      id: 'prod-3',
      name: 'SecureGate Corporate Cyber-Security Threat Shield Firewall Proxy Node',
      price: 'Contact for Quote',
      images: [
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=300&q=80'
      ]
    },
    {
      id: 'prod-4',
      name: 'OmniChannel Responsive E-Commerce Software Engine Suite',
      price: '₹25,000 One-time',
      images: [
        'https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80'
      ]
    },
    {
      id: 'prod-5',
      name: 'SecureGate Corporate Cyber-Security Threat Shield Firewall Proxy Node',
      price: 'Contact for Quote',
      images: [
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=300&q=80'
      ]
    }
  ],
  sidebar: {
    name: "Gv Solutions",
    address: "Surveyor Colony, Madurai, Tamil Nadu - 625007",
    hours: "Mon – Sat: 9:00 AM – 8:00 PM",
    specialisations: "Web Design, Mobile Apps, Enterprise Custom ERP Solutions, Branding Strategy",
    established: "2014",
    relatedCategories: [
      { id: 'rc-1', name: 'Web Designers in Madurai' },
      { id: 'rc-2', name: 'Mobile App Developers' },
      { id: 'rc-3', name: 'Digital Marketing Agencies' }
    ],
    relatedKeywords: [
      'Custom ERP', 'SaaS Solutions', 'React Developers', 'Madurai IT Hub', 'E-Commerce Build', 'Cloud Hosting'
    ]
  }
};

const TABS = ['Overview', 'Photos', 'Catalogue', 'Reviews'];

export default function CompanyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [reviews, setReviews] = useState(BACKEND_COMPANY_DATA.initialReviews);
  
  // Login & Review Form States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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

  const handleReviewSubmission = (e) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) {
      alert('Please fill out both your user name and review text.');
      return;
    }

    const compiledReviewObj = {
      id: Date.now(),
      name: newReviewName,
      pic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      rating: parseInt(newReviewRating),
      comment: newReviewComment
    };

    setReviews([compiledReviewObj, ...reviews]);
    setNewReviewName('');
    setNewReviewComment('');
    setNewReviewRating(5);
  };

  const handleProductNavigation = (productId) => {
    // Navigates passing selections via location query parameters
    navigate(`/product?city=Madurai&company=Gv-Solutions&product=${productId}`);
  };

  const rawAggregateScore = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const evaluatedAverageRating = reviews.length > 0 ? (rawAggregateScore / reviews.length).toFixed(1) : "0.0";

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
                    Gv Solutions
                    <i className="fas fa-check-circle verified-badge-icon"></i>
                  </h1>
                  <div className="profile-rating-row">
                    <span className="profile-rating-badge">{evaluatedAverageRating} ★</span>
                    <span className="profile-rating-text">{reviews.length} Ratings Verified | Claimed Account</span>
                  </div>
                  <div className="profile-location">
                    <i className="fas fa-map-marker-alt"></i> {BACKEND_COMPANY_DATA.sidebar.address} &nbsp;•&nbsp;
                    <span className="open-status">Open until 8:00 pm</span>
                  </div>
                </div>
                <button className="btn-wishlist" aria-label="Bookmark Workspace">
                  <i className="far fa-heart"></i>
                </button>
              </div>

              <div className="company-actions">
                <a href="tel:08460506156" className="btn-company-call">
                  <i className="fas fa-phone"></i> 08460506156
                </a>
                <button className="btn-enquire">
                  Enquire Now
                </button>
                <button className="btn-company-whatsapp">
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button className="btn-share">
                  <ShareButton 
                    title={BACKEND_COMPANY_DATA.sidebar.name}
                    text={`Check out this company: ${BACKEND_COMPANY_DATA.sidebar.name}!`} 
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
                    <p className="tab-body-description">{BACKEND_COMPANY_DATA.overview.content}</p>
                    {/* <div className="overview-media-carousel">
                      {BACKEND_COMPANY_DATA.overview.media.map((item, idx) => (
                        <div key={idx} className="overview-carousel-slide">
                          <img src={item.url} alt={item.alt} />
                        </div>
                      ))}
                    </div> */}
                  </div>
                )}

                {/* VIEW 2: PHOTOS GRID LAYOUT COMPONENT */}
                {activeTab === 'Photos' && (
                  <div className="tab-pane-content animation-fade-in">
                    <div className="photos-thumbnail-bounded-matrix">
                      {BACKEND_COMPANY_DATA.photos.map((src, idx) => (
                        <div key={idx} className="strict-photo-box-card">
                          <img src={src} alt={`Thumbnail Assets ${idx + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIEW 3: CATALOGUE MANAGEMENT PIPELINE COMPONENT */}
                {activeTab === 'Catalogue' && (
                  <div className="tab-pane-content animation-fade-in">
                    <div className="catalogue-grid-layout">
                      {BACKEND_COMPANY_DATA.catalogue.map((catItem) => (
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
                      ))}
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

            {/* PRODUCT LISTING CARD CAROUSEL (REPLACED GALLERY COVER LAYER) */}
            <ImageCardXFlow cardTitle={"Product"} DATAS={BACKEND_COMPANY_DATA.products}  onCardClick={handleProductNavigation} />

            {/* ESTABLISHMENT DATA SEGMENT SECTION CARD */}
            <div className="profile-card">
              <h2 className="section-card-heading">Establishment Track Profile</h2>
              <div className="establishment-details-grid">
                <div className="establishment-grid-node">
                  <span className="establishment-node-label">Year of Corporate Registration</span>
                  <span className="establishment-node-value">{BACKEND_COMPANY_DATA.sidebar.established}</span>
                </div>
                <div className="establishment-grid-node">
                  <span className="establishment-node-label">Current Operational Scale Status</span>
                  <span className="establishment-node-value verified-accent-text">Fully Verified & Compliant</span>
                </div>
                <div className="establishment-grid-node">
                  <span className="establishment-node-label">Entity Classification Hierarchy</span>
                  <span className="establishment-node-value">Information Technology Core Hub Private Enterprise</span>
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
                  <div className="sidebar-info-icon-container"><i className="fas fa-map-marker-alt sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Address</div>
                    <div className="sidebar-info-value">{BACKEND_COMPANY_DATA.sidebar.address}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-clock sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Working Hours</div>
                    <div className="sidebar-info-value">{BACKEND_COMPANY_DATA.sidebar.hours}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-briefcase sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Specialisations</div>
                    <div className="sidebar-info-value">{BACKEND_COMPANY_DATA.sidebar.specialisations}</div>
                  </div>
                </div>

                <div className="sidebar-info-row">
                  <div className="sidebar-info-icon-container"><i className="fas fa-calendar-alt sidebar-info-icon"></i></div>
                  <div>
                    <div className="sidebar-info-label">Established</div>
                    <div className="sidebar-info-value">{BACKEND_COMPANY_DATA.sidebar.established}</div>
                  </div>
                </div>
              </div>

              {/* Box Segment 2: Relevant Categories Layout */}
              <div className="company-sidebar-card">
                <h4 className="company-sidebar-title">Relevant Categories</h4>
                <div className="sidebar-vertical-navigation-links">
                  {BACKEND_COMPANY_DATA.sidebar.relatedCategories.map((category) => (
                    <div key={category.id} className="sidebar-navigation-row-link" onClick={() => alert(`Redirecting to node directory index: ${category.name}`)}>
                      <span className="nav-row-text-label">{category.name}</span>
                      <i className="fas fa-chevron-right nav-row-arrow-indicator"></i>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box Segment 3: Relevant Keywords Widget Section */}
              <div className="company-sidebar-card">
                <h4 className="company-sidebar-title">Relevant Keywords</h4>
                <div className="sidebar-keywords-flex-matrix-dock">
                  {BACKEND_COMPANY_DATA.sidebar.relatedKeywords.map((keyword, i) => (
                    <span key={i} className="sidebar-keyword-pill-tag-node" onClick={() => alert(`Executing automated directory index database fetch for keyword token: #${keyword}`)}>
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
