"use client";
import apiClient from "@/lib/apiClient";
import AppLayout from "@/components/AppLayout";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiSave, FiX, FiFileText, FiUsers, FiBriefcase, FiPlusCircle, FiTrash2 } from "react-icons/fi";

// Interface para dados do formulário de Orçamento
interface BudgetFormData {
    numero_orcamento: string; // Será gerado ou validado no backend
    cliente_id: string;
    projeto_id?: string;
    status_id: string;
    data_emissao: string;
    data_validade: string;
    condicoes_pagamento: string;
    observacoes: string;
    itens: BudgetItemFormData[];
}

interface BudgetItemFormData {
    // id_local: string; // Para controle no frontend antes de salvar
    descricao: string;
    unidade: string;
    quantidade: string;
    valor_unitario: string;
    // valor_total será calculado
}

// Interfaces para Clientes, Projetos e Status (para preencher selects)
interface Cliente {
    id: number;
    nome_razao_social: string;
}

interface Projeto {
    id: number;
    nome: string;
}

interface StatusOrcamento {
    id: number;
    nome: string;
}

export default function CreateBudgetPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<BudgetFormData>({
        numero_orcamento: "", // Pode ser preenchido/sugerido pelo backend
        cliente_id: "",
        projeto_id: "",
        status_id: "", // Idealmente, um status padrão como "Em Elaboração"
        data_emissao: new Date().toISOString().split("T")[0], // Data atual como padrão
        data_validade: "",
        condicoes_pagamento: "",
        observacoes: "",
        itens: [{ descricao: "", unidade: "UN", quantidade: "1", valor_unitario: "0" }],
    });

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [statusOrcamentos, setStatusOrcamentos] = useState<StatusOrcamento[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingDependencies, setLoadingDependencies] = useState<boolean>(true);

    useEffect(() => {
        async function fetchDependencies() {
            setLoadingDependencies(true);
            try {
                // TODO: Adicionar autenticação (passar token)
                const [clientesData, projetosData, statusData] = await Promise.all([
                    apiClient<Cliente[]>("/api/clientes"),
                    apiClient<Projeto[]>("/api/projetos"), // Supondo que este endpoint exista
                    apiClient<StatusOrcamento[]>("/api/status_orcamento") // Supondo que este endpoint exista
                ]);
                setClientes(clientesData);
                setProjetos(projetosData);
                setStatusOrcamentos(statusData);

                if (statusData.length > 0) {
                    const defaultStatus = statusData.find(s => s.nome.toLowerCase() === "em elaboração") || statusData[0];
                    if (defaultStatus) {
                        setFormData(prev => ({ ...prev, status_id: defaultStatus.id.toString() }));
                    }
                }
                 // Gerar um número de orçamento inicial (exemplo, backend pode ter lógica mais robusta)
                const year = new Date().getFullYear();
                // const nextId = await apiClient<number>("/api/orcamentos/next-id"); // Idealmente, buscar próximo ID
                // setFormData(prev => ({ ...prev, numero_orcamento: `ORC-${year}-${String(nextId).padStart(4, "0")}`}));
                setFormData(prev => ({ ...prev, numero_orcamento: `ORC-${year}-XXXX`})); // Placeholder

            } catch (err: any) {
                console.error("Failed to fetch dependencies:", err);
                setError("Falha ao carregar dados de clientes, projetos ou status.");
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

    const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newItems = [...formData.itens];
        (newItems[index] as any)[name] = value;
        setFormData(prev => ({ ...prev, itens: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            itens: [...prev.itens, { descricao: "", unidade: "UN", quantidade: "1", valor_unitario: "0" }],
        }));
    };

    const removeItem = (index: number) => {
        const newItems = [...formData.itens];
        newItems.splice(index, 1);
        setFormData(prev => ({ ...prev, itens: newItems }));
    };

    const calculateItemTotal = (item: BudgetItemFormData) => {
        const qty = parseFloat(item.quantidade) || 0;
        const val = parseFloat(item.valor_unitario) || 0;
        return (qty * val).toFixed(2);
    };

    const calculateGrandTotal = () => {
        return formData.itens.reduce((total, item) => {
            return total + parseFloat(calculateItemTotal(item));
        }, 0).toFixed(2);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                cliente_id: parseInt(formData.cliente_id),
                projeto_id: formData.projeto_id ? parseInt(formData.projeto_id) : null,
                status_id: parseInt(formData.status_id),
                itens: formData.itens.map(item => ({
                    ...item,
                    quantidade: parseFloat(item.quantidade),
                    valor_unitario: parseFloat(item.valor_unitario),
                })),
                valor_total: parseFloat(calculateGrandTotal()), // Adicionar valor total ao payload
            };
            // TODO: Adicionar autenticação (passar token)
            await apiClient<any>("/api/orcamentos", { 
                method: "POST", 
                body: payload 
            });
            alert("Orçamento criado com sucesso!");
            router.push("/budgets");
        } catch (err: any) {
            console.error("Failed to create budget:", err);
            setError(err.data?.message || err.message || "Falha ao criar orçamento. Verifique os campos.");
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
            <div className="p-6 md:p-10 max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-orange-500 flex items-center">
                        <FiFileText className="mr-3" /> Criar Novo Orçamento
                    </h1>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                        <p className="font-semibold">Erro ao criar orçamento:</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-gray-800 shadow-xl rounded-xl p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="numero_orcamento" className="block text-sm font-medium text-gray-300 mb-1">Número do Orçamento</label>
                            <input 
                                type="text"
                                name="numero_orcamento"
                                id="numero_orcamento"
                                value={formData.numero_orcamento}
                                onChange={handleChange}
                                // readOnly // Se gerado pelo backend
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="data_emissao" className="block text-sm font-medium text-gray-300 mb-1">Data de Emissão</label>
                            <input 
                                type="date"
                                name="data_emissao"
                                id="data_emissao"
                                value={formData.data_emissao}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="data_validade" className="block text-sm font-medium text-gray-300 mb-1">Data de Validade</label>
                            <input 
                                type="date"
                                name="data_validade"
                                id="data_validade"
                                value={formData.data_validade}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <label htmlFor="projeto_id" className="block text-sm font-medium text-gray-300 mb-1">Projeto Vinculado (Opcional)</label>
                            <select 
                                name="projeto_id"
                                id="projeto_id"
                                value={formData.projeto_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 appearance-none"
                            >
                                <option value="">Nenhum projeto</option>
                                {projetos.map(projeto => (
                                    <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status_id" className="block text-sm font-medium text-gray-300 mb-1">Status do Orçamento</label>
                            <select 
                                name="status_id"
                                id="status_id"
                                value={formData.status_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 appearance-none"
                            >
                                <option value="" disabled>Selecione um status</option>
                                {statusOrcamentos.map(status => (
                                    <option key={status.id} value={status.id}>{status.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <h3 className="text-xl font-semibold text-orange-400 mb-3">Itens do Orçamento</h3>
                        {formData.itens.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 p-3 border border-gray-700 rounded-lg items-end">
                                <div className="md:col-span-5">
                                    <label htmlFor={`item_descricao_${index}`} className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
                                    <input type="text" name="descricao" id={`item_descricao_${index}`} value={item.descricao} onChange={(e) => handleItemChange(index, e)} required className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md text-sm"/>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor={`item_unidade_${index}`} className="block text-xs font-medium text-gray-400 mb-1">Unidade</label>
                                    <input type="text" name="unidade" id={`item_unidade_${index}`} value={item.unidade} onChange={(e) => handleItemChange(index, e)} required className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md text-sm"/>
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor={`item_quantidade_${index}`} className="block text-xs font-medium text-gray-400 mb-1">Qtd.</label>
                                    <input type="number" name="quantidade" id={`item_quantidade_${index}`} value={item.quantidade} onChange={(e) => handleItemChange(index, e)} required min="0" step="any" className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md text-sm"/>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor={`item_valor_unitario_${index}`} className="block text-xs font-medium text-gray-400 mb-1">Val. Unit.</label>
                                    <input type="number" name="valor_unitario" id={`item_valor_unitario_${index}`} value={item.valor_unitario} onChange={(e) => handleItemChange(index, e)} required min="0" step="0.01" className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-gray-200 rounded-md text-sm"/>
                                </div>
                                <div className="md:col-span-1 text-right">
                                     <label className="block text-xs font-medium text-gray-400 mb-1">Subtotal</label>
                                     <p className="px-3 py-2 text-gray-200 text-sm">{calculateItemTotal(item)}</p>
                                </div>
                                <div className="md:col-span-1 flex items-end">
                                    {formData.itens.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:text-red-400">
                                            <FiTrash2 size={18}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button 
                            type="button"
                            onClick={addItem}
                            className="mt-2 px-4 py-2 text-sm font-medium text-orange-500 hover:text-orange-400 border border-orange-500 hover:border-orange-400 rounded-lg flex items-center transition-colors"
                        >
                            <FiPlusCircle className="mr-2" /> Adicionar Item
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <label htmlFor="condicoes_pagamento" className="block text-sm font-medium text-gray-300 mb-1">Condições de Pagamento</label>
                        <textarea 
                            name="condicoes_pagamento"
                            id="condicoes_pagamento"
                            rows={3}
                            value={formData.condicoes_pagamento}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
                        <textarea 
                            name="observacoes"
                            id="observacoes"
                            rows={3}
                            value={formData.observacoes}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <div className="pt-6 flex items-center justify-between">
                        <div>
                            <span className="text-lg font-semibold text-gray-300">Valor Total do Orçamento: </span>
                            <span className="text-2xl font-bold text-orange-500">R$ {calculateGrandTotal()}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button 
                                type="button"
                                onClick={() => router.push("/budgets")}
                                className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors flex items-center"
                                disabled={loading}
                            >
                                <FiX className="mr-2" /> Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-md transition-colors flex items-center"
                                disabled={loading || loadingDependencies}
                            >
                                <FiSave className="mr-2" /> {loading ? "Salvando..." : "Salvar Orçamento"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

