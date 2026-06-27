import React from 'react';
import './ShareButton.css';

export default function ShareButton({ title, text, url }) {
  
  const handleNativeShare = async () => {
    // Check if the browser supports the native Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || document.title,
          text: text || 'Check this out!',
          // If no URL is provided, default to the current active webpage URL
          url: url || window.location.href,
        });
        console.log('Content shared successfully!');
      } catch (error) {
        // Handle case where user cancels the share drawer midway
        if (error.name !== 'AbortError') {
          console.error('Error attempting to share:', error);
        }
      }
    } else {
      // Fallback behavior for older desktop browsers that don't support native sharing
      const shareUrl = url || window.location.href;
      const fallbackText = `${text || ''} ${shareUrl}`;
      
      // Copy text to clipboard as a smooth fallback option
      try {
        await navigator.clipboard.writeText(fallbackText);
        alert('Share API not supported on this browser. Link and card details copied to clipboard instead!');
      } catch (err) {
        alert(`Sharing not supported. Copy this link manually: ${shareUrl}`);
      }
    }
  };

  return (
    <button 
      type="button" 
      className="pdp-v4-share-btn" 
      onClick={handleNativeShare}
      title="Share to other applications"
    >
      <i className="fas fa-share-alt"></i> Share
    </button>
  );
}