interface SignUpFormProps {
  onToggle: () => void;
}

export default function SignUpForm({ onToggle }: SignUpFormProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <header className="mt-8 font-gasoek text-center text-3xl px-4 py-2 w-sm bg-rose-100 rounded-xl  text-amber-900 shadow-lg">
        PARTY POOPERS
      </header>

      <div className="flex flex-col items-center mt-8 mb-8 px-8 py-8 w-sm bg-rose-100 rounded-xl shadow-lg">
        <h1 className="font-gasoek text-2xl text-amber-900 text-center">
          SIGN UP TO START POOPING NOW!
        </h1>
        <input
          type="email"
          placeholder="Email"
          className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
        />
        <input
          type="username"
          placeholder="Username"
          className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
        />
        <input
          type="password"
          placeholder="Create Password"
          className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
        />
        <button 
        className="cursor-pointer font-rubik mt-4 px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition">
          SIGN UP
        </button>

    

         <button 
        onClick={onToggle}
        className="cursor-pointer font-rubik mt-4 text-xs text-gray-400 hover:text-gray-300 hover:-translate-y-0.5 transition">
          ALREADY HAVE AN ACCOUNT? LOGIN HERE
        </button>
      </div>
    </main>
  );
}