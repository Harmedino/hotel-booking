import { Link } from "react-router-dom";

const RoomCard = ({ room, theme }) => {
  const isDark = theme === "dark";
  return (
    <Link to={`/rooms/${room._id}`} className={`group block overflow-hidden rounded-[2rem] shadow-lg transition hover:-translate-y-1 hover:shadow-2xl ${isDark ? "bg-slate-900" : "bg-white"}`}>
      <div className="relative h-72 overflow-hidden">
        <img src={room.images[0]} alt={room.roomType} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-5 py-4 text-white">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-200">{room.hotel.city}</p>
          <h3 className="mt-2 text-2xl font-semibold">{room.roomType}</h3>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Hotel</p>
            <p className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{room.hotel.name}</p>
          </div>
          <p className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>${room.pricePerNight}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {room.amenities.slice(0, 2).map((amenity) => (
            <span key={amenity} className={`rounded-2xl px-3 py-2 text-sm ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
              {amenity}
            </span>
          ))}
        </div>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{room.hotel.address}</p>
      </div>
    </Link>
  );
};

export default RoomCard;
