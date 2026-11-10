import React, { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown, Calendar } from 'lucide-react';

export default function BookDropdown({ 
  bike, 
  buttonText = "Book this bike", 
  buttonStyle = {},
  onShowToast,
  onStartBooking,
  size = "normal", // "normal" or "compact"
  isOpen: controlledIsOpen,
  onToggle
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const dropdownRef = useRef(null);

  const toggleDropdown = (val) => {
    if (onToggle) {
      onToggle(val);
    } else {
      setInternalIsOpen(val);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        toggleDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const phoneNumber = "+919876543210";
  const displayPhone = "+91 98765 43210";

  const handlePhoneClick = (e) => {
    e.stopPropagation();
    toggleDropdown(false);
    if (onShowToast) {
      onShowToast(`Connecting call to The Road Eagle at ${displayPhone}...`);
    }
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    toggleDropdown(false);
    const text = encodeURIComponent(
      `Hello The Road Eagle! I would like to book the ${bike?.name || 'motorcycle'} (${bike?.model || ''}). Please share availability and rental confirmation.`
    );
    if (onShowToast) {
      onShowToast(`Opening WhatsApp chat for ${bike?.name || 'bike'}...`);
    }
    window.open(`https://api.whatsapp.com/send?phone=${phoneNumber.replace('+', '')}&text=${text}`, '_blank');
  };

  const handleZaloClick = (e) => {
    e.stopPropagation();
    toggleDropdown(false);
    if (onShowToast) {
      onShowToast(`Connecting to Zalo concierge (+91 98765 43210)...`);
    }
    window.open(`https://zalo.me/${phoneNumber.replace('+', '')}`, '_blank');
  };

  const handleOldBookingClick = (e) => {
    e.stopPropagation();
    toggleDropdown(false);
    if (onStartBooking && bike) {
      onStartBooking(bike);
    }
  };

  const isCompact = size === "compact";

  return (
    <div 
      ref={dropdownRef} 
      style={{ 
        position: 'relative', 
        display: 'inline-block', 
        width: isCompact ? '100%' : 'auto' 
      }}
    >
      {/* Red Pill Button matching user image */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onStartBooking && bike) {
            onStartBooking(bike);
          } else {
            toggleDropdown(!isOpen);
          }
        }}
        style={{
          background: '#FF3B30',
          color: '#ffffff',
          fontWeight: 600,
          borderRadius: '9999px',
          padding: isCompact ? '10px 16px' : '14px 26px',
          fontSize: isCompact ? '0.88rem' : '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          boxShadow: '0 4px 18px rgba(255, 59, 48, 0.35)',
          cursor: 'pointer',
          border: 'none',
          transition: 'all 0.15s ease',
          ...buttonStyle
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#FF5247';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = buttonStyle.background || '#FF3B30';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span>{buttonText}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' 
          }} 
        />
      </button>

      {/* Dropdown Menu matching uploaded image */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: isCompact ? 'auto' : 0,
            right: isCompact ? 0 : 'auto',
            width: isCompact ? '180px' : '200px',
            minWidth: '170px',
            background: '#131822',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Phone Option */}
          <div
            onClick={handlePhoneClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Phone size={18} strokeWidth={1.8} color="#ffffff" />
            <span>Phone</span>
          </div>

          {/* WhatsApp Option */}
          <div
            onClick={handleWhatsAppClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              <path d="M8 10a5 5 0 0 0 5 5m-5-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-.5a4 4 0 0 0 2.5 2.5v-.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1A8 8 0 0 1 8 10Z" />
            </svg>
            <span>WhatsApp</span>
          </div>

          {/* Zalo Option */}
          <div
            onClick={handleZaloClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '9px',
              letterSpacing: '-0.5px',
              color: '#ffffff',
              border: '1.2px solid #ffffff',
              borderRadius: '4px',
              lineHeight: 1
            }}>
              zalo
            </div>
            <span>Zalo</span>
          </div>

          {/* Hidden/Future Flow: Kept accessible for future implementation */}
          {onStartBooking && (
            <div
              onClick={handleOldBookingClick}
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: '4px',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: '#64748B',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#00A3FF'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Calendar size={13} />
              <span>Online Reservation Form</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
