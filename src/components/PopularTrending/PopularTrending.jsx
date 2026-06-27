import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab } from "../../store/store";
import "./PopularTrending.css";

const CATEGORIES = {
  accommodation: [
    "AC Lodging Services",
    "Beach Resorts",
    "Bungalows On Hire",
    "Cottages On Hire",
    "Dharamshalas",
    "Farm House",
    "Guest House",
    "Hostels",
    "Hotels",
    "Villas",
    "Paying Guest Accommodations",
    "Resorts",
  ],
  astrology: [
    "Astrologers",
    "Horoscope Reading",
    "Vastu Consultants",
    "Palmistry Experts",
  ],
  automobile: ["Car Repair", "Bike Showrooms", "Tyre Dealers", "Car Washing"],
  beauty: ["Beauty Parlours", "Gyms", "Yoga Centers", "Spas"],
  business: ["CA Services", "Lawyers", "Consultants"],
  education: ["Colleges", "Coaching Centers", "Online Courses"],
  events: ["Wedding Planners", "Caterers", "Photographers"],
};

const TAB_LABELS = {
  accommodation: "Accommodation",
  astrology: "Astrology",
  automobile: "Automobiles & Two Wheelers",
  beauty: "Beauty, Fitness & Sports",
  business: "Business & Legal",
  education: "Education",
  events: "Events & Weddings",
};

const TRENDING = [
  "English Medium Schools",
  "Packers And Movers",
  "Home Delivery Restaurants",
  "Wedding Photographers",
  "Income Tax Consultants",
  "Bitcoin Services",
  "Tour Packages For Goa",
  "Courier Services For USA",
];

export default function PopularTrending() {
  const dispatch = useDispatch();
  const activeTab = useSelector((s) => s.ui.activeTab);

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

        {Object.entries(CATEGORIES).map(([key, items]) => (
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
        ))}
      </section>

      <section className="container trending-searches">
        <h2 className="section-heading">Trending Searches</h2>
        <div className="trending-searches-links-content">
          <p>
            {TRENDING.map((item, i) => (
              <React.Fragment key={item}>
                <a href="#">{item}</a>
                {i < TRENDING.length - 1 && " | "}
              </React.Fragment>
            ))}
          </p>
        </div>
      </section>
    </div>
  );
}
