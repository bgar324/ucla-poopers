// import { Toilet } from "lucide-react";  

interface SignUpFormProps {
  onToggle: () => void;
}

export default function SignUpForm({ onToggle }: SignUpFormProps) {
  return (
    <div className="w-full bg-rose-100 rounded-xl shadow-lg p-8">
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-gasoek text-amber-900">
            SIGN UP TO START POOPING NOW! 
          </h1>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Email</label>
          <input
            type="email"
            placeholder="joebruin@ucla.edu"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Username</label>
          <input
            type="text"
            placeholder="pooperking123"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Password</label>
          <input
            type="password"
            placeholder="Minimum 8 characters"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="Re-enter your password"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
          />
        </div>

        {/* Submit */}
        <button className="cursor-pointer w-full py-2 bg-amber-900 text-white rounded-xl shadow-md hover:bg-amber-800 hover:-translate-y-0.5 transition duration-200">
          SIGN UP
        </button>

        {/* Switch to Login */}
        <button
          onClick={onToggle}
          className="cursor-pointer text-sm text-gray-500 hover:text-amber-900 transition"
        >
          Already have an account? <span className="underline">Login</span>
        </button>
      </div>
    </div>
  );
}
