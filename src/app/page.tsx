"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DateRange } from "react-date-range";
import { motion } from "framer-motion";
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

  // Errors
  const [errors, setErrors] = useState({
    destination: "",
    when: "",
    travelers: "",
    budget: "",
  });

  // Plan
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>({});
  const [typedOutlook, setTypedOutlook] = useState<string[]>([]);

  // Activities
  const [activityCategories, setActivityCategories] = useState<
    { name: string; activities: string[] }[]
  >([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState("");

  // Refs
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const activitiesRef = useRef<HTMLDivElement | null>(null);
  const whenRef = useRef<HTMLDivElement | null>(null);
  const whoRef = useRef<HTMLDivElement | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (!summary || Object.keys(summary).length === 0) return;

    const entries = Object.entries(summary).map(
      ([key, value]) => `${capitalize(key)}: ${value}`
    );

    let i = 0;
    setTypedOutlook([]);
    const interval = setInterval(() => {
      setTypedOutlook((prev) => [...prev, entries[i]]);
      i++;
      if (i >= entries.length) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [summary]);

  useEffect(() => {
    if (activityCategories.length > 0 && activitiesRef.current) {
      activitiesRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activityCategories]);

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

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  // --- Validation ---
  const validateFields = () => {
    let newErrors = { destination: "", when: "", travelers: "", budget: "" };
    let isValid = true;

    if (!destination.trim()) {
      newErrors.destination = "Please enter a destination.";
      isValid = false;
    }

    if (whenTab === "dates") {
      if (!dateRange.startDate || !dateRange.endDate) {
        newErrors.when = "Please select your travel dates.";
        isValid = false;
      }
    } else if (whenTab === "flexible" && !flexibleMonth) {
      newErrors.when = "Please select a month for flexible travel.";
      isValid = false;
    }

    if (Object.values(travelers).reduce((a, b) => a + b, 0) === 0) {
      newErrors.travelers = "Please add at least one traveler.";
      isValid = false;
    }

    if (!budget) {
      newErrors.budget = "Please select a budget.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // --- Handlers ---
  const handleGeneratePlan = async () => {
    setLoading(true);
    setSummary({});
    setTypedOutlook([]);
    try {
      const res = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, dateRange, travelers, budget }),
      });
      const data = await res.json();
      setSummary(data.summary || {});
      setStep("overview");
    } catch (err) {
      console.error("Error fetching summary", err);
      setSummary({ overall: "Unable to fetch destination outlook." });
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
      setActivityCategories(data.categories || []);
    } catch (err) {
      console.error("Error fetching activities", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleButtonClick = () => {
    if (step === "input") {
      if (!validateFields()) return;
      handleGeneratePlan();
    } else if (step === "overview") {
      handleGetActivities();
      setStep("personalize");
    } else if (step === "personalize") {
      handleGetActivities();
    }
  };

  const buttonLabel =
    loading
      ? "Loading..."
      : step === "input"
      ? "Personalize My Trip"
      : "Continue Personalization";

  // --- Render ---
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
          {errors.destination && (
            <p className="text-xs text-red-600 mt-1">{errors.destination}</p>
          )}
        </div>

        {/* When */}
        <div ref={whenRef} className="bg-white p-4 rounded-xl shadow relative">
          <label className="block text-sm font-medium mb-1">When?</label>
          <div
            onClick={() => setShowWhen(!showWhen)}
            className="w-full px-4 py-2 rounded-lg border cursor-pointer"
          >
            {whenTab === "dates" && dateRange.startDate && dateRange.endDate
              ? `${format(dateRange.startDate, "MMM d")} – ${format(
                  dateRange.endDate,
                  "MMM d, yyyy"
                )}`
              : whenTab === "flexible"
              ? `${flexibleDays} days ${
                  flexibleMonth ? "in " + flexibleMonth : "anytime"
                }`
              : "Select dates"}
          </div>
          {errors.when && (
            <p className="text-xs text-red-600 mt-1">{errors.when}</p>
          )}
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
                      "January","February","March","April","May","June",
                      "July","August","September","October","November","December",
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
            {Object.entries(travelers)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => `${count} ${type}`)
              .join(", ") || "Add travelers"}
          </div>
          {errors.travelers && (
            <p className="text-xs text-red-600 mt-1">{errors.travelers}</p>
          )}
          {showTravelers && (
            <div className="mt-3 bg-white p-3 border rounded-lg shadow">
              {[
                { type: "adults", label: "Adults", note: "Ages 13 and above" },
                { type: "children", label: "Children", note: "Ages 2–12" },
                { type: "infants", label: "Infants", note: "Under 2" },
                { type: "pets", label: "Pets", note: "" },
              ].map(({ type, label, note }) => (
                <div key={type} className="flex justify-between items-center py-2">
                  <div>
                    <span className="capitalize font-medium">{label}</span>
                    {note && <p className="text-xs text-gray-500">{note}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setTravelers((prev) => ({
                          ...prev,
                          [type]: Math.max(0, prev[type as keyof typeof prev] - 1),
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
          {errors.budget && (
            <p className="text-xs text-red-600 mt-1">{errors.budget}</p>
          )}
        </div>

        {/* Travel Outlook */}
        {step === "overview" && (
          <div
            ref={summaryRef}
            className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow border"
          >
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Personalized to your chosen criteria
            </p>
            <h2 className="text-xl font-bold mb-3">
              Your Travel Outlook for {destination || "your trip"}
            </h2>

            {loading ? (
              <p className="text-gray-400 italic">Generating insights...</p>
            ) : typedOutlook.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                {typedOutlook.map((line, idx) => {
                  if (!line) return null;
                  const [label, ...rest] = line.split(":");
                  return (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.4, duration: 0.4 }}
                    >
                      <strong>{label}:</strong> {rest.join(":").trim()}
                    </motion.li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">
                {Object.keys(summary).length === 0
                  ? "No insights available yet. Please try again."
                  : summary.overall || ""}
              </p>
            )}
          </div>
        )}

        {/* Activities */}
        {!loading && step === "personalize" && activityCategories.length > 0 && (
          <div
            ref={activitiesRef}
            className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow border"
          >
            <h2 className="text-lg font-semibold mb-3">
              Let’s personalize your itinerary
            </h2>
            {activityCategories.map((cat, idx) => (
              <div key={idx} className="mb-4">
                <p className="text-sm font-medium mb-2">{cat.name}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.activities.map((act, aIdx) => (
                    <motion.button
                      key={aIdx}
                      onClick={() => toggleActivity(act)}
                      className={`px-3 py-1 rounded-full border ${
                        selectedActivities.includes(act)
                          ? "bg-black text-white"
                          : "bg-white text-black"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: aIdx * 0.15, duration: 0.3 }}
                    >
                      {act}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
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
        <motion.button
          onClick={handleButtonClick}
          disabled={loading}
          className={`py-3 rounded-full mt-6 relative overflow-hidden ${
            loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
          animate={{
            boxShadow: loading
              ? "none"
              : [
                  "0 0 0px rgba(0,0,0,0.2)",
                  "0 0 15px rgba(0,0,0,0.6)",
                  "0 0 0px rgba(0,0,0,0.2)",
                ],
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
        >
          {buttonLabel}
        </motion.button>

        {/* Restart */}
        {step !== "input" && !loading && (
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 border rounded-lg text-red-600"
          >
            Restart Search
          </button>
        )}
      </div>
    </main>
  );
}
