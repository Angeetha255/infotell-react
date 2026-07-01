import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiService } from "../../services/api";
import "./ProductPage.css";
import ReviewRating from "../ReviewRating/ReviewRating";
import ImageCardXFlow from "../ImageCardXFlow/ImageCardXFlow";
import ShareButton from "../ShareButton/ShareButton";
import { formatCompanyName, generateSlug } from "../../utils/helpers";
import { useSlugData } from "../SlugResolver/SlugResolver";

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';
const BACKEND_BASE_URL = 'http://localhost:5006';

export default function ProductPage() {
  const { productId, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const slugData = useSlugData();

  // Breadcrumb state - initialized from location.state, updated dynamically from API data
  const [breadcrumbCity, setBreadcrumbCity] = useState(location.state?.city || 'Madurai');
  const [breadcrumbCompanyName, setBreadcrumbCompanyName] = useState(location.state?.company || 'Company');
  const [breadcrumbCompanyId, setBreadcrumbCompanyId] = useState(location.state?.companyId || '');
  const [breadcrumbCategory, setBreadcrumbCategory] = useState(location.state?.category || '');

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

  // Navigate to previous image
  const handlePreviousImage = () => {
    if (selectedImgIdx > 0) {
      setSelectedImgIdx(selectedImgIdx - 1);
    }
  };

  // Navigate to next image
  const handleNextImage = () => {
    if (productEntity.media && selectedImgIdx < productEntity.media.length - 1) {
      setSelectedImgIdx(selectedImgIdx + 1);
    }
  };

  // Fetch product data on mount
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Check if product data is passed via SlugResolver context
        if (slugData?.type === 'product' && slugData?.data) {
          setProductData(slugData.data);
          const currentProductId = slugData.data.id;

          // Fetch similar products
          const allProductsResponse = await apiService.products.getAll();
          const allProductsList = allProductsResponse.data?.products || allProductsResponse.data?.data || [];
          
          if (allProductsResponse.data) {
            const similarList = allProductsList
              .filter(p => String(p.id) !== String(currentProductId))
              .filter(p => p.productCategory === slugData.data.productCategory || String(p.companyId) === String(slugData.data.companyId))
              .slice(0, 5)
              .map(p => {
                let simImages;
                if (p.productImages && Array.isArray(p.productImages) && p.productImages.length > 0) {
                  simImages = p.productImages.map(img => resolveImageUrl(img));
                } else if (p.coverImage) {
                  simImages = [resolveImageUrl(p.coverImage)];
                } else if (p.images && p.images.length > 0) {
                  simImages = p.images.map(img => resolveImageUrl(img));
                } else {
                  simImages = [PLACEHOLDER_IMAGE];
                }
                return {
                  id: p.id,
                  name: p.productName || p.name || 'Product',
                  images: simImages,
                  priceFlag: p.priceFlag !== undefined ? p.priceFlag : true,
                  productMrp: p.productMrp || p.price || 0,
                  discountPrice: p.discountPrice,
                  discountPercentage: p.discountPercentage,
                  companyId: p.companyId
                };
              });
            setSimilarProducts(similarList);
          }

          // Fetch company info
          if (slugData.data.companyId) {
            try {
              const companyResponse = await apiService.businesses.getById(slugData.data.companyId);
              if (companyResponse.data) {
                setCompanyInfo(companyResponse.data);
                setBreadcrumbCompanyId(slugData.data.companyId);
                const companyName = companyResponse.data.businessName || companyResponse.data.name || '';
                setBreadcrumbCompanyName(companyName);
              }
            } catch (err) {
              console.error("Error fetching business/company info:", err);
            }
          }

          // Fetch product reviews
          try {
            const reviewsResponse = await apiService.reviews.getByProduct(currentProductId);
            if (reviewsResponse.data) {
              const reviewsList = Array.isArray(reviewsResponse.data)
                ? reviewsResponse.data
                : (reviewsResponse.data.reviews || reviewsResponse.data.data || []);
              const mappedComments = reviewsList.map(r => ({
                id: r.id,
                user: r.userName,
                rating: r.rating,
                date: new Date(r.createdAt).toLocaleDateString(),
                text: r.comment
              }));
              setUserComments(mappedComments);
            }
          } catch (reviewError) {
            setUserComments([]);
          }

          setLoading(false);
          return;
        }

        // Check if product data is passed via navigation state (from direct navigation)
        if (location.state?.productData) {
          setProductData(location.state.productData);
          const currentProductId = location.state.productData.id;
          
          // Update breadcrumb state if provided
          if (location.state.city) setBreadcrumbCity(location.state.city);
          if (location.state.company) setBreadcrumbCompanyName(location.state.company);
          if (location.state.companyId) setBreadcrumbCompanyId(location.state.companyId);
          if (location.state.category) setBreadcrumbCategory(location.state.category);

          // Fetch similar products
          const allProductsResponse = await apiService.products.getAll();
          const allProductsList = allProductsResponse.data?.products || allProductsResponse.data?.data || [];
          
          if (allProductsResponse.data) {
            const similarList = allProductsList
              .filter(p => String(p.id) !== String(currentProductId))
              .filter(p => p.productCategory === location.state.productData.productCategory || String(p.companyId) === String(location.state.productData.companyId))
              .slice(0, 5)
              .map(p => {
                let simImages;
                if (p.productImages && Array.isArray(p.productImages) && p.productImages.length > 0) {
                  simImages = p.productImages.map(img => resolveImageUrl(img));
                } else if (p.coverImage) {
                  simImages = [resolveImageUrl(p.coverImage)];
                } else if (p.images && p.images.length > 0) {
                  simImages = p.images.map(img => resolveImageUrl(img));
                } else {
                  simImages = [PLACEHOLDER_IMAGE];
                }
                return {
                  id: p.id,
                  name: p.productName || p.name || 'Product',
                  images: simImages,
                  priceFlag: p.priceFlag !== undefined ? p.priceFlag : true,
                  productMrp: p.productMrp || p.price || 0,
                  discountPrice: p.discountPrice,
                  discountPercentage: p.discountPercentage,
                  companyId: p.companyId
                };
              });
            setSimilarProducts(similarList);
          }

          // Fetch company info
          if (location.state.productData.companyId) {
            try {
              const companyResponse = await apiService.businesses.getById(location.state.productData.companyId);
              if (companyResponse.data) {
                setCompanyInfo(companyResponse.data);
                setBreadcrumbCompanyId(location.state.productData.companyId);
                const companyName = companyResponse.data.businessName || companyResponse.data.name || '';
                setBreadcrumbCompanyName(companyName);
              }
            } catch (err) {
              console.error("Error fetching business/company info:", err);
            }
          }

          // Fetch product reviews
          try {
            const reviewsResponse = await apiService.reviews.getByProduct(currentProductId);
            if (reviewsResponse.data) {
              const reviewsList = Array.isArray(reviewsResponse.data)
                ? reviewsResponse.data
                : (reviewsResponse.data.reviews || reviewsResponse.data.data || []);
              const mappedComments = reviewsList.map(r => ({
                id: r.id,
                user: r.userName,
                rating: r.rating,
                date: new Date(r.createdAt).toLocaleDateString(),
                text: r.comment
              }));
              setUserComments(mappedComments);
            }
          } catch (reviewError) {
            setUserComments([]);
          }

          setLoading(false);
          return;
        }

        // If no data from context or state, fetch by slug
        if (slug && !productId) {
          const allProductsResponse = await apiService.products.getAll();
          const allProductsList = allProductsResponse.data?.products || allProductsResponse.data?.data || [];
          
          if (allProductsResponse.data) {
            const foundProduct = allProductsList.find(p => {
              const productName = p.productName || p.name || '';
              const productSlug = generateSlug(productName);
              return productSlug === slug;
            });

            if (foundProduct) {
              setProductData(foundProduct);
              const currentProductId = foundProduct.id;

              // Fetch similar products
              const similarList = allProductsList
                .filter(p => String(p.id) !== String(currentProductId))
                .filter(p => p.productCategory === foundProduct.productCategory || String(p.companyId) === String(foundProduct.companyId))
                .slice(0, 5)
                .map(p => {
                  let simImages;
                  if (p.productImages && Array.isArray(p.productImages) && p.productImages.length > 0) {
                    simImages = p.productImages.map(img => resolveImageUrl(img));
                  } else if (p.coverImage) {
                    simImages = [resolveImageUrl(p.coverImage)];
                  } else if (p.images && p.images.length > 0) {
                    simImages = p.images.map(img => resolveImageUrl(img));
                  } else {
                    simImages = [PLACEHOLDER_IMAGE];
                  }
                  return {
                    id: p.id,
                    name: p.productName || p.name || 'Product',
                    images: simImages,
                    priceFlag: p.priceFlag !== undefined ? p.priceFlag : true,
                    productMrp: p.productMrp || p.price || 0,
                    discountPrice: p.discountPrice,
                    discountPercentage: p.discountPercentage,
                    companyId: p.companyId
                  };
                });
              setSimilarProducts(similarList);

              // Fetch company info
              if (foundProduct.companyId) {
                try {
                  const companyResponse = await apiService.businesses.getById(foundProduct.companyId);
                  if (companyResponse.data) {
                    setCompanyInfo(companyResponse.data);
                    setBreadcrumbCompanyId(foundProduct.companyId);
                    const companyName = companyResponse.data.businessName || companyResponse.data.name || '';
                    setBreadcrumbCompanyName(companyName);
                  }
                } catch (err) {
                  console.error("Error fetching business/company info:", err);
                }
              }

              // Fetch product reviews
              try {
                const reviewsResponse = await apiService.reviews.getByProduct(currentProductId);
                if (reviewsResponse.data) {
                  const reviewsList = Array.isArray(reviewsResponse.data)
                    ? reviewsResponse.data
                    : (reviewsResponse.data.reviews || reviewsResponse.data.data || []);
                  const mappedComments = reviewsList.map(r => ({
                    id: r.id,
                    user: r.userName,
                    rating: r.rating,
                    date: new Date(r.createdAt).toLocaleDateString(),
                    text: r.comment
                  }));
                  setUserComments(mappedComments);
                }
              } catch (reviewError) {
                setUserComments([]);
              }

              setLoading(false);
              return;
            }
          }
        }

        // Redirect old /product URLs to new SEO-friendly URLs
        if (location.pathname.startsWith('/product/') && productId) {
          // Fetch all products to find the product name for slug
          const allProductsResponse = await apiService.products.getAll();
          const allProductsList = allProductsResponse.data?.products || allProductsResponse.data?.data || [];
          
          if (allProductsResponse.data) {
            const foundProduct = allProductsList.find(p => String(p.id) === String(productId));
            if (foundProduct) {
              const productName = foundProduct.productName || foundProduct.name || '';
              const productSlug = generateSlug(productName);
              navigate(`/${productSlug}`, { replace: true, state: { 
                city: location.state?.city || breadcrumbCity,
                company: location.state?.company || breadcrumbCompanyName,
                companyId: location.state?.companyId || breadcrumbCompanyId,
                category: location.state?.category || breadcrumbCategory,
                productId: productId
              }});
              return;
            }
          }
        }

        // Fetch all products and find the one matching the productId or slug
        // (getById endpoint returns 500 error, so we use getAll as workaround)
        const allProductsResponse = await apiService.products.getAll();
        let foundProduct = null;
        const allProductsList = allProductsResponse.data?.products || allProductsResponse.data?.data || [];
        
        if (allProductsResponse.data) {
          // If slug is provided, resolve it to product ID
          if (slug && !productId) {
            foundProduct = allProductsList.find(p => {
              const productName = p.productName || p.name || '';
              const productSlug = generateSlug(productName);
              return productSlug === slug;
            });
          } else {
            // Find the specific product by matching the string/number id
            foundProduct = allProductsList.find(p => String(p.id) === String(productId));
          }
        }

        if (foundProduct) {
          setProductData(foundProduct);
          const currentProductId = foundProduct.id;

          // Fetch similar products based on same productCategory or companyId
          const similarList = allProductsList
            .filter(p => String(p.id) !== String(currentProductId))
            .filter(p => p.productCategory === foundProduct.productCategory || String(p.companyId) === String(foundProduct.companyId))
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
                images: simImages,
                // Structured price data for new price layout
                productMrp: p.productMrp,
                discountPrice: p.discountPrice,
                discountPercentage: p.discountPercentage,
                priceFlag: p.displayPrice !== false
              };
            });
          setSimilarProducts(similarList);

          // Two-step company data fetch:
          // Step 1: Fetch business by product's companyId (business ID) to get business details + actual companyId
          // Step 2: Fetch company by the business's companyId to get full address details
          if (foundProduct.companyId) {
            try {
              // Step 1: Fetch business record - this has the actual companyId reference
              const businessResponse = await apiService.businesses.getById(foundProduct.companyId);
              if (businessResponse.data) {
                const businessData = businessResponse.data.business || businessResponse.data;
                
                // Extract companyId from the business record
                const actualCompanyId = businessData.companyId || businessData.company_id || '';
                
                // Update breadcrumb company name from business data (fallback)
                const businessName = formatCompanyName(businessData.businessName || businessData.name || breadcrumbCompanyName);
                setBreadcrumbCompanyName(businessName);

                // Store full business-level info as fallback
                setCompanyInfo({
                  ...businessData,
                  id: actualCompanyId || foundProduct.companyId,
                  businessName: businessName,
                  name: businessName,
                  address: [businessData.area, businessData.district, businessData.state]
                    .filter(Boolean)
                    .join(', ') || businessData.address || "Address not available",
                  phone: businessData.mobileNumber || businessData.phone || '',
                  rating: businessData.rating || "0.0",
                  reviewCount: businessData.reviewCount || 0
                });

                // Update breadcrumb with business data if available
                if (businessData.district || businessData.city || businessData.area) {
                  setBreadcrumbCity(businessData.district || businessData.city || businessData.area);
                }

                // Update breadcrumb category from business data (Businesses API)
                if (businessData.category || businessData.categoryName) {
                  setBreadcrumbCategory(businessData.category || businessData.categoryName);
                }

                // Step 2: If we have an actual companyId, fetch the company for full address details
                if (actualCompanyId) {
                  try {
                    const companyResponse = await apiService.publicCompanies.getById(actualCompanyId);
                    if (companyResponse.data) {
                      const companyData = companyResponse.data.company || companyResponse.data;
                      
                      const resolvedName = formatCompanyName(companyData.businessName || companyData.name || businessName);
                      const resolvedAddress = [companyData.area, companyData.district, companyData.state]
                        .filter(Boolean)
                        .join(', ') || companyData.address || businessData.address || "Address not available";
                      
                      setCompanyInfo({
                        ...companyData,
                        id: actualCompanyId,
                        businessName: resolvedName,
                        name: resolvedName,
                        address: resolvedAddress,
                        phone: companyData.mobileNumber || companyData.phone || businessData.phone || '',
                        rating: companyData.rating || businessData.rating || "0.0",
                        reviewCount: companyData.reviewCount || businessData.reviewCount || 0
                      });

                      // Update breadcrumb with full company data
                      setBreadcrumbCompanyId(actualCompanyId);
                      setBreadcrumbCompanyName(resolvedName);
                      
                      const resolvedCity = companyData.district || companyData.city || companyData.area || breadcrumbCity;
                      setBreadcrumbCity(resolvedCity);

                      // Update breadcrumb category from company data if business data didn't have it
                      if (!breadcrumbCategory && (companyData.category || companyData.categoryName)) {
                        setBreadcrumbCategory(companyData.category || companyData.categoryName);
                      }
                    }
                  } catch (companyErr) {
                    // Company API failed, we already have business data as fallback
                    // Keep the business's companyId for breadcrumb navigation
                    setBreadcrumbCompanyId(actualCompanyId);
                  }
                } else {
                  // No actual companyId, use the product's companyId as the business ID for navigation
                  setBreadcrumbCompanyId(foundProduct.companyId);
                }
              }
            } catch (err) {
              console.error("Error fetching business/company info:", err);
              // Fallback: use product's companyId directly for breadcrumb
              if (foundProduct.companyId) {
                setBreadcrumbCompanyId(foundProduct.companyId);
              }
            }
          }

          // Fetch product reviews
          try {
            const reviewsResponse = await apiService.reviews.getByProduct(currentProductId);
            if (reviewsResponse.data) {
              const reviewsList = Array.isArray(reviewsResponse.data)
                ? reviewsResponse.data
                : (reviewsResponse.data.reviews || reviewsResponse.data.data || []);
              const mappedComments = reviewsList.map(r => ({
                id: r.id,
                user: r.userName,
                rating: r.rating,
                date: new Date(r.createdAt).toLocaleDateString(),
                text: r.comment
              }));
              setUserComments(mappedComments);
            }
          } catch (reviewError) {
            console.error("Error fetching reviews:", reviewError);
            setUserComments([]);
          }
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId || slug) {
      fetchProductData();
    }
  }, [productId, slug]);

  const handleShowMoreComments = () => {
    setVisibleCommentsCount((prev) => Math.min(prev + 2, userComments.length));
  };

  const handleProductNavigation = (product) => {
    const productId = product.id || product.productId;
    const productName = product.name || product.productName || 'Product';
    const productSlug = generateSlug(productName);
    
    // Use SEO-friendly slug-based URL for product
    navigate(`/${productSlug}`, { 
      state: { 
        city: breadcrumbCity, 
        company: breadcrumbCompanyName,
        companyId: breadcrumbCompanyId,
        category: breadcrumbCategory,
        productId: productId // Keep ID for API calls
      } 
    });
  };

  const handleBreadcrumbClick = (path, state = {}) => {
    navigate(path, { state });
  };

  if (loading) {
    return <div className="pdp-v4-root-wrapper"><div className="container"><p>Loading product details...</p></div></div>;
  }

  if (!productData) {
    return <div className="pdp-v4-root-wrapper"><div className="container"><p>Product not found.</p></div></div>;
  }

  const displayPrice = productData.discountPrice || productData.productMrp || productData.price || '';

  // Helper function to convert text to Title Case
  const toTitleCase = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Map API specifications [{name, detail}] to specs [{label, value}]
  const mapSpecs = (specs) => {
    if (!specs) return [];
    if (Array.isArray(specs) && specs.length > 0) {
      return specs.map(s => ({
        label: toTitleCase(s.name || s.label || ''),
        value: toTitleCase(s.detail || s.value || '')
      }));
    }
    return [];
  };

  const productEntity = {
    name: productData.productName || productData.name || 'Product',
    price: displayPrice ? `₹${displayPrice}` : '',
    description: productData.descriptions || productData.description || '',
    specs: mapSpecs(productData.specifications || productData.specs),
    media: buildMediaArray(productData)
  };

  return (
    <div className="pdp-v4-root-wrapper">
      <div className="container pdp-v4-main-container">
        <div className="pdp-v4-breadcrumb-trail">
          <span 
            className="pdp-v4-breadcrumb-item"
            onClick={() => handleBreadcrumbClick('/')}
          >
            Home
          </span>
          {' > '}
          <span 
            className="pdp-v4-breadcrumb-item"
            onClick={() => handleBreadcrumbClick(`/${generateSlug(breadcrumbCity)}/${generateSlug(breadcrumbCategory)}`, { 
              city: breadcrumbCity,
              category: breadcrumbCategory
            })}
          >
            {breadcrumbCity}
          </span>
          {' > '}
          {breadcrumbCompanyId ? (
            <span 
              className="pdp-v4-breadcrumb-item"
              onClick={() => handleBreadcrumbClick(`/${generateSlug(breadcrumbCompanyName)}`, { 
                companyData: companyInfo
              })}
            >
              {breadcrumbCompanyName}
            </span>
          ) : (
            <span className="pdp-v4-breadcrumb-current">
              {breadcrumbCompanyName}
            </span>
          )}
          {' > '}
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
                  className={`pdp-v4-slider-arrow ${selectedImgIdx === 0 || productEntity.media.length <= 1 ? 'pdp-v4-arrow-hidden' : ''}`}
                  onClick={handlePreviousImage}
                  disabled={selectedImgIdx === 0 || productEntity.media.length <= 1}
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
                  className={`pdp-v4-slider-arrow ${selectedImgIdx === productEntity.media.length - 1 || productEntity.media.length <= 1 ? 'pdp-v4-arrow-hidden' : ''}`}
                  onClick={handleNextImage}
                  disabled={selectedImgIdx === productEntity.media.length - 1 || productEntity.media.length <= 1}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              {/* Company profile context card (Desktop Placement) */}
              <div className="pdp-v4-company-embedded-card pdp-v4-desktop-only-company">
                <div className="pdp-v4-company-embedded-header">
                  <div>
                    <h4 className="pdp-v4-company-title-text">
                      {formatCompanyName(companyInfo?.name || breadcrumbCompanyName || "Company")}
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
              <div className="pdp-v4-product-price">
                {productData.displayPrice === false ? null : productData.discountPrice ? (
                  <div className="price-with-discount">
                    <div className="price-line-1">
                      <span className="product-discount-price">₹{productData.discountPrice}</span>
                      <span className="product-discount-percentage">(-{productData.discountPercentage}% OFF)</span>
                    </div>
                    <div className="price-line-2">
                      <span className="product-mrp-label">MRP:</span>
                      <span className="product-mrp-strikethrough">₹{productData.productMrp}</span>
                    </div>
                  </div>
                ) : productData.productMrp ? (
                  <span className="product-mrp-only">₹{productData.productMrp}</span>
                ) : (
                  productEntity.price
                )}
              </div>

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
                      {formatCompanyName(companyInfo?.name || breadcrumbCompanyName || "Company")}
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