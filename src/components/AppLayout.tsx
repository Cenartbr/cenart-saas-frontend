"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiHome, FiBriefcase, FiUsers, FiDollarSign, FiFileText, FiLogOut } from "react-icons/fi"; // Ícones adicionados

interface UserData {
    id: number;
    nome: string;
    email: string;
    papel: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem("authToken");
        const storedUserData = localStorage.getItem("userData");
        if (!token || !storedUserData) {
            router.push("/login");
        } else {
            try {
                setUserData(JSON.parse(storedUserData));
            } catch (error) {
                console.error("Failed to parse user data:", error);
                localStorage.removeItem("authToken");
                localStorage.removeItem("userData");
                router.push("/login");
            }
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        router.push("/login");
    };

    if (!isMounted || !userData) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Carregando...</div>;
    }

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: FiHome },
        { href: "/projects", label: "Projetos", icon: FiBriefcase },
        { href: "/clients", label: "Clientes", icon: FiUsers },
        { href: "/finance", label: "Financeiro", icon: FiDollarSign },
        { href: "/budgets", label: "Orçamentos", icon: FiFileText },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
            <aside className="w-64 bg-gray-800 p-5 space-y-6 flex flex-col shadow-lg">
                <div className="text-center mb-5">
                    <Link href="/dashboard">
                        <span className="text-3xl font-bold text-orange-500 hover:text-orange-400 transition-colors">CENART</span>
                    </Link>
                </div>
                <nav className="flex-grow space-y-2">
                    {navItems.map(item => (
                        <Link 
                            key={item.href} 
                            href={item.href} 
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-orange-600 hover:text-white transition-all duration-200 group ${router.pathname === item.href ? "bg-orange-600 text-white" : ""}`}
                        >
                            <item.icon className="text-xl group-hover:scale-110 transition-transform" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto pt-6 border-t border-gray-700">
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-200">{userData.nome}</p>
                        <p className="text-xs text-gray-400">{userData.papel}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-red-600 hover:bg-red-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 group"
                    >
                        <FiLogOut className="text-lg group-hover:scale-110 transition-transform" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-6 md:p-10 overflow-auto bg-gray-950">
                {children}
            </main>
        </div>
    );
}

