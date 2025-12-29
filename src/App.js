import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const RENDER_URL = "https://food-backend-7h2y.onrender.com";
const socket = io.connect(RENDER_URL);

const steps = [
  { label: "Order Placed", icon: "📦" },
  { label: "Preparing", icon: "🍳" },
  { label: "Out for Delivery", icon: "🛵" },
  { label: "Delivered", icon: "✅" }
];

function App() {
  const [isOrdered, setIsOrdered] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Order Placed");
  const [stageTimes, setStageTimes] = useState({});
  
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get('role');
  const isAdmin = role === 'admin'; // 'admin' query unte admin view vasthundi

  const orderId = "123";

  useEffect(() => {
    // 1. Initial Data Fetch
    fetch(`${RENDER_URL}/order/${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setIsOrdered(data.isOrdered || false);
          setCurrentStatus(data.status || "Order Placed");
          setStageTimes(data.stageTimes || {});
        }
      })
      .catch(err => console.error("Fetch error:", err));

    // 2. Real-time Listener
    socket.on("receive_status", (data) => {
      setIsOrdered(data.isOrdered);
      setCurrentStatus(data.newStatus);
      setStageTimes(data.stageTimes || {});
    });

    return () => socket.off("receive_status");
  }, []);

  const handlePlaceOrder = () => {
    socket.emit("update_status", { orderId: orderId, newStatus: "Order Placed" });
  };

  const handleUpdate = (status) => {
    socket.emit("update_status", { orderId: orderId, newStatus: status });
  };

  const handleReset = () => {
    socket.emit("update_status", { orderId: orderId, newStatus: "RESET_ORDER" });
  };

  const currentIndex = steps.findIndex(s => s.label === currentStatus);

  const renderTracker = () => (
    <div className="tracker-card">
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={index} className="step-item">
            <motion.div 
              animate={{ 
                backgroundColor: isActive ? "#4CAF50" : "#ccc",
                scale: isCurrent ? 1.15 : 1,
              }}
              className="icon-circle"
            >
              {step.icon}
            </motion.div>
            <p className={`label ${isActive ? "active" : ""}`}>{step.label}</p>
            <span className="stage-time">
              {stageTimes[step.label] || "--:--"}
            </span>

            {index < steps.length - 1 && (
              <div className="connector-line">
                <motion.div 
                  className="progress-fill" 
                  animate={{ width: index < currentIndex ? "100%" : "0%" }} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="app-container">
      <h1 className="title">
        {isAdmin ? "🛠️ Admin Control Panel" : "🚚 Live Order Tracking"}
      </h1>

      <AnimatePresence mode="wait">
        {!isAdmin ? (
          !isOrdered ? (
            <motion.div key="btn" className="order-btn-wrapper">
              <h2>Pawan's Kitchen 🍕</h2>
              <button className="order-main-btn" onClick={handlePlaceOrder}>
                Place My Order Now
              </button>
            </motion.div>
          ) : (
            <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {renderTracker()}
            </motion.div>
          )
        ) : (
          <div className="admin-view">
             {renderTracker()}
             <div className="admin-section">
                <h3>Admin Controls</h3>
                <div className="btn-group">
                  {steps.map(step => (
                    <button 
                      key={step.label} 
                      className={currentStatus === step.label ? "btn-active" : ""}
                      onClick={() => handleUpdate(step.label)}
                    >
                      {step.label}
                    </button>
                  ))}
                  <button className="btn-reset" onClick={handleReset}>🔄 Reset</button>
                </div>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;