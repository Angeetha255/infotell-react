import React, { useState, useEffect, createContext, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../../services/api';
import CompanyPage from '../CompanyPage/CompanyPage';
import ProductPage from '../ProductPage/ProductPage';
import { generateSlug } from '../../utils/helpers';

// Create context to pass resolved data
const SlugContext = createContext(null);

/**
 * SlugResolver - Determines whether a slug belongs to a company or product
 * and renders the appropriate component.
 * 
 * This component handles the SEO-friendly URL pattern /:slug which can be
 * either a company slug or a product slug.
 */
export default function SlugResolver() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [resolvedType, setResolvedType] = useState(null); // 'company' or 'product'
  const [resolvedData, setResolvedData] = useState(null);

  useEffect(() => {
    const resolveSlug = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // First, try to find a company with this slug
        const companiesResponse = await apiService.publicCompanies.getAll();
        const companiesArray = Array.isArray(companiesResponse.data)
          ? companiesResponse.data
          : (companiesResponse.data?.companies || companiesResponse.data?.data || []);

        const matchedCompany = companiesArray.find(company => {
          const companyName = company.businessName || company.name || '';
          const companySlug = generateSlug(companyName);
          return companySlug === slug;
        });

        if (matchedCompany) {
          setResolvedType('company');
          setResolvedData(matchedCompany);
          setLoading(false);
          return;
        }

        // If not a company, try to find a product
        const productsResponse = await apiService.products.getAll();
        const productsArray = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : (productsResponse.data?.products || productsResponse.data?.data || []);

        const matchedProduct = productsArray.find(product => {
          const productName = product.productName || product.name || '';
          const productSlug = generateSlug(productName);
          return productSlug === slug;
        });

        if (matchedProduct) {
          setResolvedType('product');
          setResolvedData(matchedProduct);
          setLoading(false);
          return;
        }

        // If neither found, redirect to home or show 404
        setResolvedType(null);
        setLoading(false);
      } catch (error) {
        console.error('Error resolving slug:', error);
        setLoading(false);
      }
    };

    resolveSlug();
  }, [slug]);

  if (loading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  if (resolvedType === 'company' && resolvedData) {
    // Render CompanyPage with company data via context
    return (
      <SlugContext.Provider value={{ type: 'company', data: resolvedData }}>
        <CompanyPage />
      </SlugContext.Provider>
    );
  }

  if (resolvedType === 'product' && resolvedData) {
    // Render ProductPage with product data via context
    return (
      <SlugContext.Provider value={{ type: 'product', data: resolvedData }}>
        <ProductPage />
      </SlugContext.Provider>
    );
  }

  // If slug couldn't be resolved, show 404 or redirect
  return <div className="container"><p>Page not found.</p></div>;
}

// Export hook to use the context
export const useSlugData = () => useContext(SlugContext);
