import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DataNotFound.css';

export default function DataNotFound({ 
  title = "Data Not Found", 
  message = "The requested record could not be located in our database parameters.", 
  buttonText = "Return to Homepage Catalog", 
  onActionClick 
}) {
  const navigate = useNavigate();

  // If no custom click handler is passed, default to homepage navigation
  const handleDefaultAction = () => {
    if (onActionClick) {
      onActionClick();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="p-not-found-wrapper">
      <div className="p-not-found-box">
        <div className="p-error-icon">⚠️</div>
        <h2 className="p-error-heading">{title}</h2>
        <p className="p-error-message">{message}</p>
        <button 
          type="button" 
          className="p-error-action-btn" 
          onClick={handleDefaultAction}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

// within component
{/* <DataNotFound 
    title="Product Data Not Found"
    message={`The product identifier "${productIdParam || 'unknown'}" could not be located under ${companyParam} catalog files in ${cityParam}.`}
/> */}

// other component
{/* <DataNotFound 
    title="Company Not Registered"
    message="The business profile layout matching this link parameter is offline or unavailable."
    buttonText="Go Back to Directory"
    onActionClick={() => navigate('/categories')}
/> */}