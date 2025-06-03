"use client";
import apiClient from "@/lib/apiClient";
import { useEffect, useState } from "react";
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiBriefcase, FiStar, FiAlertTriangle, FiBell, FiTag, FiCheckCircle, FiInfo, FiMessageSquare, FiExternalLink } from "react-icons/fi";
import Link from "next/link";

// Interfaces para os dados do dashboard
interface DashboardFinancialSummary {
    saldoEmCaixa: number;
    contasAReceberHoje: number;
    contasAPagarHoje: number;
}

interface DashboardProjectsSummary {
    projetosEmAndamento: number;
    novasOportunidades: number;
}

interface Alerta {
    id: string;
    tipo: "seguranca" | "prazo" | "orcamento" | "geral";
    titulo: string;
    mensagem: string;
    data: string; // Idealmente seria Date, mas string para mock
    link?: string;
    entidade_id?: string;
    responsavel?: string;
    lido: boolean;
}

interface Notificacao {
    id: string;
    tipo: "tarefa" | "projeto" | "comentario" | "geral";
    titulo: string;
    data: string; // Idealmente seria Date
    link?: string;
    entidade_id?: string;
    lido: boolean;
    tags?: string[];
    mencao?: string;
}

// Mock Data para Alertas e Notificações (será substituído por chamadas de API)
const mockAlertasData: Alerta[] = [
    {
        id: "alert1",
        tipo: "prazo",
        titulo: "Prazo do projeto 'Stand Feira XPTO' está próximo",
        mensagem: "O projeto 'Stand Feira XPTO' tem seu deadline em 3 dias.",
        data: "2025-05-15",
        responsavel: "Beatriz",
        link: "/projects/1/tasks", // Exemplo de link
        entidade_id: "1",
        lido: false,
    },
    {
        id: "alert3",
        tipo: "orcamento",
        titulo: "Orçamento #1023 (Cliente ABC) aguardando aprovação",
        mensagem: "O orçamento para o Cliente ABC está aguardando aprovação há 2 dias.",
        data: "2025-05-10",
        responsavel: "Bruno",
        link: "/budgets/1023",
        entidade_id: "1023",
        lido: false,
    },
];

const mockNotificacoesData: Notificacao[] = [
    {
        id: "notif1",
        tipo: "tarefa",
        titulo: "Nova tarefa 'Montagem Estrutura' adicionada ao Projeto 'Stand Feira XPTO'",
        data: "2025-05-12T10:00:00Z",
        link: "/projects/1/tasks/5", // Exemplo
        entidade_id: "5",
        lido: false,
        mencao: "@Produção"
    },
    {
        id: "notif3",
        tipo: "comentario",
        titulo: "Samantha comentou na tarefa 'Aprovação Layout Stand'",
        data: "2025-05-12T09:30:00Z",
        link: "/projects/1/tasks/2#comments",
        entidade_id: "2",
        lido: false,
    },
];

export default function DashboardPage() {
    const [financialSummary, setFinancialSummary] = useState<DashboardFinancialSummary | null>(null);
    const [projectsSummary, setProjectsSummary] = useState<DashboardProjectsSummary | null>(null);
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboardData() {
            setLoading(true);
            setError(null);
            try {
                // TODO: Substituir por chamadas reais à API quando os endpoints estiverem prontos
                // Exemplo: const financialData = await apiClient<DashboardFinancialSummary>("/api/dashboard/financial-summary");
                // Exemplo: const projectsData = await apiClient<DashboardProjectsSummary>("/api/dashboard/projects-summary");
                // Exemplo: const alertasData = await apiClient<Alerta[]>("/api/alerts");
                // Exemplo: const notificacoesData = await apiClient<Notificacao[]>("/api/notifications");

                // Usando mock data por enquanto
                const financialData: DashboardFinancialSummary = {
                    saldoEmCaixa: 25800.50,
                    contasAReceberHoje: 3500.00,
                    contasAPagarHoje: 1250.75
                };
                const projectsData: DashboardProjectsSummary = {
                    projetosEmAndamento: 5,
                    novasOportunidades: 3
                };
                setFinancialSummary(financialData);
                setProjectsSummary(projectsData);
                setAlertas(mockAlertasData);
                setNotificacoes(mockNotificacoesData);

            } catch (err: any) {
                console.error("Failed to fetch dashboard data:", err);
                setError(err.data?.message || err.message || "Falha ao carregar dados do dashboard.");
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    const marcarAlertaLido = async (id: string) => {
        // TODO: Chamar API para marcar como lido no backend: await apiClient(`/api/alerts/${id}/read`, { method: "POST" });
        setAlertas(prev => prev.map(a => a.id === id ? {...a, lido: true} : a).filter(a => !a.lido)); // Remove da lista visualmente
    };

    const marcarNotificacaoLida = async (id: string) => {
        // TODO: Chamar API para marcar como lida no backend: await apiClient(`/api/notifications/${id}/read`, { method: "POST" });
        setNotificacoes(prev => prev.map(n => n.id === id ? {...n, lido: true} : n).filter(n => !n.lido)); // Remove da lista visualmente
    };

    const getAlertaIcon = (tipo: Alerta["tipo"]) => {
        switch (tipo) {
            case "prazo": return <FiAlertTriangle className="text-yellow-400 text-3xl mr-4 flex-shrink-0" />;
            case "seguranca": return <FiAlertTriangle className="text-red-500 text-3xl mr-4 flex-shrink-0" />;
            case "orcamento": return <FiAlertTriangle className="text-orange-500 text-3xl mr-4 flex-shrink-0" />;
            default: return <FiInfo className="text-gray-400 text-3xl mr-4 flex-shrink-0" />;
        }
    };

    const getNotificacaoIcon = (tipo: Notificacao["tipo"]) => {
        switch (tipo) {
            case "tarefa": return <FiCheckCircle className="text-green-400 text-2xl mr-3 flex-shrink-0" />;
            case "projeto": return <FiBriefcase className="text-blue-400 text-2xl mr-3 flex-shrink-0" />;
            case "comentario": return <FiMessageSquare className="text-purple-400 text-2xl mr-3 flex-shrink-0" />;
            default: return <FiInfo className="text-gray-400 text-2xl mr-3 flex-shrink-0" />;
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-xl">Carregando dashboard...</div>;
    }

    if (error) {
        return <div className="p-10 text-red-500 text-center text-xl">Erro: {error}</div>;
    }

    return (
        <div className="p-6 md:p-10">
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-orange-500">Dashboard CENART</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
                {financialSummary && (
                    <>
                        <div className="bg-gray-800 p-6 rounded-xl shadow-xl hover:shadow-orange-500/30 transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-orange-400">Saldo em Caixa</h2>
                                <FiDollarSign className="text-orange-400 text-2xl" />
                            </div>
                            <p className="text-4xl font-bold">R$ {financialSummary.saldoEmCaixa.toFixed(2).replace(".", ",")}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl shadow-xl hover:shadow-green-500/30 transition-shadow duration-300">
                             <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-green-400">A Receber (Hoje)</h2>
                                <FiTrendingUp className="text-green-400 text-2xl" />
                            </div>
                            <p className="text-4xl font-bold">R$ {financialSummary.contasAReceberHoje.toFixed(2).replace(".", ",")}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl shadow-xl hover:shadow-red-500/30 transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-red-400">A Pagar (Hoje)</h2>
                                <FiTrendingDown className="text-red-400 text-2xl" />
                            </div>
                            <p className="text-4xl font-bold">R$ {financialSummary.contasAPagarHoje.toFixed(2).replace(".", ",")}</p>
                        </div>
                    </>
                )}
                {projectsSummary && (
                    <>
                        <div className="bg-gray-800 p-6 rounded-xl shadow-xl hover:shadow-blue-500/30 transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-blue-400">Projetos Ativos</h2>
                                <FiBriefcase className="text-blue-400 text-2xl" />
                            </div>
                            <p className="text-4xl font-bold">{projectsSummary.projetosEmAndamento}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl shadow-xl hover:shadow-purple-500/30 transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-purple-400">Oportunidades</h2>
                                <FiStar className="text-purple-400 text-2xl" />
                            </div>
                            <p className="text-4xl font-bold">{projectsSummary.novasOportunidades}</p>
                        </div>
                    </>
                )}
            </div>

            <div className="mb-10">
                <h2 className="text-3xl font-semibold mb-6 text-orange-500">Alertas e Notificações</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                        <h3 className="text-xl font-semibold text-yellow-400 mb-4">Alertas Importantes</h3>
                        {alertas.filter(a => !a.lido).length > 0 ? (
                            <ul className="space-y-4">
                                {alertas.filter(a => !a.lido).map(alerta => (
                                    <li key={alerta.id} className="flex items-start p-4 bg-gray-700/70 rounded-lg hover:bg-gray-700 transition-colors">
                                        {getAlertaIcon(alerta.tipo)}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-100 text-md">{alerta.titulo}</p>
                                            <p className="text-sm text-gray-300 mt-1">{alerta.mensagem}</p>
                                            <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                                                <span>{new Date(alerta.data).toLocaleDateString("pt-BR")}</span>
                                                {alerta.responsavel && <span className="font-medium">Resp: {alerta.responsavel}</span>}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex flex-col items-end space-y-2">
                                            {alerta.link && 
                                                <Link href={alerta.link} className="text-xs text-blue-400 hover:underline flex items-center">
                                                    Ver <FiExternalLink className="ml-1"/>
                                                </Link>
                                            }
                                            <button onClick={() => marcarAlertaLido(alerta.id)} className="text-xs text-orange-500 hover:text-orange-400">
                                                Marcar Lido
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 italic">Nenhum alerta importante no momento.</p>
                        )}
                    </div>

                    <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                        <h3 className="text-xl font-semibold text-blue-400 mb-4">Notificações Recentes</h3>
                        {notificacoes.filter(n => !n.lido).length > 0 ? (
                             <ul className="space-y-3">
                                {notificacoes.filter(n => !n.lido).map(notificacao => (
                                    <li key={notificacao.id} className="flex items-start p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                        {getNotificacaoIcon(notificacao.tipo)}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-200 text-sm">{notificacao.titulo}</p>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                <span>{new Date(notificacao.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"})}</span>
                                                {notificacao.mencao && <span className="ml-2 px-1.5 py-0.5 bg-purple-600 text-white rounded-full text-xs">{notificacao.mencao}</span>}
                                                {notificacao.tags && notificacao.tags.map(tag => (
                                                    <span key={tag} className="ml-2 px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded-full text-xs">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="ml-3 flex flex-col items-end space-y-1">
                                            {notificacao.link && 
                                                <Link href={notificacao.link} className="text-xs text-blue-400 hover:underline">
                                                    Ver
                                                </Link>
                                            }
                                            <button onClick={() => marcarNotificacaoLida(notificacao.id)} className="text-xs text-orange-500 hover:text-orange-400">
                                                Lida
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-gray-400 italic">Nenhuma notificação nova.</p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Placeholder para Atividades Recentes ou Kanban de Projetos */}
            {/* A lógica do Kanban será movida para sua própria página: /projects/[projectId]/kanban */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-orange-500">Atividades Recentes (Exemplo)</h2>
                 <p className="text-gray-400 italic">Esta seção será desenvolvida.</p>
            </div>
        </div>
    );
}

