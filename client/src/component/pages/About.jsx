import { assets } from "../assets/assets";

const About = ({ theme }) => {
  const isDark = theme === "dark";

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Partner Hotels" },
    { number: "50+", label: "Countries" },
    { number: "24/7", label: "Customer Support" }
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: assets.regImage,
      bio: "With over 15 years in hospitality, Sarah founded QuickStay to revolutionize hotel booking."
    },
    {
      name: "Michael Chen",
      role: "Head of Technology",
      image: assets.regImage,
      bio: "Michael leads our tech team, ensuring seamless booking experiences worldwide."
    },
    {
      name: "Emma Rodriguez",
      role: "Customer Experience Director",
      image: assets.regImage,
      bio: "Emma ensures every guest receives exceptional service and personalized attention."
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Hero Section */}
      <div className={`relative overflow-hidden py-20 ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-blue-500/10" />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-6 sm:text-5xl lg:text-6xl">
              About QuickStay
            </h1>
            <p className={`text-lg leading-8 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              We're on a mission to make hotel booking effortless, transparent, and enjoyable for travelers worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className={`space-y-4 text-lg leading-8 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              <p>
                Founded in 2020, QuickStay emerged from a simple idea: hotel booking should be as easy as booking a flight.
                We noticed that travelers were frustrated with complicated booking processes and hidden fees.
              </p>
              <p>
                Our team of hospitality experts and tech innovators came together to create a platform that puts
                transparency, simplicity, and customer satisfaction first.
              </p>
              <p>
                Today, we partner with over 500 hotels across 50+ countries, serving thousands of happy customers
                who trust us for their travel needs.
              </p>
            </div>
          </div>
          <div className="aspect-video overflow-hidden rounded-2xl">
            <img
              src={assets.regImage}
              alt="QuickStay team"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className={`py-16 ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-sky-500 mb-2">{stat.number}</div>
                <div className={`text-sm font-medium uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
          <p className={`max-w-2xl mx-auto text-lg ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            The passionate people behind QuickStay's success.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {team.map((member, index) => (
            <div
              key={index}
              className={`rounded-2xl border p-6 text-center shadow-lg transition hover:shadow-xl ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
            >
              <div className="aspect-square overflow-hidden rounded-xl mb-4">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-sky-500 mb-3">{member.role}</p>
              <p className={`text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className={`py-16 ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className={`max-w-2xl mx-auto text-lg ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              The principles that guide everything we do.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className={`rounded-2xl border p-6 text-center ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">Transparency</h3>
              <p className={`text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                No hidden fees, clear pricing, and honest reviews from real guests.
              </p>
            </div>
            <div className={`rounded-2xl border p-6 text-center ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Simplicity</h3>
              <p className={`text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Booking a hotel should be as easy as a few clicks, not a complicated process.
              </p>
            </div>
            <div className={`rounded-2xl border p-6 text-center ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-3">Partnership</h3>
              <p className={`text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                We work closely with hotels to ensure the best experiences for our guests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;