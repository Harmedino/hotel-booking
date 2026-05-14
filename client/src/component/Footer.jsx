import { assets } from "./../assets/assets";

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-12 md:px-16 lg:px-24 xl:px-32">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="rounded-[2rem] bg-slate-900/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-3">
              <img src={assets.logo} alt="QuickStay logo" className="h-10" />
              <div>
                <p className="text-xl font-semibold text-white">QuickStay</p>
                <p className="text-sm text-slate-400">Your hotel booking concierge for the perfect getaway.</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
              Discover top hotels, book fast, and get personalized offers for every trip. QuickStay makes travel planning easy with curated stays in major destinations worldwide.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-800/90 p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Need help?</p>
                <p className="mt-2 text-sm text-slate-300">Our support team is available 24/7 to assist your booking.</p>
              </div>
              <div className="rounded-3xl bg-slate-800/90 p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Contact</p>
                <p className="mt-2 text-sm text-slate-300">support@quickstay.com</p>
                <p className="mt-1 text-sm text-slate-500">+1 (800) 123-4567</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Company</p>
              <div className="space-y-3 text-sm text-slate-400">
                <a href="#" className="block transition hover:text-white">About us</a>
                <a href="#" className="block transition hover:text-white">Careers</a>
                <a href="#" className="block transition hover:text-white">Press</a>
                <a href="#" className="block transition hover:text-white">Affiliates</a>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Discover</p>
              <div className="space-y-3 text-sm text-slate-400">
                <a href="/rooms" className="block transition hover:text-white">Hotels</a>
                <a href="#" className="block transition hover:text-white">Special offers</a>
                <a href="#" className="block transition hover:text-white">Destinations</a>
                <a href="#" className="block transition hover:text-white">Gift cards</a>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-900/80 p-8 md:flex md:items-center md:justify-between md:gap-8">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">Stay in the loop</p>
            <p className="text-sm text-slate-400">Subscribe for travel deals, new stays, and exclusive offers.</p>
          </div>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-0">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-[240px] rounded-full border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
            />
            <button className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
              Subscribe
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6 border-t border-slate-800 pt-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
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
