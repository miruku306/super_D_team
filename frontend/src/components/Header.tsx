import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between bg-black text-white shadow-lg">
      <nav className="ml-4 flex gap-6">
        <Link to="/home" className="hover:text-gray-300">
          Home
        </Link>
        <Link to="/menu-games" className="hover:text-gray-300">
          Menu & Games
        </Link>
        <Link to="/access-contact" className="hover:text-gray-300">
          Access & Contact
        </Link>
      </nav>
      <Link to="/reservation" className="mr-4 hover:text-gray-300">
        Reservation
      </Link>
    </header>
  );
}
