import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets, cities } from "../assets/assets";

const Hero = ({ theme }) => {
  const isDark = theme === "dark";
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <div
      className={`relative overflow-hidden min-h-[92vh] ${isDark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"}`}
      style={{ backgroundImage: `url(${assets.regImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className={`absolute inset-0 ${isDark ? "bg-gradient-to-br from-slate-950/55 via-slate-900/25 to-slate-950/75" : "bg-gradient-to-br from-white/50 via-sky-100/50 to-slate-100/90"}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.35),_transparent_32%)]" />
      <div className="pointer-events-none absolute left-[-5%] top-20 h-52 w-52 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/2 h-72 w-72 rounded-full bg-slate-900/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-6 py-16 md:px-16 lg:px-24 xl:px-32">
        <div className={`max-w-3xl space-y-6 ${isDark ? "text-white" : "text-slate-900"}`}>
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.35em] shadow-lg backdrop-blur-sm ${isDark ? "border-slate-200/20 bg-slate-900/65 text-sky-300" : "border-slate-300 bg-white/90 text-sky-600"}`}>
            Premium hotels • Instant booking • Verified stays
          </span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Book the next unforgettable hotel stay with modern speed and style.
          </h1>
          <p className={`max-w-2xl text-base leading-8 sm:text-lg ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Elevate your travel with curated rooms, dynamic hotel perks, and flexible deals crafted for seamless planning.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:opacity-95">
              Explore stays
            </button>
            <button className={`rounded-full border px-6 py-4 text-sm font-semibold transition ${isDark ? "border-white/20 bg-slate-900 text-white hover:bg-slate-800" : "border-slate-300 bg-white text-slate-950 hover:bg-slate-100"}`}>
              How it works
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`mt-12 grid gap-4 rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl sm:grid-cols-[1.4fr_1fr] lg:grid-cols-[2fr_0.9fr] ${isDark ? "border-slate-800 bg-slate-950/95" : "border-slate-200 bg-white/95"}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="destinationInput" className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Destination
              </label>
              <input
                list="destinations"
                id="destinationInput"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={`w-full rounded-3xl border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500" : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500"}`}
                placeholder="Choose a city"
              />
              <datalist id="destinations">
                {cities.map((city, index) => (
                  <option value={city} key={index} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="checkIn" className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Check in
                </label>
                <input
                  id="checkIn"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={`w-full rounded-3xl border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500" : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500"}`}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="checkOut" className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Check out
                </label>
                <input
                  id="checkOut"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={`w-full rounded-3xl border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500" : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500"}`}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-[0.8fr_auto]">
            <div className="space-y-2">
              <label htmlFor="guests" className="text-sm font-medium text-slate-700">
                Guests
              </label>
              <input
                id="guests"
                type="number"
                min={1}
                max={10}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring focus:ring-sky-200"
              />
            </div>
            <button className="rounded-full bg-sky-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-400">
              Search stays
            </button>
          </div>
        </form>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Fast booking", value: "2 min", accent: "bg-sky-50 text-sky-700" },
            { label: "Top-reviewed hotels", value: "98%", accent: "bg-emerald-50 text-emerald-700" },
            { label: "Support", value: "24/7", accent: "bg-amber-50 text-amber-700" },
          ].map((item) => (
            <div key={item.label} className={`rounded-[1.8rem] border border-slate-200 px-5 py-4 text-sm shadow-sm ${item.accent}`}>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
