"use client";
import apiClient from "@/lib/apiClient";
import AppLayout from "@/components/AppLayout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiEye, FiEdit, FiTrash2, FiSearch, FiFilter, FiDollarSign, FiArrowUpCircle, FiArrowDownCircle } from "react-icons/fi";

// Interface para Contas (Pagar/Receber)
interface Conta {
    id: number;
    descricao: string;
    valor: number;
    data_vencimento: string;
    data_pagamento_recebimento?: string;
    status_id: number;
    status_nome?: string; // Ex: "Pendente", "Pago", "Recebido", "Vencido"
    tipo: "PAGAR" | "RECEBER";
    projeto_id?: number;
    projeto_nome?: string;
    cliente_fornecedor_id?: number; // Pode ser ID de Cliente ou Fornecedor
    cliente_fornecedor_nome?: string;
    centro_custo_id?: number;
    centro_custo_nome?: string;
    // Adicionar mais campos conforme necessário
}

export default function FinancePage() {
    const [contas, setContas] = useState<Conta[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterType, setFilterType] = useState<"TODAS" | "PAGAR" | "RECEBER">("TODAS");

    useEffect(() => {
        async function fetchContas() {
            setLoading(true);
            setError(null);
            try {
                // TODO: Adicionar autenticação (passar token)
                // O endpoint pode precisar de um parâmetro para tipo ou buscar todas e filtrar no frontend
                const endpoint = filterType === "TODAS" ? "/api/contas" : `/api/contas?tipo=${filterType}`;
                const data = await apiClient<Conta[]>(endpoint);
                
                const contasComDetalhes = data.map(c => ({
                    ...c,
                    status_nome: c.status_nome || `Status ${c.status_id}`,
                    projeto_nome: c.projeto_nome || (c.projeto_id ? `Projeto ${c.projeto_id}` : "N/A"),
                    cliente_fornecedor_nome: c.cliente_fornecedor_nome || (c.cliente_fornecedor_id ? `Entidade ${c.cliente_fornecedor_id}` : "N/A"),
                    centro_custo_nome: c.centro_custo_nome || (c.centro_custo_id ? `Centro ${c.centro_custo_id}` : "N/A"),
                }));
                setContas(contasComDetalhes);
            } catch (err: any) {
                console.error("Failed to fetch contas:", err);
                setError(err.data?.message || err.message || "Falha ao carregar contas.");
            } finally {
                setLoading(false);
            }
        }

        fetchContas();
    }, [filterType]);

    const filteredContas = contas.filter(conta =>
        conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conta.projeto_nome && conta.projeto_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conta.cliente_fornecedor_nome && conta.cliente_fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDeleteConta = async (contaId: number) => {
        if (window.confirm("Tem certeza que deseja excluir esta conta?")) {
            try {
                // TODO: Adicionar autenticação (passar token)
                await apiClient<void>(`/api/contas/${contaId}`, { method: "DELETE" });
                setContas(prevContas => prevContas.filter(c => c.id !== contaId));
            } catch (err: any) {
                console.error("Failed to delete conta:", err);
                alert(err.data?.message || err.message || "Falha ao excluir conta.");
            }
        }
    };

    const getStatusColor = (statusNome?: string) => {
        if (!statusNome) return "bg-gray-600 text-gray-100";
        switch (statusNome.toLowerCase()) {
            case "pago":
            case "recebido":
                return "bg-green-600 text-green-100";
            case "pendente":
                return "bg-yellow-500 text-yellow-100";
            case "vencido":
                return "bg-red-600 text-red-100";
            case "cancelado":
                return "bg-gray-500 text-gray-100";
            default:
                return "bg-gray-600 text-gray-100";
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-10 text-center text-xl">Carregando financeiro...</div>
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
                            <FiDollarSign className="mr-3" /> Financeiro
                        </h1>
                        <p className="text-gray-400">Gerencie suas contas a pagar e a receber.</p>
                    </div>
                    <div className="flex space-x-3">
                        <Link href="/finance/create-payable">
                            <button className="w-full md:w-auto px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors flex items-center justify-center">
                                <FiArrowDownCircle className="mr-2" /> Nova Despesa
                            </button>
                        </Link>
                        <Link href="/finance/create-receivable">
                            <button className="w-full md:w-auto px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors flex items-center justify-center">
                                <FiArrowUpCircle className="mr-2" /> Nova Receita
                            </button>
                        </Link>
                    </div>
                </header>

                <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:max-w-md">
                        <input 
                            type="text"
                            placeholder="Buscar por descrição, projeto, cliente/fornecedor..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as "TODAS" | "PAGAR" | "RECEBER")}
                            className="px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 appearance-none"
                        >
                            <option value="TODAS">Todas as Contas</option>
                            <option value="PAGAR">Contas a Pagar</option>
                            <option value="RECEBER">Contas a Receber</option>
                        </select>
                        <button className="w-full md:w-auto px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center justify-center">
                            <FiFilter className="mr-2" /> Mais Filtros
                        </button>
                    </div>
                </div>

                {filteredContas.length === 0 && !loading && (
                    <div className="text-center py-10">
                        <FiDollarSign className="text-5xl text-gray-500 mx-auto mb-4" />
                        <p className="text-xl text-gray-400">Nenhuma conta encontrada para os filtros selecionados.</p>
                    </div>
                )}

                {filteredContas.length > 0 && (
                    <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descrição</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor (R$)</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vencimento</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente/Fornecedor</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Projeto</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredContas.map((conta) => (
                                        <tr key={conta.id} className={`hover:bg-gray-700/60 transition-colors ${conta.tipo === "PAGAR" ? "border-l-4 border-red-500" : "border-l-4 border-green-500"}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-orange-400 hover:text-orange-300">
                                                    <Link href={`/finance/${conta.id}`}>{conta.descricao}</Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-semibold ${conta.tipo === "PAGAR" ? "text-red-400" : "text-green-400"}`}>
                                                    {conta.tipo === "PAGAR" ? "A Pagar" : "A Receber"}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${conta.tipo === "PAGAR" ? "text-red-400" : "text-green-400"}`}>
                                                {conta.valor.toFixed(2).replace(".", ",")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(conta.data_vencimento).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(conta.status_nome)}`}>
                                                    {conta.status_nome}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{conta.cliente_fornecedor_nome}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{conta.projeto_nome}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                <Link href={`/finance/${conta.id}`} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-gray-700 rounded-md" title="Ver Detalhes">
                                                    <FiEye size={18}/>
                                                </Link>
                                                <Link href={`/finance/${conta.id}/edit`} className="text-yellow-400 hover:text-yellow-300 p-1.5 hover:bg-gray-700 rounded-md" title="Editar Conta">
                                                    <FiEdit size={18}/>
                                                </Link>
                                                <button onClick={() => handleDeleteConta(conta.id)} className="text-red-500 hover:text-red-400 p-1.5 hover:bg-gray-700 rounded-md" title="Excluir Conta">
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

