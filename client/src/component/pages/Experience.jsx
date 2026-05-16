import { assets } from "../../assets/assets";

const Experience = ({ theme }) => {
  const isDark = theme === "dark";

  const experiences = [
    {
      title: "Luxury Stays",
      description: "Indulge in world-class accommodations with premium amenities and breathtaking views.",
      image: assets.regImage,
      features: ["5-star hotels", "Spa services", "Fine dining", "Concierge support"]
    },
    {
      title: "Adventure Travel",
      description: "Explore new destinations with guided tours and exciting outdoor activities.",
      image: assets.regImage,
      features: ["Guided tours", "Adventure sports", "Local experiences", "Expert guides"]
    },
    {
      title: "Business Travel",
      description: "Seamless business travel solutions with meeting facilities and high-speed connectivity.",
      image: assets.regImage,
      features: ["Meeting rooms", "High-speed WiFi", "Business center", "Airport transfers"]
    },
    {
      title: "Family Getaways",
      description: "Create unforgettable memories with family-friendly resorts and kid-centric activities.",
      image: assets.regImage,
      features: ["Family suites", "Kids club", "Swimming pools", "Entertainment"]
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Hero Section */}
      <div className={`relative overflow-hidden py-20 ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-blue-500/10" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center">
          <h1 className="text-4xl font-bold mb-6 sm:text-5xl lg:text-6xl">
            Unforgettable Experiences
          </h1>
          <p className={`max-w-2xl mx-auto text-lg leading-8 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Discover extraordinary stays and adventures that go beyond ordinary travel.
          </p>
        </div>
      </div>

      {/* Experiences Grid */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {experiences.map((exp, index) => (
            <div
              key={index}
              className={`group overflow-hidden rounded-2xl border shadow-lg transition hover:shadow-xl ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-3">{exp.title}</h3>
                <p className={`mb-4 leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {exp.description}
                </p>
                <ul className="space-y-2">
                  {exp.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-sky-500" />
                      <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className={`py-16 ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 sm:text-4xl">
            Ready for Your Next Adventure?
          </h2>
          <p className={`mb-8 max-w-2xl mx-auto text-lg ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Start planning your perfect stay today and create memories that last a lifetime.
          </p>
          <button className="rounded-full bg-sky-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-sky-400">
            Explore Hotels
          </button>
        </div>
      </div>
    </div>
  );
};

export default Experience;