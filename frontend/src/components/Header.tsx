import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between bg-black text-white shadow-lg">
      <h1 className="ml-4 text-xl font-semibold">
        <Link to="/">Hello World</Link>
      </h1>
      <nav className="flex gap-6 mr-4">
        <Link to="/home" className="hover:text-gray-300">
          Home
        </Link>
        <Link to="/menu-games" className="hover:text-gray-300">
          Menu & Games
        </Link>
        <Link to="/access-contact" className="hover:text-gray-300">
          Access & Contact
        </Link>
        <Link to="/reservation" className="hover:text-gray-300">
          Reservation
        </Link>
      </nav>
    </header>
  );
}
