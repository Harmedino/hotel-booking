import { assets } from "./../assets/assets";

const Footer = ({ theme }) => {
  const isDark = theme === "dark";
  return (
    <footer className={isDark ? "bg-slate-950 text-white" : "bg-slate-900 text-slate-50"}>
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-16 md:px-16 lg:px-24 xl:px-32">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr]">
          <div className={`rounded-[2rem] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.25)] ring-1 ${isDark ? "bg-slate-900/95 ring-slate-800" : "bg-slate-800/95 ring-slate-700"}`}>
            <div className="flex items-center gap-3">
              <img src={assets.logo} alt="QuickStay logo" className="h-10" />
              <div>
                <p className="text-xl font-semibold text-white">QuickStay</p>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Your hotel booking concierge for the perfect getaway.</p>
              </div>
            </div>
            <p className={`mt-6 max-w-md text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-400"}`}>
              Discover top hotels, book fast, and get personalized offers for every trip. QuickStay makes travel planning easy with curated stays in major destinations worldwide.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className={`rounded-3xl p-5 ring-1 ${isDark ? "bg-slate-800/90 ring-slate-700/80" : "bg-slate-700/90 ring-slate-600/80"}`}>
                <p className="text-sm uppercase tracking-[0.25em] text-sky-400">Need help?</p>
                <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-400"}`}>Our support team is available 24/7 to assist your booking.</p>
              </div>
              <div className={`rounded-3xl p-5 ring-1 ${isDark ? "bg-slate-800/90 ring-slate-700/80" : "bg-slate-700/90 ring-slate-600/80"}`}>
                <p className="text-sm uppercase tracking-[0.25em] text-sky-400">Contact</p>
                <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-400"}`}>support@quickstay.com</p>
                <p className={`mt-1 text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}>+1 (800) 123-4567</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-4">
              <p className={`text-sm font-semibold uppercase tracking-[0.25em] ${isDark ? "text-slate-300" : "text-slate-400"}`}>Company</p>
              <div className={`space-y-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <a href="/about" className="block transition hover:text-white">About us</a>
                <a href="#" className="block transition hover:text-white">Careers</a>
                <a href="#" className="block transition hover:text-white">Press</a>
                <a href="#" className="block transition hover:text-white">Affiliates</a>
              </div>
            </div>

            <div className="space-y-4">
              <p className={`text-sm font-semibold uppercase tracking-[0.25em] ${isDark ? "text-slate-300" : "text-slate-400"}`}>Discover</p>
              <div className={`space-y-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <a href="/rooms" className="block transition hover:text-white">Hotels</a>
                <a href="#" className="block transition hover:text-white">Special offers</a>
                <a href="#" className="block transition hover:text-white">Destinations</a>
                <a href="#" className="block transition hover:text-white">Gift cards</a>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-900/90 p-8 ring-1 ring-slate-700/80 shadow-sm md:flex md:items-center md:justify-between md:gap-8">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">Stay in the loop</p>
            <p className="text-sm text-slate-400">Subscribe for travel deals, new stays, and exclusive offers.</p>
          </div>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-0">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-[240px] rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring focus:ring-sky-200/50"
            />
            <button className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95">
              Subscribe
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6 border-t border-slate-800 pt-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} QuickStay. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-slate-400">
            <a href="#" className="transition hover:text-white">Twitter</a>
            <a href="#" className="transition hover:text-white">Instagram</a>
            <a href="#" className="transition hover:text-white">Facebook</a>
            <a href="#" className="transition hover:text-white">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
