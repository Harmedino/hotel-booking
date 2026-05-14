import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets, cities } from "../assets/assets";

const Hero = () => {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <div className="h-screen flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white bg-[url('/src/assets/heroImage.png')] bg-no-repeat bg-cover bg-center">
      <p className="bg-[#49B9FF]/50 px-3.5 py-1 rounded-full mt-20">The Ultimate Hotel Experience</p>

      <h1 className="font-playfair text-2xl md:text-[56px] md:leading-[56px] font-bold md:font-extrabold max-w-2xl mt-3">
        Discover Your Perfect Gateway Destination
      </h1>

      <p className="max-w-xl mt-2 text-sm md:text-base">
        Unparalleled luxury and comfort await at the world's most exclusive hotels and resorts. Start your journey today.
      </p>

      <form onSubmit={handleSubmit} className="bg-white text-gray-500 rounded-lg px-6 py-4 mt-8 flex flex-col md:flex-row max-md:items-start gap-4 max-md:mx-auto">
        <div>
          <div className="flex items-center gap-2">
            <img src={assets.calenderIcon} alt="calender" className="h-4" />
            <label htmlFor="destinationInput">Destination</label>
          </div>
          <input
            list="destinations"
            id="destinationInput"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none"
            placeholder="Type here"
          />
          <datalist id="destinations">
            {cities.map((city, index) => (
              <option value={city} key={index} />
            ))}
          </datalist>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <img src={assets.calenderIcon} alt="" className="h-4" />
            <label htmlFor="checkIn">Check in</label>
          </div>
          <input
            id="checkIn"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none"
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <img src={assets.calenderIcon} alt="" className="h-4" />
            <label htmlFor="checkOut">Check out</label>
          </div>
          <input
            id="checkOut"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none"
          />
        </div>

        <div className="flex md:flex-col max-md:gap-2 max-md:items-center">
          <label htmlFor="guests">Guests</label>
          <input
            min={1}
            max={10}
            id="guests"
            type="number"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none max-w-16"
            placeholder="1"
          />
        </div>

        <button className="flex items-center justify-center gap-1 rounded-md bg-black py-3 px-4 text-white my-auto cursor-pointer max-md:w-full max-md:py-1">
          <img src={assets.searchIcon} alt="search icon" className="h-7" />
          <span>Search</span>
        </button>
      </form>
    </div>
  );
};

export default Hero;
