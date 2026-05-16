import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = ({ theme }) => {
  const isDark = theme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loggedInUserEmail", email);
    console.log("Login successful:", { email });
    navigate("/my-bookings");
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className={`w-full max-w-md rounded-2xl border p-8 shadow-xl ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Sign in to your QuickStay account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring focus:ring-sky-200 ${isDark ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-slate-300 text-sky-500 focus:ring-sky-200" />
              <span className={`ml-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-sky-500 hover:text-sky-400">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Don't have an account?{" "}
            <Link to="/register" className="text-sky-500 hover:text-sky-400 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;