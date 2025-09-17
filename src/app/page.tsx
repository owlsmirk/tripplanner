"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function Page() {
  // --- State ---
  const [step, setStep] = useState<"input" | "overview" | "personalize">("input");

  const [destination, setDestination] = useState("");
  const destinations = ["Paris", "Costa Rica", "Tokyo", "Bali", "Rome"];
  const [placeholder, setPlaceholder] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [isTypingActive, setIsTypingActive] = useState(true);

  // Dates
  const [whenTab, setWhenTab] = useState<"dates" | "flexible">("dates");
  const [showWhen, setShowWhen] = useState(false);
  const [dateRange, setDateRange] = useState<any>({
    startDate: null,
    endDate: null,
    key: "selection",
  });
  const [flexibleDays, setFlexibleDays] = useState(5);
  const [flexibleMonth, setFlexibleMonth] = useState("");

  // Travelers
  const [travelers, setTravelers] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [showTravelers, setShowTravelers] = useState(false);

  // Budget
  const [budget, setBudget] = useState("");

  // Plan
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [suggestedActivities, setSuggestedActivities] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState("");

  // Scroll Refs
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const activitiesRef = useRef<HTMLDivElement | null>(null);
  const whenRef = useRef<HTMLDivElement | null>(null);
  const whoRef = useRef<HTMLDivElement | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (summary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [summary]);

  useEffect(() => {
    if (suggestedActivities.length > 0 && activitiesRef.current) {
      activitiesRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [suggestedActivities]);

  // Outside click handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (whenRef.current && !whenRef.current.contains(e.target as Node)) {
        setShowWhen(false);
      }
      if (whoRef.current && !whoRef.current.contains(e.target as Node)) {
        setShowTravelers(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!isTypingActive) return;
    const current = destinations[typingIndex];
    let timeout: any;

    if (!deleting && charIndex <= current.length) {
      timeout = setTimeout(() => {
        setPlaceholder(current.substring(0, charIndex));
        setCharIndex((c) => c + 1);
      }, 120);
    } else if (deleting && charIndex >= 0) {
      timeout = setTimeout(() => {
        setPlaceholder(current.substring(0, charIndex));
        setCharIndex((c) => c - 1);
      }, 80);
    } else if (!deleting && charIndex > current.length) {
      timeout = setTimeout(() => setDeleting(true), 1000);
    } else if (deleting && charIndex < 0) {
      setDeleting(false);
      setTypingIndex((i) => (i + 1) % destinations.length);
      setCharIndex(0);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, typingIndex, isTypingActive]);

  // --- Helpers ---
  const formattedWhen =
    whenTab === "dates" && dateRange.startDate && dateRange.endDate
      ? `${format(dateRange.startDate, "MMM d")} – ${format(
          dateRange.endDate,
          "MMM d, yyyy"
        )}`
      : whenTab === "flexible"
      ? `${flexibleDays} days ${
          flexibleMonth ? "in " + flexibleMonth : "anytime"
        }`
      : "Select dates";

  const travelerSummary =
    Object.entries(travelers)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${count} ${type}`)
      .join(", ") || "Add travelers";

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  const addCustomActivity = () => {
    if (customActivity.trim()) {
      setSelectedActivities((prev) => [...prev, customActivity.trim()]);
      setCustomActivity("");
    }
  };

  const resetSearch = () => {
    setDestination("");
    setSummary("");
    setSuggestedActivities([]);
    setSelectedActivities([]);
    setCustomActivity("");
    setStep("input");
  };

  // --- API Calls ---
  const handleGeneratePlan = async () => {
    setLoading(true);
    setSummary("");
    try {
      const res = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          dateRange,
          travelers,
          budget,
        }),
      });
      const data = await res.json();
      setSummary(data.summary || "");
    } catch (err) {
      console.error("Error fetching summary", err);
      setSummary("Unable to fetch destination overview.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/personalize/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, travelers, budget }),
      });
      const data = await res.json();
      setSuggestedActivities(data.suggestedActivities || []);
    } catch (err) {
      console.error("Error fetching activities", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Omnipresent Button ---
  const handleButtonClick = () => {
    if (step === "input") {
      handleGeneratePlan();
      setStep("overview");
    } else if (step === "overview") {
      handleGetActivities();
      setStep("personalize");
    } else if (step === "personalize") {
      handleGetActivities(); // loop refinement
    }
  };

  const buttonLabel =
    loading
      ? "Loading..."
      : step === "input"
      ? "Personalize My Trip"
      : "Continue Personalization";

  // --- UI ---
  return (
    <main className="flex flex-col items-center min-h-screen p-6 bg-gray-50 text-black">
      <div className="flex flex-col space-y-4 w-full max-w-md">
        {/* Destination */}
        <div className="bg-white p-4 rounded-xl shadow relative">
          <label className="block text-sm font-medium mb-1">Where?</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onFocus={() => {
              setIsTypingActive(false);
              setPlaceholder("");
            }}
            onBlur={() =>
              destination.trim() === "" && setIsTypingActive(true)
            }
            placeholder={placeholder}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none"
          />
        </div>

        {/* When */}
        <div ref={whenRef} className="bg-white p-4 rounded-xl shadow relative">
          <label className="block text-sm font-medium mb-1">When?</label>
          <div
            onClick={() => setShowWhen(!showWhen)}
            className="w-full px-4 py-2 rounded-lg border cursor-pointer"
          >
            {formattedWhen}
          </div>

          {showWhen && (
            <div className="mt-3 bg-white p-3 border rounded-lg shadow">
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={() => setWhenTab("dates")}
                  className={`px-3 py-1 rounded-full border ${
                    whenTab === "dates" ? "bg-black text-white" : "bg-white"
                  }`}
                >
                  Dates
                </button>
                <button
                  onClick={() => setWhenTab("flexible")}
                  className={`px-3 py-1 rounded-full border ${
                    whenTab === "flexible" ? "bg-black text-white" : "bg-white"
                  }`}
                >
                  Flexible
                </button>
              </div>

              {whenTab === "dates" ? (
                <DateRange
                  ranges={[
                    {
                      startDate: dateRange.startDate || new Date(),
                      endDate: dateRange.endDate || new Date(),
                      key: "selection",
                    },
                  ]}
                  onChange={(ranges) => {
                    const sel = ranges.selection;
                    setDateRange({
                      startDate: sel.startDate,
                      endDate: sel.endDate,
                      key: "selection",
                    });
                  }}
                  moveRangeOnFirstSelection={false}
                  months={1}
                  direction="horizontal"
                  showDateDisplay={false}
                  showMonthAndYearPickers={true}
                  showSelectionPreview={false}
                  minDate={new Date()}
                />
              ) : (
                <div>
                  <p className="mb-2">How many days?</p>
                  <div className="flex items-center space-x-2 mb-4">
                    <button
                      onClick={() =>
                        setFlexibleDays(Math.max(1, flexibleDays - 1))
                      }
                      className="px-3 py-1 rounded-full border"
                    >
                      -
                    </button>
                    <span>{flexibleDays}</span>
                    <button
                      onClick={() => setFlexibleDays(flexibleDays + 1)}
                      className="px-3 py-1 rounded-full border"
                    >
                      +
                    </button>
                  </div>
                  <p className="mb-2">Travel anytime or pick a month:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((month) => (
                      <div
                        key={month}
                        onClick={() => setFlexibleMonth(month)}
                        className={`px-4 py-2 rounded-lg border cursor-pointer ${
                          flexibleMonth === month
                            ? "bg-black text-white"
                            : "bg-white"
                        }`}
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Travelers */}
        <div ref={whoRef} className="bg-white p-4 rounded-xl shadow relative">
          <label className="block text-sm font-medium mb-1">Who?</label>
          <div
            onClick={() => setShowTravelers(!showTravelers)}
            className="w-full px-4 py-2 rounded-lg border cursor-pointer"
          >
            {travelerSummary}
          </div>

          {showTravelers && (
            <div className="mt-3 bg-white p-3 border rounded-lg shadow">
              {[
                { type: "adults", label: "Adults", note: "Ages 13 and above" },
                { type: "children", label: "Children", note: "Ages 2–12" },
                { type: "infants", label: "Infants", note: "Under 2" },
                { type: "pets", label: "Pets", note: "" },
              ].map(({ type, label, note }) => (
                <div
                  key={type}
                  className="flex justify-between items-center py-2"
                >
                  <div>
                    <span className="capitalize font-medium">{label}</span>
                    {note && <p className="text-xs text-gray-500">{note}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setTravelers((prev) => ({
                          ...prev,
                          [type]: Math.max(
                            0,
                            prev[type as keyof typeof prev] - 1
                          ),
                        }))
                      }
                      className="px-3 py-1 rounded-full border"
                    >
                      -
                    </button>
                    <span>{travelers[type as keyof typeof travelers]}</span>
                    <button
                      onClick={() =>
                        setTravelers((prev) => ({
                          ...prev,
                          [type]: prev[type as keyof typeof prev] + 1,
                        }))
                      }
                      className="px-3 py-1 rounded-full border"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget */}
        <div className="bg-white p-4 rounded-xl shadow relative">
          <label className="block text-sm font-medium mb-1">Budget</label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none"
          >
            <option value="">Select</option>
            <option value="low">$ Budget</option>
            <option value="mid">$$ Moderate</option>
            <option value="high">$$$ Premium</option>
            <option value="luxury">$$$$ Luxury</option>
          </select>
        </div>

        {/* Summary */}
        {!loading && summary && (
          <div
            ref={summaryRef}
            className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow border"
          >
            <h2 className="text-xl font-bold mb-3">Know your destination</h2>
            <p className="text-gray-700 leading-relaxed text-sm">{summary}</p>
          </div>
        )}

        {/* Activities */}
        {!loading && step === "personalize" && (
          <div
            ref={activitiesRef}
            className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow border"
          >
            <h2 className="text-lg font-semibold mb-3">
              Let’s personalize your itinerary
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Please let us know if you have any specific interests.
            </p>

            {/* Standard Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {["Culture", "Food", "Adventure", "Relaxation", "Nature", "Shopping"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleActivity(cat)}
                    className={`px-3 py-1 rounded-full border ${
                      selectedActivities.includes(cat)
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            {/* Destination-Specific Activities */}
            {suggestedActivities.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">
                  Popular in {destination}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedActivities.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleActivity(s)}
                      className={`px-3 py-1 rounded-full border ${
                        selectedActivities.includes(s)
                          ? "bg-black text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Activity */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                placeholder="Type any specific activities you’d like to add..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={addCustomActivity}
                className="px-4 py-2 bg-black text-white rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Omnipresent Button */}
        <button
          onClick={handleButtonClick}
          disabled={loading}
          className="bg-black text-white py-3 rounded-full hover:bg-gray-800 mt-6"
        >
          {buttonLabel}
        </button>

        {/* Restart Search */}
        {step !== "input" && !loading && (
          <button
            onClick={resetSearch}
            className="mt-3 px-4 py-2 border rounded-lg text-red-600"
          >
            Restart Search
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow border animate-pulse">
            <p className="text-gray-700 text-sm">
              {step === "input"
                ? "Fetching Destination Overview..."
                : "Fetching Suggested Activities..."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
