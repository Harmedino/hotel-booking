import { Link, useParams } from "react-router-dom";
import { assets, roomCommonData, roomsDummyData } from "../../assets/assets";

const RoomDetail = () => {
  const { id } = useParams();
  const room = roomsDummyData.find((item) => item._id === id);

  if (!room) {
    return (
      <div className="pt-28 px-6 md:px-16 lg:px-24 xl:px-32 min-h-[70vh] bg-slate-50">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white p-10 shadow-md text-center">
          <h2 className="text-3xl font-semibold text-slate-900 mb-4">Room not found</h2>
          <p className="text-slate-500 mb-6">The room you are looking for does not exist or may have been removed.</p>
          <Link to="/rooms" className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700">
            Browse Rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 px-6 md:px-16 lg:px-24 xl:px-32 min-h-[70vh] bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{room.hotel.city}</p>
            <h1 className="text-4xl font-semibold text-slate-900">{room.roomType} at {room.hotel.name}</h1>
            <p className="mt-2 text-sm text-slate-600">{room.hotel.address}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Price per night</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">${room.pricePerNight}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {room.images.slice(0, 4).map((image, index) => (
                <img key={index} src={image} alt={`${room.roomType} ${index + 1}`} className="h-64 w-full rounded-3xl object-cover shadow-sm" />
              ))}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Room amenities</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {room.amenities.map((name) => (
                  <div key={name} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <img src={assets[`${name.replace(/\s/g, "")}Icon`] || assets.roomServiceIcon} alt={name} className="h-6 w-6" />
                    <p className="text-sm text-slate-700">{name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Booking summary</h2>
              <p className="text-sm text-slate-500">Room type: <span className="font-medium text-slate-900">{room.roomType}</span></p>
              <p className="mt-2 text-sm text-slate-500">Hotel: <span className="font-medium text-slate-900">{room.hotel.name}</span></p>
              <p className="mt-2 text-sm text-slate-500">Available: <span className="font-medium text-slate-900">{room.isAvailable ? "Yes" : "No"}</span></p>
              <button className="mt-6 w-full rounded-3xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-700">
                Reserve now
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Why guests love it</h2>
              <div className="space-y-4">
                {roomCommonData.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <img src={item.icon} alt={item.title} className="h-6 w-6" />
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
