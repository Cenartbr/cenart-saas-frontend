"use client";
import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { FiLogIn, FiUser, FiLock } from "react-icons/fi";
import Link from "next/link";

// Interface para a resposta do login (espera-se um token)
interface LoginResponse {
    access_token: string;
    user?: { // Opcional, dependendo do que a API de login retorna
        id: number;
        nome: string;
        email: string;
        papel: string;
    };
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("admin@cenart.br"); // Default para teste
    const [password, setPassword] = useState("cenart123"); // Default para teste
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await apiClient<LoginResponse>("/api/auth/login", {
                method: "POST",
                body: { email, senha: password }, // "senha" conforme definido no backend
            });

            if (response.access_token) {
                // Armazenar o token (ex: localStorage, cookie seguro, ou estado global/contexto)
                // Por simplicidade, vamos usar localStorage para este exemplo.
                // Em uma aplicação real, considere a segurança (HttpOnly cookies são melhores).
                localStorage.setItem("cenart_auth_token", response.access_token);
                localStorage.setItem("cenart_user_email", email); // Guardar email para exibição, por exemplo
                
                // Redirecionar para o dashboard ou página inicial após login
                router.push("/dashboard");
            } else {
                setError("Token de acesso não recebido.");
            }
        } catch (err: any) {
            console.error("Login failed:", err);
            if (err.status === 401) {
                setError("Credenciais inválidas. Verifique seu email e senha.");
            } else {
                setError(err.data?.message || err.message || "Falha ao tentar fazer login. Tente novamente mais tarde.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    {/* Você pode adicionar o logo da CENART aqui */}
                    <img src="/logo-cenart-placeholder.png" alt="CENART Logo" className="w-40 h-auto mx-auto mb-4" /> 
                    <h1 className="text-4xl font-bold text-orange-500">CENART SaaS</h1>
                    <p className="text-gray-400 mt-2">Acesse sua plataforma de gestão.</p>
                </div>

                <form 
                    onSubmit={handleSubmit} 
                    className="bg-gray-800 shadow-2xl rounded-xl p-8 md:p-10 space-y-6"
                >
                    {error && (
                        <div className="p-3 bg-red-900/60 border border-red-700 text-red-300 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                        <input 
                            type="email"
                            placeholder="Seu email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                        <input 
                            type="password"
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        />
                    </div>
                    
                    <div className="text-right">
                        <Link href="/forgot-password">
                            <span className="text-sm text-orange-500 hover:text-orange-400 hover:underline">Esqueceu a senha?</span>
                        </Link>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-orange-500/40 transition-all duration-300 ease-in-out flex items-center justify-center text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <FiLogIn className="mr-2" />
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>
                
                <p className="text-center text-gray-500 text-sm mt-8">
                    Ainda não tem uma conta? <Link href="/signup" className="text-orange-500 hover:underline">Crie uma aqui</Link> (se aplicável)
                </p>
            </div>
        </div>
    );
}

