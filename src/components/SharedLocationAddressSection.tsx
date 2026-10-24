import React, { useState, useEffect } from 'react';
import { StandardAddressData, StandardLocationData } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface SharedLocationAddressSectionProps {
  theme?: 'customer' | 'collector';
  addressData: StandardAddressData;
  onAddressChange: (data: StandardAddressData) => void;
  locationData: StandardLocationData;
  onLocationCaptured: (loc: StandardLocationData, autoResolvedAddress?: Partial<StandardAddressData>) => void;
  required?: boolean;
}

export const SharedLocationAddressSection: React.FC<SharedLocationAddressSectionProps> = ({
  theme = 'customer',
  addressData,
  onAddressChange,
  locationData,
  onLocationCaptured,
  required = true,
}) => {
  const { t, language } = useLanguage();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null);

  const isCustomer = theme === 'customer';

  // Primary palette styling
  const labelColor = isCustomer ? 'text-[#4A2636]' : 'text-slate-700';
  const inputClass = isCustomer
    ? 'w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-[#4A2636] placeholder:text-[#8A6875] focus:border-[#E83E72] focus:ring-2 focus:ring-[#FCE7F3] focus:outline-hidden cust-input-field'
    : 'w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-hidden';

  // State to track if manual address fallback is required
  const [showManualFallbackNotice, setShowManualFallbackNotice] = useState(false);
  const [addressCompletenessWarning, setAddressCompletenessWarning] = useState<string | null>(null);

  // Helper to query reverse geocoding safely without duplicate calls
  const resolveAddressFromCoords = async (lat: number, lng: number, locUpdate: StandardLocationData) => {
    setIsResolvingAddress(true);
    setAddressCompletenessWarning(null);
    setShowManualFallbackNotice(false);

    try {
      const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data && data.success) {
        const resolved: Partial<StandardAddressData> = {
          state: data.state || '',
          district: data.district || '',
          city: data.city || '',
          block: data.block || '',
          village: data.village || '',
          locality: data.locality || data.area || '',
          fullAddress: data.fullAddress || '',
          pincode: data.pincode || '',
        };

        const cityOrArea = data.city || data.locality || data.district || '';
        const accuracyMeters = locUpdate.locationAccuracy ? Math.round(locUpdate.locationAccuracy) : null;
        const accuracyText = accuracyMeters ? `(±${accuracyMeters}m)` : '';

        // Check completeness
        if (!data.isComplete || !data.pincode) {
          setAddressCompletenessWarning(
            language === 'hi'
              ? '⚠️ अनुमानित पता: कुछ विवरण (जैसे मकान नं. या पिन कोड) अधूरे हो सकते हैं। कृपया नीचे जांच लें।'
              : '⚠️ Approximate address: Some details (e.g. house number or PIN) may be incomplete. Please verify below.'
          );
        }

        setResolvedNotice(
          language === 'hi'
            ? `📍 GPS से स्वतः पता प्राप्त हुआ: ${cityOrArea} ${accuracyText}`
            : `📍 Address auto-detected from GPS: ${cityOrArea} ${accuracyText}`
        );
        onLocationCaptured(locUpdate, resolved);
      } else {
        // Geocoding failed: fallback to manual entry
        setShowManualFallbackNotice(true);
        onLocationCaptured(locUpdate);
      }
    } catch (err) {
      console.warn('Address resolution error:', err);
      setShowManualFallbackNotice(true);
      onLocationCaptured(locUpdate);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Best available GPS fix with retry if accuracy is poor (>150m)
  const triggerGpsCapture = () => {
    setIsDetecting(true);
    setGpsError(null);
    setResolvedNotice(null);
    setAddressCompletenessWarning(null);
    setShowManualFallbackNotice(false);

    if (!('geolocation' in navigator)) {
      setGpsError(
        language === 'hi'
          ? 'इस ब्राउज़र या डिवाइस में GPS Geolocation समर्थित नहीं है।'
          : 'GPS Geolocation is not supported in this browser or device.'
      );
      setIsDetecting(false);
      return;
    }

    // High accuracy GPS fix with timeout and maximumAge: 0
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const capturedAt = new Date().toISOString();

        const locUpdate: StandardLocationData = {
          latitude: lat,
          longitude: lng,
          locationAccuracy: accuracy,
          locationCapturedAt: capturedAt,
        };

        setIsDetecting(false);

        // If accuracy is poor (>150 meters), try one brief high-accuracy refinement
        if (accuracy > 150) {
          console.log(`Initial accuracy was ±${Math.round(accuracy)}m. Attempting brief refinement...`);
          navigator.geolocation.getCurrentPosition(
            (refinedPos) => {
              const refinedAccuracy = refinedPos.coords.accuracy;
              const refinedLoc = refinedAccuracy < accuracy ? {
                latitude: refinedPos.coords.latitude,
                longitude: refinedPos.coords.longitude,
                locationAccuracy: refinedAccuracy,
                locationCapturedAt: new Date().toISOString(),
              } : locUpdate;
              resolveAddressFromCoords(refinedLoc.latitude, refinedLoc.longitude, refinedLoc);
            },
            () => {
              // Proceed with initial reading if refinement fails
              resolveAddressFromCoords(lat, lng, locUpdate);
            },
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
          );
        } else {
          resolveAddressFromCoords(lat, lng, locUpdate);
        }
      },
      (err) => {
        setIsDetecting(false);
        let msg = t.location.gpsRequiredError;
        if (err.code === 1) {
          msg =
            language === 'hi'
              ? '📍 GPS अनुमति अस्वीकार कर दी गई (Permission Denied)। कृपया Location चालू करें।'
              : '📍 Location permission denied. Please allow location access.';
        } else if (err.code === 2) {
          msg =
            language === 'hi'
              ? '📍 GPS सिग्नल उपलब्ध नहीं है (Position Unavailable)। कृपया खुले स्थान में जाएं या पुनः प्रयास करें।'
              : '📍 GPS signal unavailable. Please move to an open area or tap retry.';
        } else if (err.code === 3) {
          msg =
            language === 'hi'
              ? '📍 GPS सिग्नल टाइमआउट (Timeout)। कृपया पुनः जांचें बटन दबाएं।'
              : '📍 GPS acquisition timed out. Please tap re-detect.';
        }
        setGpsError(msg);
        setShowManualFallbackNotice(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleFieldChange = (field: keyof StandardAddressData, value: string) => {
    onAddressChange({
      ...addressData,
      [field]: value,
    });
  };

  const hasGps = locationData.latitude && locationData.longitude;

  // Auto-start GPS capture if not already captured
  useEffect(() => {
    if (!locationData.latitude || !locationData.longitude) {
      triggerGpsCapture();
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* 1. AUTHORITATIVE GPS LOCATION CAPTURE BADGE */}
      <div
        className={`rounded-2xl border p-3.5 transition-colors ${
          hasGps
            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
            : isCustomer
            ? 'border-rose-200 bg-rose-50/70 text-rose-950'
            : 'border-slate-200 bg-slate-50 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin
              className={`h-4 w-4 shrink-0 ${
                hasGps ? 'text-emerald-600' : isCustomer ? 'text-[#E83E72]' : 'text-slate-500'
              }`}
            />
            <div>
              <span className="text-xs font-bold block">
                {hasGps
                  ? t.location.gpsCapturedBadge
                  : t.location.gpsCaptureTitle}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">
                {hasGps
                  ? locationData.locationAccuracy
                    ? `${t.location.accuracyLabel} ±${Math.round(locationData.locationAccuracy)}m`
                    : t.location.gpsCapturedBadge
                  : t.location.gpsMandatoryNotice}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerGpsCapture}
            disabled={isDetecting || isResolvingAddress}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
              hasGps
                ? 'border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
                : isCustomer
                ? 'bg-linear-to-r from-[#E83E72] to-[#DE3367] text-white hover:brightness-105 active:scale-98'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <RefreshCw className={`h-3 w-3 ${isDetecting || isResolvingAddress ? 'animate-spin' : ''}`} />
            <span>
              {isDetecting
                ? t.location.checkingGps
                : isResolvingAddress
                ? t.location.resolvingAddressText
                : hasGps
                ? t.location.recheckGps
                : t.location.enableGpsBtn}
            </span>
          </button>
        </div>

        {gpsError && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-rose-100/90 p-2 text-xs font-medium text-rose-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{gpsError}</span>
          </div>
        )}

        {resolvedNotice && !gpsError && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-emerald-100/80 p-2 text-[11px] font-medium text-emerald-900">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>{resolvedNotice}</span>
          </div>
        )}

        {/* Incomplete / Approximate Address Warning Banner */}
        {addressCompletenessWarning && !gpsError && (
          <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-amber-100/90 p-2 text-[11px] font-medium text-amber-950">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
            <span>{addressCompletenessWarning}</span>
          </div>
        )}

        {/* Manual Address Entry Fallback Notice (Only when GPS/geocoding cannot resolve address) */}
        {showManualFallbackNotice && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-slate-100 p-2 text-[11px] text-slate-700 border border-slate-200">
            <span>
              ℹ️ {language === 'hi'
                ? 'पता स्वतः प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें या नीचे मैन्युअल भरें।'
                : 'Address could not be resolved automatically. Please retry or enter manually below.'}
            </span>
            <button
              type="button"
              onClick={triggerGpsCapture}
              className="shrink-0 font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              {language === 'hi' ? 'पुनः प्रयास' : 'Retry'}
            </button>
          </div>
        )}
      </div>

      {/* 2. ADDRESS REVIEW / EDIT HEADING */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold ${labelColor}`}>
            {t.location.addressDetailsHeader}
          </h4>
          <span className="text-[10px] text-slate-500 font-medium">
            {t.location.autoResolvedBadge}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {t.location.addressDetailsSub}
        </p>
      </div>

      {/* 3. STANDARDIZED ADDRESS INPUT FIELDS */}
      {/* State & District */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={`block text-[11px] font-semibold ${labelColor}`}>
            {t.location.stateLabel} {required && '*'}
          </label>
          <input
            type="text"
            value={addressData.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            placeholder={t.location.statePlaceholder}
            className={inputClass}
            required={required}
          />
        </div>
        <div>
          <label className={`block text-[11px] font-semibold ${labelColor}`}>
            {t.location.districtLabel} {required && '*'}
          </label>
          <input
            type="text"
            value={addressData.district}
            onChange={(e) => handleFieldChange('district', e.target.value)}
            placeholder={t.location.districtPlaceholder}
            className={inputClass}
            required={required}
          />
        </div>
      </div>

      {/* City/Town & Block/Tehsil */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={`block text-[11px] font-semibold ${labelColor}`}>
            {t.location.cityLabel} {required && '*'}
          </label>
          <input
            type="text"
            value={addressData.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            placeholder={t.location.cityPlaceholder}
            className={inputClass}
            required={required}
          />
        </div>
        <div>
          <label className={`block text-[11px] font-semibold ${labelColor}`}>
            {t.location.blockLabel}
          </label>
          <input
            type="text"
            value={addressData.block}
            onChange={(e) => handleFieldChange('block', e.target.value)}
            placeholder={t.location.blockPlaceholder}
            className={inputClass}
          />
        </div>
      </div>

      {/* Village & Locality/Area */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={`block text-[11px] font-semibold ${labelColor}`}>
            {t.location.villageLabel}
          </label>
          <input
            type="text"
            value={addressData.village}
            onChange={(e) => handleFieldChange('village', e.target.value)}
            placeholder={t.location.villagePlaceholder}
            className={inputClass}
          />
        </div>
        <div>
          <label className={`block text-[11px] font-semibold ${labelColor}`}>
            {t.location.areaLabel} {required && '*'}
          </label>
          <input
            type="text"
            value={addressData.locality}
            onChange={(e) => handleFieldChange('locality', e.target.value)}
            placeholder={t.location.areaPlaceholder}
            className={inputClass}
            required={required}
          />
        </div>
      </div>

      {/* Full Address & Landmark (Multiline manual residential address, house details, nearby landmark - Optional) */}
      <div>
        <div className="flex items-center justify-between">
          <label className={`block text-[11px] font-semibold ${labelColor}`}>
            {theme === 'collector'
              ? (language === 'hi' ? 'पूरा पता व लैंडमार्क (Full Address & Landmark)' : 'Full Address & Landmark')
              : t.location.fullAddressLabel}
          </label>
          <span className="text-[10px] font-medium text-slate-500">
            {language === 'hi' ? 'वैकल्पिक (Optional)' : 'Optional'}
          </span>
        </div>
        <textarea
          rows={2}
          value={addressData.fullAddress}
          onChange={(e) => handleFieldChange('fullAddress', e.target.value)}
          placeholder={
            theme === 'collector'
              ? (language === 'hi'
                  ? 'मकान नंबर, गली/मोहल्ला, पास का लैंडमार्क व अन्य पते का विवरण दर्ज करें।'
                  : 'Enter house number, street/locality, nearby landmark, and other address details.')
              : t.location.fullAddressPlaceholder
          }
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Pincode */}
      <div>
        <label className={`block text-[11px] font-semibold ${labelColor}`}>
          {t.location.pincodeLabel}
        </label>
        <input
          type="text"
          maxLength={6}
          value={addressData.pincode}
          onChange={(e) => handleFieldChange('pincode', e.target.value.replace(/\D/g, ''))}
          placeholder={t.location.pincodePlaceholder}
          className={inputClass}
        />
      </div>
    </div>
  );
};
