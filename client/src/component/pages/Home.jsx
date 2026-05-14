import { Link } from "react-router-dom";
import Hero from "../Hero";
import RoomCard from "../product";
import { assets, exclusiveOffers, testimonials, roomsDummyData } from "../../assets/assets";

const Home = () => {
  return (
    <div className="bg-slate-50">
      <Hero />

      <section className="py-16 px-6 md:px-16 lg:px-24 xl:px-32">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-500">Popular stays</p>
              <h2 className="mt-3 text-4xl font-semibold text-slate-900">Stay in the world's most loved getaway spots.</h2>
              <p className="mt-4 text-sm text-slate-500 max-w-2xl">
                Find luxury hotels, last-minute deals, and unforgettable experiences curated for every traveler.
              </p>
            </div>
            <Link to="/rooms" className="inline-flex w-fit items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Explore rooms
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {roomsDummyData.slice(0, 3).map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {exclusiveOffers.map((offer) => (
              <div key={offer._id} className="rounded-3xl bg-white p-6 shadow-md">
                <img src={offer.image} alt={offer.title} className="h-52 w-full rounded-3xl object-cover" />
                <div className="mt-5 space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900">{offer.title}</h3>
                  <p className="text-sm text-slate-500">{offer.description}</p>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{offer.priceOff}% off</span>
                    <span>Ends {offer.expiryDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-md">
            <div className="grid gap-8 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={testimonial.image} alt={testimonial.name} className="h-14 w-14 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.address}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: testimonial.rating }).map((_, index) => (
                        <span key={index}>★</span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-600">"{testimonial.review}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;