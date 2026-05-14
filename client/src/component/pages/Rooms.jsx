import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { assets, cities, roomsDummyData } from "../../assets/assets";
import RoomCard from "../product";

const Rooms = ({ theme }) => {
  const isDark = theme === "dark";
  const [searchParams, setSearchParams] = useSearchParams();
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "1");

  const filteredRooms = useMemo(() => {
    const normalizedDestination = destination.trim().toLowerCase();
    return roomsDummyData.filter((room) => {
      if (!normalizedDestination) return true;
      return room.hotel.city.toLowerCase().includes(normalizedDestination);
    });
  }, [destination]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    setSearchParams(params);
  };

  return (
    <div className={`min-h-[70vh] pt-28 px-6 md:px-16 lg:px-24 xl:px-32 pb-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-6xl mx-auto">
        <div className={`mb-10 rounded-3xl p-6 shadow-md ${isDark ? "bg-slate-900" : "bg-white"}`}>
          <h1 className={`text-3xl font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Find your ideal stay</h1>
          <p className={`text-sm max-w-xl ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Search available hotel rooms across the world's best destinations and book the perfect stay.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 lg:grid-cols-[1.8fr_1fr_1fr_1fr_auto]">
            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Destination</label>
              <div className={`mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                <img src={assets.locationIcon} alt="Destination" className="h-4" />
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  list="destinations"
                  className={`w-full bg-transparent outline-none text-sm ${isDark ? "text-white" : "text-slate-900"}`}
                  placeholder="City, hotel or landmark"
                />
              </div>
              <datalist id="destinations">
                {cities.map((city) => (
                  <option value={city} key={city} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Check in</label>
              <input
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                type="date"
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-200 bg-slate-50"}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Check out</label>
              <input
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                type="date"
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-200 bg-slate-50"}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Guests</label>
              <input
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                min={1}
                max={10}
                type="number"
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-200 bg-slate-50"}`}
              />
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Available Rooms</h2>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Showing {filteredRooms.length} stay{filteredRooms.length === 1 ? "" : "s"} near your chosen destination.</p>
          </div>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Tip: Try New York, Dubai or London for the best offers.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard key={room._id} room={room} theme={theme} />
          ))}
          {filteredRooms.length === 0 && (
            <div className={`rounded-3xl border border-dashed p-8 text-center ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-300 bg-white text-slate-500"}`}>
              No rooms found for that destination. Try a broader search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rooms;
