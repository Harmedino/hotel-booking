import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = ({ theme }) => {
  const isDark = theme === "dark";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    // TODO: Implement registration logic
    console.log("Registration attempt:", formData);
    // For now, just navigate to login
    navigate("/login");
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className={`w-full max-w-md rounded-2xl border p-8 shadow-xl ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Join QuickStay for the best hotel experiences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
                placeholder="John"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
              placeholder="Create a strong password"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              className="rounded border-slate-300 text-sky-500 focus:ring-sky-200"
              required
            />
            <label htmlFor="terms" className={`ml-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              I agree to the{" "}
              <Link to="/terms" className="text-sky-500 hover:text-sky-400">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-sky-500 hover:text-sky-400">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Create Account
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Already have an account?{" "}
            <Link to="/login" className="text-sky-500 hover:text-sky-400 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;