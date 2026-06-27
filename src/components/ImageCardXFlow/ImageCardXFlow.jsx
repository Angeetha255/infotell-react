import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './ImageCardXFlow.css';

// ── LISTING CARD WITH INTERACTIVE SLIDER ──
function Card({ dataObj, onCardClickFunc }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [showFullText, setShowFullText] = useState(false);

  const prevImage = (e) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev === 0 ? dataObj.images.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev === dataObj.images.length - 1 ? 0 : prev + 1));
  };

  const selectImage = (e, idx) => {
    e.stopPropagation();
    setImgIndex(idx);
  };

  // Truncation utility logic: Cut roughly at half lengths if name crosses 32 chars
  const isTooLong = dataObj.name.length > 32;
  const processNameDisplay = () => {
    if (!isTooLong || showFullText) return dataObj.name;
    return `${dataObj.name.substring(0, 24)}...`;
  };

  return (
    <div
      className="img-listing-card"
      onClick={() => onCardClickFunc(dataObj.id)}
    >
      <div className="img-card-image-box">
        <img src={dataObj.images[imgIndex]} alt={dataObj.name} />
        {dataObj.images.length > 1 && (
          <>
            <button className="img-nav-btn left-arrow" onClick={prevImage}>
              ‹
            </button>
            <button className="img-nav-btn right-arrow" onClick={nextImage}>
              ›
            </button>
          </>
        )}
        <div className="img-dots-indicator-container">
          {dataObj.images.map((_, i) => (
            <span
              key={i}
              className={`dot-indicator${i === imgIndex ? " active" : ""}`}
              onClick={(e) => selectImage(e, i)}
            />
          ))}
        </div>
      </div>
      <div className="img-card-info-box">
        <div className="img-card-title-line">
          <span className="img-name-txt">{processNameDisplay()}</span>
          {isTooLong && (
            <button
              className="img-name-more-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullText(!showFullText);
              }}
            >
              {showFullText ? " less" : " more"}
            </button>
          )}
        </div>
        <div className="img-card-price-tag">{dataObj.price}</div>
      </div>
    </div>
  );
}

export default function ImageCardXFlow({cardTitle, DATAS, onCardClick }) {
  const navigate = useNavigate();
  console.log(DATAS)

  return (
    <div className="profile-card">
      <h2 className="section-card-heading">
        {cardTitle} Listings{" "}
        <span>
          <i className="fa-solid fa-arrow-right"></i>
        </span>
      </h2>
      <div className="img-horizontal-scroll-axis-track">
        {DATAS.map((dataObj) => (
          <Card
            key={dataObj.id}
            dataObj={dataObj}
            onCardClickFunc={onCardClick}
          />
        ))}
      </div>
      {/* <div className="action-upload-footer-dock">
            <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFileChange} />
            <button className="btn-upload" onClick={handleUploadClick}>
                <i className="fas fa-cloud-upload-alt"></i> Upload System Imagery Assets
            </button>
        </div> */}
    </div>
  );
}
