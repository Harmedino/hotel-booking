import { Link } from "react-router-dom";
import Hero from "../Hero";
import RoomCard from "../product";
import { assets, cities, exclusiveOffers, testimonials, roomsDummyData } from "../../assets/assets";

const Home = () => {
  const stayTypes = [
    { title: "City escapes", image: assets.roomImg1, tag: "Urban" },
    { title: "Beach retreats", image: assets.roomImg2, tag: "Relax" },
    { title: "Mountain lodges", image: assets.roomImg3, tag: "Adventure" },
    { title: "Luxury suites", image: assets.roomImg4, tag: "Premium" },
  ];

  const features = [
    { label: "Easy booking", value: "2 min", accent: "text-sky-400" },
    { label: "Hotels rated 4.8+", value: "95%", accent: "text-emerald-400" },
    { label: "24/7 support", value: "Always", accent: "text-amber-400" },
  ];

  const benefits = [
    {
      title: "Personalized hotel matches",
      description: "Get tailored stay suggestions based on your destination and travel style.",
      icon: assets.totalBookingIcon,
    },
    {
      title: "Flexible reservation options",
      description: "Choose instant confirmation, refundable rates, or special packages.",
      icon: assets.totalRevenueIcon,
    },
    {
      title: "Trusted local experiences",
      description: "Discover activities and hotel perks selected by local experts.",
      icon: assets.uploadArea,
    },
  ];

  const steps = [
    { step: "01", title: "Search your city", description: "Start with the destination and travel dates." },
    { step: "02", title: "Select a room", description: "Compare designs, amenities, and guest reviews." },
    { step: "03", title: "Book with confidence", description: "Confirm securely and get instant booking details." },
  ];

  return (
    <div className="bg-slate-950 text-white">
      <Hero />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-16 md:px-12 lg:px-20 xl:px-28">
        <div className="mx-auto grid max-w-7xl gap-16">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-sky-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">
                Modern hotel journeys
              </span>
              <h2 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                A cleaner travel experience with luxury, speed, and thoughtful design.
              </h2>
              <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                QuickStay brings a sleek new booking flow with premium stays, curated trips, and fewer distractions so you can focus on the perfect getaway.
              </p>
            </div>
            <div className="rounded-[2rem] bg-slate-900/90 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="grid gap-4">
                {features.map((feature) => (
                  <div key={feature.label} className="flex items-center justify-between gap-4 rounded-3xl bg-white/5 px-5 py-4 text-sm text-slate-200 transition hover:bg-white/10">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{feature.label}</p>
                      <p className={`mt-2 text-2xl font-semibold ${feature.accent}`}>{feature.value}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-100">✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr] xl:items-center">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900/70 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-sky-500/20 to-transparent" />
              <div className="relative space-y-6">
                <span className="inline-flex rounded-full bg-sky-500/15 px-4 py-2 text-xs uppercase tracking-[0.28em] text-sky-200 shadow-sm">
                  Destination spotlight</span>
                <h3 className="text-3xl font-semibold sm:text-4xl">Escape to a destination built for design lovers.</h3>
                <p className="max-w-2xl text-base leading-8 text-slate-300">
                  Browse handpicked hotels with modern interiors, rooftop pools, and polished service — all ready for your next city break.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-950/70 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Ideal for</p>
                    <p className="mt-3 text-lg font-semibold text-white">Business trips</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/70 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Style</p>
                    <p className="mt-3 text-lg font-semibold text-white">Minimal luxury</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/70 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Guests love</p>
                    <p className="mt-3 text-lg font-semibold text-white">City views</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="overflow-hidden rounded-[2rem] bg-cover bg-center"
                style={{ backgroundImage: `url(${assets.roomImg1})` }}>
                <div className="h-full min-h-[260px] bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-8 flex flex-col justify-end">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Urban escape</p>
                  <h4 className="mt-3 text-2xl font-semibold text-white">Downtown design hotels</h4>
                </div>
              </div>
              <div className="overflow-hidden rounded-[2rem] bg-cover bg-center"
                style={{ backgroundImage: `url(${assets.roomImg2})` }}>
                <div className="h-full min-h-[260px] bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-8 flex flex-col justify-end">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Beach retreat</p>
                  <h4 className="mt-3 text-2xl font-semibold text-white">Ocean-view escapes</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2.5rem] bg-slate-900/90 px-8 py-12 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Live better stays</p>
                <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">Your modern hotel experience starts here.</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {benefits.map((item) => (
                  <div key={item.title} className="rounded-3xl bg-slate-950/80 p-5">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-800 text-sky-300">
                      <img src={item.icon} alt={item.title} className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[2.5rem] bg-white/5 p-10 text-slate-100 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.35em] text-sky-300">How it works</p>
                <h2 className="text-4xl font-semibold sm:text-5xl">A slick booking flow that feels modern.</h2>
                <p className="max-w-2xl text-base leading-8 text-slate-300">
                  We pared back the experience to the essentials — search, compare, and book with confidence.
                </p>
              </div>
              <div className="mt-10 grid gap-4">
                {steps.map((step) => (
                  <div key={step.step} className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 transition hover:bg-slate-900">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-400 text-sm font-semibold text-slate-950">
                        {step.step}
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {stayTypes.map((stay, index) => (
                <div key={stay.title} className="group overflow-hidden rounded-[2rem] bg-slate-900/80 transition hover:-translate-y-1">
                  <div className="relative h-52 bg-cover bg-center" style={{ backgroundImage: `url(${stay.image})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-5">
                      <p className="text-xs uppercase tracking-[0.25em] text-sky-300">{stay.tag}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">{stay.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {roomsDummyData.slice(0, 3).map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>

          <div className="rounded-[2.5rem] bg-slate-900/80 px-8 py-12 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Guest stories</p>
                <h2 className="text-4xl font-semibold sm:text-5xl">What travelers love about modern stays.</h2>
              </div>
              <div className="grid gap-4">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="rounded-[2rem] bg-slate-950/80 p-6 text-slate-200 transition hover:bg-slate-900">
                    <p className="text-sm leading-7 text-slate-300">“{testimonial.review}”</p>
                    <div className="mt-5 flex items-center gap-3">
                      <img src={testimonial.image} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-white">{testimonial.name}</p>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{testimonial.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-gradient-to-r from-sky-500/20 via-slate-900/70 to-slate-900/70 px-8 py-14 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Ready to start</p>
                <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Search curated rooms that match your style.</h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                  Join thousands of travelers who are booking modern hotel stays with a clean, friction-free experience.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="rounded-3xl border border-white/10 bg-slate-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-300 focus:ring focus:ring-sky-300/20"
                />
                <button className="rounded-3xl bg-sky-400 px-7 py-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
