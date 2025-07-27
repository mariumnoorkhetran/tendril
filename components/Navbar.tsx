import Link from "next/link";

export default function Navbar() {
  return (
    <section className="m-8 max-w-5xl">

        <nav className="w-full flex items-center justify-between p-4 bg-[#f9e4bc] text-gray rounded-md">    
            <Link href="/" className="flex items-center gap-2 hover:text-[#af5f5f] hover:scale-105 transition-all duration-200 cursor-pointer">
                <span>🏠</span>
                <span>Home</span>
            </Link>

            <Link href="/tasks" className="flex items-center gap-2 hover:text-[#af5f5f] hover:scale-105 transition-all duration-200 cursor-pointer">
                <span>✏️</span>
                <span>Tasks</span>
            </Link>

            <Link href="/calendar" className="flex items-center gap-2 hover:text-[#af5f5f] hover:scale-105 transition-all duration-200 cursor-pointer">
                <span>📅</span>
                <span>Calendar</span>
            </Link>

            <Link href="/forum" className="flex items-center gap-2 hover:text-[#af5f5f] hover:scale-105 transition-all duration-200 cursor-pointer">
                <span>👥</span>
                <span>Forum</span>
            </Link>
        </nav>
    </section>
  );
}
