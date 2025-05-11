import React, { useState, useEffect } from 'react';
import './EmergencyPage.css';

function EmergencyPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASEURL}/emergency/get-all-emergency-services`);
        if (!response.ok) {
          throw new Error('Failed to fetch emergency services');
        }
        const data = await response.json();
        if (data.success) {
          setServices(data.data);
        } else {
          throw new Error('Failed to load emergency services');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div className="emergency-container">Loading emergency services...</div>;
  }

  if (error) {
    return <div className="emergency-container">Error: {error}</div>;
  }

  return (
    <div className="emergency-container">
      <div className="emergency-header">
        <div>
          <h1 className="emergency-title">Emergency Services</h1>
          <p className="emergency-subtitle">Quick access to emergency resources and information</p>
        </div>
        <button className="emergency-call-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="emergency-button-icon"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Emergency Call
        </button>
      </div>

      <div className="emergency-alert">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="emergency-alert-icon"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div className="emergency-alert-content">
          <h3 className="emergency-alert-title">Active Weather Alert</h3>
          <p className="emergency-alert-description">
            Severe thunderstorm warning in effect until 8:00 PM. Take necessary precautions.
          </p>
        </div>
      </div>

      <div className="emergency-grid">
        <div className="emergency-card">
          <div className="emergency-card-header">
            <h3 className="emergency-card-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="emergency-card-icon"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Emergency Contacts
            </h3>
          </div>
          <div className="emergency-card-content">
            <div className="emergency-contacts">
              {services.map((service) => (
                <div key={service._id} className="emergency-contact">
                  <h4 className="emergency-contact-title">
                    {service.title.charAt(0).toUpperCase() + service.title.slice(1)}
                  </h4>
                  <p className="emergency-contact-info">Contact: {service.contact}</p>
                  <p className="emergency-contact-info">Location: {service.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="emergency-card">
          <div className="emergency-card-header">
            <h3 className="emergency-card-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="emergency-card-icon"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Emergency Locations
            </h3>
          </div>
          <div className="emergency-card-content">
            <div className="emergency-locations">
              {services.map((service) => (
                <div key={service._id} className="emergency-location">
                  <h4 className="emergency-location-title">
                    {service.title.charAt(0).toUpperCase() + service.title.slice(1)}
                  </h4>
                  <p className="emergency-location-info">{service.location}</p>
                  <p className="emergency-location-info">Contact: {service.contact}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="emergency-card-footer">
            <button className="emergency-view-button">View Map</button>
          </div>
        </div>

        <div className="emergency-card">
          <div className="emergency-card-header">
            <h3 className="emergency-card-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="emergency-card-icon"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Emergency Preparedness
            </h3>
          </div>
          <div className="emergency-card-content">
            <div className="emergency-preparedness">
              <h4 className="emergency-preparedness-title">Emergency Kit Checklist</h4>
              <ul className="emergency-checklist">
                <li>Water (one gallon per person per day)</li>
                <li>Non-perishable food</li>
                <li>Flashlight and batteries</li>
                <li>First aid kit</li>
                <li>Medications and medical items</li>
                <li>Multi-purpose tool</li>
                <li>Personal hygiene items</li>
                <li>Copies of personal documents</li>
                <li>Cell phone with chargers</li>
                <li>Emergency contact information</li>
                <li>Extra cash</li>
                <li>Emergency blanket</li>
              </ul>
            </div>
          </div>
          <div className="emergency-card-footer">
            <button className="emergency-view-button">Download Full Guide</button>
          </div>
        </div>

        <div className="emergency-card">
          <div className="emergency-card-header">
            <h3 className="emergency-card-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="emergency-card-icon"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              Emergency Alerts
            </h3>
          </div>
          <div className="emergency-card-content">
            <p className="emergency-alerts-description">
              Sign up to receive emergency alerts via text message, email, or phone call.
            </p>
            <div className="emergency-alert-options">
              <div className="emergency-alert-option">
                <input
                  type="checkbox"
                  id="text-alerts"
                  className="emergency-checkbox"
                />
                <label htmlFor="text-alerts" className="emergency-checkbox-label">
                  Text Message Alerts
                </label>
              </div>
              <div className="emergency-alert-option">
                <input
                  type="checkbox"
                  id="email-alerts"
                  className="emergency-checkbox"
                />
                <label htmlFor="email-alerts" className="emergency-checkbox-label">
                  Email Alerts
                </label>
              </div>
              <div className="emergency-alert-option">
                <input
                  type="checkbox"
                  id="phone-alerts"
                  className="emergency-checkbox"
                />
                <label htmlFor="phone-alerts" className="emergency-checkbox-label">
                  Phone Call Alerts
                </label>
              </div>
            </div>
          </div>
          <div className="emergency-card-footer">
            <button className="emergency-subscribe-button">Subscribe to Alerts</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmergencyPage;