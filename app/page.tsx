export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <header className="font-gasoek text-3xl px-4 py-2 w-100 bg-rose-100 rounded-xl  text-amber-900 shadow-lg">
        <h1 className="text-center">PARTY POOPERS</h1>
      </header>

      <div className="flex flex-col items-center mt-8 px-8 py-8 h-105 w-100 bg-rose-100 rounded-xl shadow-lg">
        <h1 className="font-gasoek text-2xl text-amber-900 text-center">
          {" "}
          LOGIN TO START POOPING NOW!{" "}
        </h1>
        <input
          type="email"
          placeholder="Email"
          className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          className="mt-8 font-rubik text-grey bg-white rounded-xl w-full px-4 py-2"
        />
        <button className="cursor-pointer font-rubik mt-4 px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition duration-200 ">
          LOGIN
        </button>
        <div className="flex items-center gap-4 mt-4">
          <hr className="flex-1 h-px bg-gray-300 border-0" />
          <span className="font-rubik text-gray-400 text-sm">-------- OR --------</span>
          <hr className="flex-1 h-px bg-gray-300 border-0" />
        </div>
        <button className="cursor-pointer font-rubik mt-4 px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition">
          SIGN UP NOW
        </button>
      </div>
    </main>
  );
}
