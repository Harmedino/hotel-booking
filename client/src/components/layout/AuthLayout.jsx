import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { assets } from '../../assets/assets';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <motion.img src={assets.regImage} alt="" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.6 }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-slate-950/30" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}</div>
          <p className="mt-4 max-w-md font-display text-3xl leading-snug">“Booked a suite in Dubai in under two minutes. The whole thing just works.”</p>
          <p className="mt-4 text-sm text-white/70">Liam J. · Frequent traveller</p>
        </div>
      </div>
      <div className="flex flex-col px-4 pb-28 pt-24 sm:px-8 md:pb-12 lg:pt-12">
        <Link to="/" className="mb-10 hidden lg:block"><img src={assets.logo} alt="QuickStay" className="h-8 brightness-0 dark:brightness-100" /></Link>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto my-auto w-full max-w-md">
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
