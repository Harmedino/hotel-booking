import { useLocation, Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import Home from "./component/pages/Home";
import Rooms from "./component/pages/Rooms";
import RoomDetail from "./component/pages/RoomDetail";
import MyBookings from "./component/pages/MyBookings";
import Footer from "./component/Footer";

function App() {
  const isOwnerPath = useLocation().pathname.includes("owner");

  return (
    <>
      {!isOwnerPath && <Navbar />}
      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
