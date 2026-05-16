import { Link, useNavigate } from "react-router-dom";
import { userBookingsDummyData } from "../../assets/assets";

const MyBookings = () => {
  const navigate = useNavigate();
  const isSignedIn = localStorage.getItem("isLoggedIn") === "true";
  const userEmail = localStorage.getItem("loggedInUserEmail") || "";
  const userName = userEmail.split("@")[0] || "Guest";

  const handleSignOut = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedInUserEmail");
    navigate("/login");
  };

  if (!isSignedIn) {
    return (
      <div className="pt-28 px-6 md:px-16 lg:px-24 xl:px-32 min-h-[70vh] bg-slate-50">
        <div className="max-w-3xl mx-auto rounded-3xl bg-white p-10 shadow-md text-center">
          <h2 className="text-3xl font-semibold text-slate-900 mb-4">Sign in to view your bookings</h2>
          <p className="text-slate-500 mb-6">You need to be logged in to see your reservation history and booking details.</p>
          <Link
            to="/login"
            className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 px-6 md:px-16 lg:px-24 xl:px-32 min-h-[70vh] bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Welcome back, {userName}</h1>
              <p className="text-sm text-slate-500">Here are your recent bookings.</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700"
            >
              Sign out
            </button>
          </div>
        </div>

        {userBookingsDummyData.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 shadow-md text-center text-slate-500">
            You have no bookings yet. Browse rooms to reserve your next stay.
          </div>
        ) : (
          <div className="space-y-6">
            {userBookingsDummyData.map((booking) => (
              <div key={booking._id} className="rounded-3xl bg-white p-6 shadow-md">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{booking.hotel.name}</h2>
                    <p className="text-sm text-slate-500">{booking.room.roomType} · {booking.hotel.city}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{booking.status}</span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Check in</p>
                    <p className="font-medium text-slate-900">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Check out</p>
                    <p className="font-medium text-slate-900">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Guests</p>
                    <p className="font-medium text-slate-900">{booking.guests}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Total paid</p>
                    <p className="font-medium text-slate-900">${booking.totalPrice}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
