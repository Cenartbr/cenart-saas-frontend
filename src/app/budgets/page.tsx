"use client";
import apiClient from "@/lib/apiClient";
import AppLayout from "@/components/AppLayout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiEye, FiEdit, FiTrash2, FiSearch, FiFilter, FiFileText } from "react-icons/fi";

// Interface para um Orçamento (deve corresponder ao modelo do backend)
interface Orcamento {
    id: number;
    numero_orcamento: string; // Ex: ORC-2025-001
    projeto_id?: number;
    projeto_nome?: string;
    cliente_id: number;
    cliente_nome?: string;
    status_id: number;
    status_nome?: string;
    data_emissao: string;
    data_validade?: string;
    valor_total: number;
    // Adicionar mais campos conforme necessário
}

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Orcamento[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        async function fetchBudgets() {
            setLoading(true);
            setError(null);
            try {
                // TODO: Adicionar autenticação (passar token)
                const data = await apiClient<Orcamento[]>("/api/orcamentos");
                 // Simular nomes de cliente, projeto e status se não vierem da API diretamente
                const budgetsWithDetails = data.map(o => ({
                    ...o,
                    cliente_nome: o.cliente_nome || `Cliente ${o.cliente_id}`,
                    projeto_nome: o.projeto_nome || (o.projeto_id ? `Projeto ${o.projeto_id}` : "Sem projeto vinculado"),
                    status_nome: o.status_nome || `Status ${o.status_id}`,
                }));
                setBudgets(budgetsWithDetails);
            } catch (err: any) {
                console.error("Failed to fetch budgets:", err);
                setError(err.data?.message || err.message || "Falha ao carregar orçamentos.");
            } finally {
                setLoading(false);
            }
        }

        fetchBudgets();
    }, []);

    const filteredBudgets = budgets.filter(budget =>
        budget.numero_orcamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget.cliente_nome && budget.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (budget.projeto_nome && budget.projeto_nome.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDeleteBudget = async (budgetId: number) => {
        if (window.confirm("Tem certeza que deseja excluir este orçamento?")) {
            try {
                // TODO: Adicionar autenticação (passar token)
                await apiClient<void>(`/api/orcamentos/${budgetId}`, { method: "DELETE" });
                setBudgets(prevBudgets => prevBudgets.filter(b => b.id !== budgetId));
            } catch (err: any) {
                console.error("Failed to delete budget:", err);
                alert(err.data?.message || err.message || "Falha ao excluir orçamento.");
            }
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-10 text-center text-xl">Carregando orçamentos...</div>
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
                            <FiFileText className="mr-3" /> Orçamentos
                        </h1>
                        <p className="text-gray-400">Crie e gerencie seus orçamentos comerciais.</p>
                    </div>
                    <Link href="/budgets/create">
                        <button className="w-full md:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md transition-colors flex items-center justify-center">
                            <FiPlus className="mr-2" /> Novo Orçamento
                        </button>
                    </Link>
                </header>

                <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:max-w-md">
                        <input 
                            type="text"
                            placeholder="Buscar por número, cliente ou projeto..."
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

                {filteredBudgets.length === 0 && !loading && (
                    <div className="text-center py-10">
                        <FiFileText className="text-5xl text-gray-500 mx-auto mb-4" />
                        <p className="text-xl text-gray-400">Nenhum orçamento encontrado.</p>
                        <p className="text-gray-500">Crie um novo orçamento para começar.</p>
                    </div>
                )}

                {filteredBudgets.length > 0 && (
                    <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Número</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Projeto Vinculado</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor Total</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data Emissão</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredBudgets.map((budget) => (
                                        <tr key={budget.id} className="hover:bg-gray-700/60 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-orange-400 hover:text-orange-300">
                                                    <Link href={`/budgets/${budget.id}`}>{budget.numero_orcamento}</Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{budget.cliente_nome}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{budget.projeto_nome}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${budget.status_nome === "Aprovado" ? "bg-green-600 text-green-100" : budget.status_nome === "Enviado" ? "bg-blue-600 text-blue-100" : budget.status_nome === "Rejeitado" ? "bg-red-600 text-red-100" : "bg-gray-600 text-gray-100"}`}>
                                                    {budget.status_nome}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">R$ {budget.valor_total.toFixed(2).replace(".", ",")}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(budget.data_emissao).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                <Link href={`/budgets/${budget.id}`} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-gray-700 rounded-md" title="Ver Detalhes">
                                                    <FiEye size={18}/>
                                                </Link>
                                                <Link href={`/budgets/${budget.id}/edit`} className="text-yellow-400 hover:text-yellow-300 p-1.5 hover:bg-gray-700 rounded-md" title="Editar Orçamento">
                                                    <FiEdit size={18}/>
                                                </Link>
                                                <button onClick={() => handleDeleteBudget(budget.id)} className="text-red-500 hover:text-red-400 p-1.5 hover:bg-gray-700 rounded-md" title="Excluir Orçamento">
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

