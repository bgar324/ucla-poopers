"use client"

interface LoginFormProps {
  onToggle: () => void; 
}

export default function LoginForm({ onToggle }: LoginFormProps) {
  return (
    <div className="flex flex-col items-center px-8 py-8 w-full bg-rose-100 rounded-xl shadow-lg">
      <h1 className="font-gasoek text-2xl text-amber-900 text-center">
        LOGIN TO START POOPING NOW!
      </h1>

      <div className = "w-full mt-6">
        <label className="block text-sm text-gray-500 mb-1">Email</label>
        <input
          type="email"
          placeholder="joebruin@ucla.edu"
          className="font-rubik bg-white rounded-xl w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-900"
        />
      </div>

      <div className = "w-full mt-6">
        <label className = "block text-sm text-gray-500 mb-1">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          className="font-rubik bg-white rounded-xl w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-900"
        />
      </div>

      <div className = "items-center text-center justify-center h-min mt-4 w-full">
        <button className="w-full cursor-pointer font-rubik mt-4 px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition duration-200 ">
          LOGIN
        </button>

        <div className="flex items-center w-full gap-3 mt-4">
          <hr className="flex-1 border-t border-gray-400" />
          <span className="font-rubik text-gray-400 text-sm whitespace-nowrap">
            OR
          </span>
          <hr className="flex-1 border-t border-gray-400" />
        </div>

        <button
          onClick={onToggle}
          className="w-full cursor-pointer font-rubik mt-4 px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition"
        >
          SIGN UP
        </button>
      </div>
    </div>
  );
}
