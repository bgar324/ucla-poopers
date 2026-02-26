// interface SignUpFormProps {
//   onToggle: () => void;
// }

// export default function SignUpForm({ onToggle }: SignUpFormProps) {
//   return (
//     <main className="flex flex-col items-center justify-center min-h-screen">
//       <header className="mt-8 font-gasoek text-center text-3xl px-4 py-2 w-sm bg-rose-100 rounded-xl  text-amber-900 shadow-lg">
//         PARTY POOPERS
//       </header>

//       <div className="flex flex-col items-center mt-8 mb-8 px-8 py-8 w-sm bg-rose-100 rounded-xl shadow-lg">
//         <h1 className="font-gasoek text-2xl text-amber-900 text-center">
//           SIGN UP TO START POOPING NOW!
//         </h1>
//         <input
//           type="email"
//           placeholder="Email"
//           className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
//         />
//         <input
//           type="username"
//           placeholder="Username"
//           className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
//         />
//         <input
//           type="password"
//           placeholder="Create Password"
//           className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
//         />
//         <input
//           type="password"
//           placeholder="Confirm Password"
//           className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
//         />
//         <button
//         className="cursor-pointer font-rubik mt-4 px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition">
//           SIGN UP
//         </button>

//          <button
//         onClick={onToggle}
//         className="cursor-pointer font-rubik mt-4 text-xs text-gray-400 hover:text-gray-300 hover:-translate-y-0.5 transition">
//           ALREADY HAVE AN ACCOUNT? LOGIN HERE
//         </button>
//       </div>
//     </main>
//   );
// }

interface SignUpFormProps {
  onToggle: () => void;
}

export default function SignUpForm({ onToggle }: SignUpFormProps) {
  return (
    <div className="w-full bg-rose-100 rounded-xl shadow-lg p-8">
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-gasoek text-amber-900">
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
        <button className="w-full py-2 bg-amber-900 text-white rounded-xl shadow-md hover:bg-amber-800 hover:-translate-y-0.5 transition duration-200">
          SIGN UP
        </button>

        {/* Switch to Login */}
        <button
          onClick={onToggle}
          className="text-sm text-gray-500 hover:text-amber-900 transition"
        >
          Already have an account? <span className="underline">Login</span>
        </button>
      </div>
    </div>
  );
}
