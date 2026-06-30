import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab } from "../../store/store";
import { apiService } from "../../services/api";
import "./PopularTrending.css";

const TAB_LABELS = {
  accommodation: "Accommodation",
  astrology: "Astrology",
  automobile: "Automobiles & Two Wheelers",
  beauty: "Beauty, Fitness & Sports",
  business: "Business & Legal",
  education: "Education",
  events: "Events & Weddings",
};

export default function PopularTrending() {
  const dispatch = useDispatch();
  const activeTab = useSelector((s) => s.ui.activeTab);
  const [categories, setCategories] = useState({});
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Trending categories endpoint not available - set empty
        setCategories({});

        // Fetch trending searches from API
        const trendingResponse = await apiService.trending.getSearches();
        if (trendingResponse.data) {
          setTrendingSearches(trendingResponse.data);
        } else {
          setTrendingSearches([]);
        }
      } catch (error) {
        console.error("Error fetching trending data:", error);
        setCategories({});
        setTrendingSearches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="directory-container">
      <section className="container popular-categories">
        <h2 className="section-heading">Popular Categories</h2>

        <div className="tabs-wrapper">
          {Object.keys(TAB_LABELS).map((key) => (
            <button
              key={key}
              className={`tab-btn${activeTab === key ? " active" : ""}`}
              onClick={() => dispatch(setActiveTab(key))}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="links-content active">Loading categories...</div>
        ) : Object.keys(categories).length > 0 ? (
          Object.entries(categories).map(([key, items]) => (
            <div
              key={key}
              className={`links-content${activeTab === key ? " active" : ""}`}
              id={key}
            >
              <p>
                {items.map((item, i) => (
                  <React.Fragment key={item}>
                    <a href="#">{item}</a>
                    {i < items.length - 1 && " | "}
                  </React.Fragment>
                ))}
              </p>
            </div>
          ))
        ) : (
          <div className="links-content active">No categories available</div>
        )}
      </section>

      <section className="container trending-searches">
        <h2 className="section-heading">Trending Searches</h2>
        <div className="trending-searches-links-content">
          {loading ? (
            <p>Loading trending searches...</p>
          ) : trendingSearches.length > 0 ? (
            <p>
              {trendingSearches.map((item, i) => (
                <React.Fragment key={item}>
                  <a href="#">{item}</a>
                  {i < trendingSearches.length - 1 && " | "}
                </React.Fragment>
              ))}
            </p>
          ) : (
            <p>No trending searches available</p>
          )}
        </div>
      </section>
    </div>
  );
}
