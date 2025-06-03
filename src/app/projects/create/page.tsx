"use client";
import apiClient from "@/lib/apiClient";
import AppLayout from "@/components/AppLayout";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiSave, FiX, FiBriefcase, FiUsers, FiDollarSign } from "react-icons/fi";

// Interface para dados do formulário de Projeto
interface ProjectFormData {
    nome: string;
    descricao: string;
    cliente_id: string; // IDs como string para formulários
    status_id: string;
    data_inicio: string;
    data_fim_prevista: string;
    orcamento_aprovado: string;
}

// Interfaces para Clientes e Status (para preencher selects)
interface Cliente {
    id: number;
    nome_razao_social: string;
}

interface StatusProjeto {
    id: number;
    nome: string;
}

export default function CreateProjectPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ProjectFormData>({
        nome: "",
        descricao: "",
        cliente_id: "",
        status_id: "", // Idealmente, um status padrão como "A Iniciar"
        data_inicio: "",
        data_fim_prevista: "",
        orcamento_aprovado: "0",
    });
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [statusProjetos, setStatusProjetos] = useState<StatusProjeto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingDependencies, setLoadingDependencies] = useState<boolean>(true);

    useEffect(() => {
        async function fetchDependencies() {
            setLoadingDependencies(true);
            try {
                // TODO: Adicionar autenticação (passar token) se necessário
                const [clientesData, statusData] = await Promise.all([
                    apiClient<Cliente[]>("/api/clientes"), // Supondo que este endpoint exista
                    apiClient<StatusProjeto[]>("/api/status_projeto") // Supondo que este endpoint exista
                ]);
                setClientes(clientesData);
                setStatusProjetos(statusData);
                if (statusData.length > 0) {
                    // Define um status padrão se houver status disponíveis
                    // Poderia ser o primeiro da lista ou um específico como "A Iniciar"
                    const defaultStatus = statusData.find(s => s.nome.toLowerCase() === "a iniciar") || statusData[0];
                    if (defaultStatus) {
                        setFormData(prev => ({ ...prev, status_id: defaultStatus.id.toString() }));
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch dependencies:", err);
                setError("Falha ao carregar dados de clientes ou status.");
            } finally {
                setLoadingDependencies(false);
            }
        }
        fetchDependencies();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                cliente_id: parseInt(formData.cliente_id),
                status_id: parseInt(formData.status_id),
                orcamento_aprovado: parseFloat(formData.orcamento_aprovado),
            };
            // TODO: Adicionar autenticação (passar token)
            await apiClient<any>("/api/projetos", { 
                method: "POST", 
                body: payload 
            });
            alert("Projeto criado com sucesso!");
            router.push("/projects");
        } catch (err: any) {
            console.error("Failed to create project:", err);
            setError(err.data?.message || err.message || "Falha ao criar projeto. Verifique os campos.");
            setLoading(false);
        }
    };

    if (loadingDependencies) {
        return (
            <AppLayout>
                <div className="p-10 text-center text-xl">Carregando dependências do formulário...</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 md:p-10 max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-orange-500 flex items-center">
                        <FiBriefcase className="mr-3" /> Criar Novo Projeto
                    </h1>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                        <p className="font-semibold">Erro ao criar projeto:</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-gray-800 shadow-xl rounded-xl p-8 space-y-6">
                    <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome do Projeto</label>
                        <input 
                            type="text"
                            name="nome"
                            id="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="descricao" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                        <textarea 
                            name="descricao"
                            id="descricao"
                            rows={4}
                            value={formData.descricao}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                            <select 
                                name="cliente_id"
                                id="cliente_id"
                                value={formData.cliente_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 appearance-none"
                            >
                                <option value="" disabled>Selecione um cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>{cliente.nome_razao_social}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status_id" className="block text-sm font-medium text-gray-300 mb-1">Status Inicial</label>
                            <select 
                                name="status_id"
                                id="status_id"
                                value={formData.status_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 appearance-none"
                            >
                                <option value="" disabled>Selecione um status</option>
                                {statusProjetos.map(status => (
                                    <option key={status.id} value={status.id}>{status.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-300 mb-1">Data de Início</label>
                            <input 
                                type="date"
                                name="data_inicio"
                                id="data_inicio"
                                value={formData.data_inicio}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="data_fim_prevista" className="block text-sm font-medium text-gray-300 mb-1">Data de Fim Prevista</label>
                            <input 
                                type="date"
                                name="data_fim_prevista"
                                id="data_fim_prevista"
                                value={formData.data_fim_prevista}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="orcamento_aprovado" className="block text-sm font-medium text-gray-300 mb-1">Orçamento Aprovado (R$)</label>
                        <input 
                            type="number"
                            name="orcamento_aprovado"
                            id="orcamento_aprovado"
                            value={formData.orcamento_aprovado}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end space-x-4">
                        <button 
                            type="button"
                            onClick={() => router.push("/projects")}
                            className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors flex items-center"
                            disabled={loading}
                        >
                            <FiX className="mr-2" /> Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-md transition-colors flex items-center"
                            disabled={loading}
                        >
                            <FiSave className="mr-2" /> {loading ? "Salvando..." : "Salvar Projeto"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

