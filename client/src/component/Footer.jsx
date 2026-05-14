import { assets } from "./../assets/assets";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:px-16 lg:px-24 xl:px-32 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={assets.logo} alt="Logo" className="h-10" />
          <div>
            <p className="text-lg font-semibold text-slate-900">QuickStay</p>
            <p className="text-sm text-slate-500">Travel, book, and relax with confidence.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <a href="#" className="transition hover:text-slate-900">Privacy</a>
          <a href="#" className="transition hover:text-slate-900">Terms</a>
          <a href="#" className="transition hover:text-slate-900">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
