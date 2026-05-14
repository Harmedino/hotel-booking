import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets, cities } from "../assets/assets";

const Hero = () => {
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
      className="relative overflow-hidden min-h-[92vh] bg-slate-950 text-white"
      style={{ backgroundImage: `url(${assets.regImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/40 to-sky-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.96),_transparent_35%)]" />

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-6 py-16 md:px-16 lg:px-24 xl:px-32">
        <div className="max-w-3xl space-y-6 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-sky-200 shadow-xl backdrop-blur-sm">
            Premium hotels • Instant booking • Verified stays
          </span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Book the next unforgettable hotel stay with modern speed and style.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Elevate your travel with curated rooms, dynamic hotel perks, and flexible deals crafted for seamless planning.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="rounded-full bg-sky-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
              Explore stays
            </button>
            <button className="rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15">
              How it works
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 grid gap-4 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:grid-cols-[1.4fr_1fr] lg:grid-cols-[2fr_0.9fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="destinationInput" className="text-sm font-medium text-slate-200">
                Destination
              </label>
              <input
                list="destinations"
                id="destinationInput"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none ring-sky-400/20 focus:border-sky-400 focus:ring"
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
                <label htmlFor="checkIn" className="text-sm font-medium text-slate-200">
                  Check in
                </label>
                <input
                  id="checkIn"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none ring-sky-400/20 focus:border-sky-400 focus:ring"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="checkOut" className="text-sm font-medium text-slate-200">
                  Check out
                </label>
                <input
                  id="checkOut"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none ring-sky-400/20 focus:border-sky-400 focus:ring"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-[0.8fr_auto]">
            <div className="space-y-2">
              <label htmlFor="guests" className="text-sm font-medium text-slate-200">
                Guests
              </label>
              <input
                id="guests"
                type="number"
                min={1}
                max={10}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none ring-sky-400/20 focus:border-sky-400 focus:ring"
              />
            </div>
            <button className="rounded-full bg-sky-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
              Search stays
            </button>
          </div>
        </form>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Fast booking", value: "2 min" },
            { label: "Top-reviewed hotels", value: "98%" },
            { label: "Support", value: "24/7" },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.8rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
