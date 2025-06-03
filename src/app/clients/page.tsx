"use client";
import apiClient from "@/lib/apiClient";
import AppLayout from "@/components/AppLayout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiEye, FiEdit, FiTrash2, FiSearch, FiFilter, FiUsers } from "react-icons/fi";

// Interface para um Cliente (deve corresponder ao modelo do backend)
interface Cliente {
    id: number;
    nome_razao_social: string;
    cpf_cnpj?: string;
    email_principal?: string;
    telefone_principal?: string;
    // Adicionar mais campos conforme necessário
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        async function fetchClients() {
            setLoading(true);
            setError(null);
            try {
                // TODO: Adicionar autenticação (passar token) se necessário no apiClient
                const data = await apiClient<Cliente[]>("/api/clientes");
                setClients(data);
            } catch (err: any) {
                console.error("Failed to fetch clients:", err);
                setError(err.data?.message || err.message || "Falha ao carregar clientes.");
            } finally {
                setLoading(false);
            }
        }

        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.nome_razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.cpf_cnpj && client.cpf_cnpj.includes(searchTerm)) ||
        (client.email_principal && client.email_principal.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDeleteClient = async (clientId: number) => {
        if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
            try {
                // TODO: Adicionar autenticação (passar token)
                await apiClient<void>(`/api/clientes/${clientId}`, { method: "DELETE" });
                setClients(prevClients => prevClients.filter(c => c.id !== clientId));
            } catch (err: any) {
                console.error("Failed to delete client:", err);
                alert(err.data?.message || err.message || "Falha ao excluir cliente.");
            }
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-10 text-center text-xl">Carregando clientes...</div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <div className="p-10 text-red-500 text-center text-xl">Erro: {error}</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 md:p-10">
                <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center">
                    <div className="mb-4 md:mb-0">
                        <h1 className="text-3xl font-bold text-orange-500 flex items-center">
                            <FiUsers className="mr-3" /> Clientes
                        </h1>
                        <p className="text-gray-400">Gerencie seus clientes e contatos.</p>
                    </div>
                    <Link href="/clients/create">
                        <button className="w-full md:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md transition-colors flex items-center justify-center">
                            <FiPlus className="mr-2" /> Novo Cliente
                        </button>
                    </Link>
                </header>

                <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:max-w-md">
                        <input 
                            type="text"
                            placeholder="Buscar por nome, CPF/CNPJ ou email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button className="w-full md:w-auto px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center justify-center">
                        <FiFilter className="mr-2" /> Filtros
                    </button>
                </div>

                {filteredClients.length === 0 && !loading && (
                    <div className="text-center py-10">
                        <FiUsers className="text-5xl text-gray-500 mx-auto mb-4" />
                        <p className="text-xl text-gray-400">Nenhum cliente encontrado.</p>
                        <p className="text-gray-500">Crie um novo cliente para começar.</p>
                    </div>
                )}

                {filteredClients.length > 0 && (
                    <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome/Razão Social</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CPF/CNPJ</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email Principal</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Telefone</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-700/60 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-orange-400 hover:text-orange-300">
                                                    <Link href={`/clients/${client.id}`}>{client.nome_razao_social}</Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.cpf_cnpj || "N/D"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.email_principal || "N/D"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.telefone_principal || "N/D"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                <Link href={`/clients/${client.id}`} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-gray-700 rounded-md" title="Ver Detalhes">
                                                    <FiEye size={18}/>
                                                </Link>
                                                <Link href={`/clients/${client.id}/edit`} className="text-yellow-400 hover:text-yellow-300 p-1.5 hover:bg-gray-700 rounded-md" title="Editar Cliente">
                                                    <FiEdit size={18}/>
                                                </Link>
                                                <button onClick={() => handleDeleteClient(client.id)} className="text-red-500 hover:text-red-400 p-1.5 hover:bg-gray-700 rounded-md" title="Excluir Cliente">
                                                    <FiTrash2 size={18}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

