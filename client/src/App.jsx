import { useEffect, useState } from "react";
import { useLocation, Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import Home from "./component/pages/Home";
import Rooms from "./component/pages/Rooms";
import RoomDetail from "./component/pages/RoomDetail";
import MyBookings from "./component/pages/MyBookings";
import Login from "./component/pages/Login";
import Register from "./component/pages/Register";
import Experience from "./component/pages/Experience";
import About from "./component/pages/About";
import Footer from "./component/Footer";

function App() {
  const isOwnerPath = useLocation().pathname.includes("owner");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <div className={theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}>
      {!isOwnerPath && <Navbar theme={theme} toggleTheme={toggleTheme} />}
      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home theme={theme} />} />
          <Route path="/rooms" element={<Rooms theme={theme} />} />
          <Route path="/rooms/:id" element={<RoomDetail theme={theme} />} />
          <Route path="/my-bookings" element={<MyBookings theme={theme} />} />
          <Route path="/login" element={<Login theme={theme} />} />
          <Route path="/register" element={<Register theme={theme} />} />
          <Route path="/experience" element={<Experience theme={theme} />} />
          <Route path="/about" element={<About theme={theme} />} />
          <Route path="*" element={<Home theme={theme} />} />
        </Routes>
      </main>
      <Footer theme={theme} />
    </div>
  );
}

export default App;
