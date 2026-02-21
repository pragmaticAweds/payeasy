import React, { useState } from "react";

interface PreferencesFormProps {
  initialPreferences?: any;
  onSave: (prefs: any) => void;
}

export default function PreferencesForm({ initialPreferences = {}, onSave }: PreferencesFormProps) {
  const [budget, setBudget] = useState(initialPreferences.budget || "");
  const [amenities, setAmenities] = useState(initialPreferences.amenities || []);
  const [location, setLocation] = useState(initialPreferences.location || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ budget, amenities, location });
      }}
      className="space-y-4"
    >
      <div>
        <label>Budget</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label>Amenities</label>
        <input
          type="text"
          value={amenities.join(", ")}
          onChange={(e) => setAmenities(e.target.value.split(",").map((a) => a.trim()))}
          className="input"
        />
      </div>
      <div>
        <label>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="input"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Save Preferences
      </button>
    </form>
  );
}
