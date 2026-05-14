import { assets } from "./../assets/assets";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-6xl space-y-12 px-6 md:px-16 lg:px-24 xl:px-32">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={assets.logo} alt="QuickStay logo" className="h-10" />
              <div>
                <p className="text-lg font-semibold text-slate-900">QuickStay</p>
                <p className="text-sm text-slate-500">Travel, book, and relax with confidence.</p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-600">
              QuickStay helps travelers book the best hotel stays worldwide with fast search, curated offers, and trusted guest support.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900">Company</p>
            <div className="space-y-2 text-sm text-slate-600">
              <a href="#" className="block transition hover:text-slate-900">About Us</a>
              <a href="#" className="block transition hover:text-slate-900">Careers</a>
              <a href="#" className="block transition hover:text-slate-900">Press Center</a>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900">Discover</p>
            <div className="space-y-2 text-sm text-slate-600">
              <a href="/rooms" className="block transition hover:text-slate-900">Hotels</a>
              <a href="#" className="block transition hover:text-slate-900">Special Offers</a>
              <a href="#" className="block transition hover:text-slate-900">Travel Guides</a>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900">Support</p>
            <div className="space-y-2 text-sm text-slate-600">
              <a href="#" className="block transition hover:text-slate-900">Help Center</a>
              <a href="#" className="block transition hover:text-slate-900">Contact Us</a>
              <a href="#" className="block transition hover:text-slate-900">Privacy & Terms</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-slate-200 pt-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} QuickStay. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="transition hover:text-slate-900">Twitter</a>
            <a href="#" className="transition hover:text-slate-900">Instagram</a>
            <a href="#" className="transition hover:text-slate-900">Facebook</a>
            <a href="#" className="transition hover:text-slate-900">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
