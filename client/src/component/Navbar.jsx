import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

const Navbar = ({ theme, toggleTheme }) => {
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Hotels", path: "/rooms" },
    { name: "Experience", path: "/experience" },
    { name: "About", path: "/about" },
  ];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDark = theme === "dark";

  return (
    <nav
      className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 z-50 ${
        isScrolled
          ? isDark
            ? "bg-slate-950/95 shadow-xl text-white backdrop-blur-lg py-3 md:py-4"
            : "bg-white/90 shadow-xl text-slate-900 backdrop-blur-lg py-3 md:py-4"
          : isDark
          ? "bg-slate-950/90 text-white py-4 md:py-6"
          : "bg-white/95 text-slate-900 py-4 md:py-6"
      }`}
    >
      <Link to="/" className="flex items-center gap-3">
        <img src={assets.logo} alt="logo" className="h-9" />
        <span className="font-semibold text-white">QuickStay</span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link, i) => (
          <Link
            key={i}
            to={link.path}
            className={`group flex flex-col gap-0.5 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {link.name}
            <div className="bg-sky-400 h-0.5 w-0 group-hover:w-full transition-all duration-300" />
          </Link>
        ))}
        <Link
          to="/rooms"
          className={`border px-4 py-1 text-sm font-light rounded-full transition-all ${isDark ? "border-white bg-white text-slate-950 hover:bg-slate-100" : "border-black bg-black text-white hover:bg-slate-800"}`}
        >
          Browse
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-slate-600 bg-slate-900 text-white hover:bg-slate-800" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"}`}
        >
          {isDark ? "Light" : "Dark"} Mode
        </button>
        <img src={assets.searchIcon} alt="search" className="h-7 transition-all duration-500" />

        <Link
          to="/login"
          className="px-8 py-2.5 rounded-full ml-4 bg-sky-500 text-white transition-all duration-500 hover:bg-sky-400"
        >
          Login
        </Link>
      </div>

      <div className="flex items-center gap-3 md:hidden">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center ${isScrolled ? "bg-white text-slate-900" : "bg-slate-900 text-white"}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      </div>

      <div
        className={`fixed top-0 left-0 w-full h-screen bg-slate-950 text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-white transition-all duration-500 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {navLinks.map((link, i) => (
          <Link key={i} to={link.path} onClick={() => setIsMenuOpen(false)}>
            {link.name}
          </Link>
        ))}

        <button
          onClick={() => {
            toggleTheme();
            setIsMenuOpen(false);
          }}
          className="rounded-full border border-white px-5 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800"
        >
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>

        <Link to="/rooms" onClick={() => setIsMenuOpen(false)} className="rounded-full border border-white px-5 py-2 text-sm bg-white text-black">
          Browse Rooms
        </Link>

        <Link to="/login" onClick={() => setIsMenuOpen(false)} className="rounded-full bg-sky-500 px-8 py-2.5 text-white transition hover:bg-sky-400">
          Login
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;
