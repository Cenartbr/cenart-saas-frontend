"use client";
import apiClient from "@/lib/apiClient";
import AppLayout from "@/components/AppLayout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiEye, FiEdit, FiTrash2, FiSearch, FiFilter, FiBriefcase } from "react-icons/fi";

// Interface para um Projeto (deve corresponder ao modelo do backend)
interface Projeto {
    id: number;
    nome: string;
    descricao?: string;
    cliente_id: number; // Ou um objeto Cliente mais completo
    cliente_nome?: string; // Adicionado para exibição
    status_id: number; // Ou um objeto StatusProjeto
    status_nome?: string; // Adicionado para exibição
    data_inicio?: string;
    data_fim_prevista?: string;
    data_conclusao?: string;
    orcamento_aprovado?: number;
    // Adicionar mais campos conforme necessário
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Projeto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        async function fetchProjects() {
            setLoading(true);
            setError(null);
            try {
                // TODO: Adicionar autenticação (passar token) se necessário no apiClient
                const data = await apiClient<Projeto[]>("/api/projetos");
                // Simular nomes de cliente e status se não vierem da API diretamente
                // Idealmente, a API /api/projetos retornaria esses dados ou teríamos chamadas separadas/joins
                const projectsWithDetails = data.map(p => ({
                    ...p,
                    cliente_nome: p.cliente_nome || `Cliente ${p.cliente_id}`,
                    status_nome: p.status_nome || `Status ${p.status_id}`,
                }));
                setProjects(projectsWithDetails);
            } catch (err: any) {
                console.error("Failed to fetch projects:", err);
                setError(err.data?.message || err.message || "Falha ao carregar projetos.");
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(project =>
        project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.cliente_nome && project.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDeleteProject = async (projectId: number) => {
        if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
            try {
                // TODO: Adicionar autenticação (passar token)
                await apiClient<void>(`/api/projetos/${projectId}`, { method: "DELETE" });
                setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
            } catch (err: any) {
                console.error("Failed to delete project:", err);
                alert(err.data?.message || err.message || "Falha ao excluir projeto.");
            }
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-10 text-center text-xl">Carregando projetos...</div>
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
                            <FiBriefcase className="mr-3" /> Projetos
                        </h1>
                        <p className="text-gray-400">Gerencie todos os seus projetos em um só lugar.</p>
                    </div>
                    <Link href="/projects/create">
                        <button className="w-full md:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md transition-colors flex items-center justify-center">
                            <FiPlus className="mr-2" /> Novo Projeto
                        </button>
                    </Link>
                </header>

                <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:max-w-md">
                        <input 
                            type="text"
                            placeholder="Buscar por nome ou cliente..."
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

                {filteredProjects.length === 0 && !loading && (
                    <div className="text-center py-10">
                        <FiBriefcase className="text-5xl text-gray-500 mx-auto mb-4" />
                        <p className="text-xl text-gray-400">Nenhum projeto encontrado.</p>
                        <p className="text-gray-500">Crie um novo projeto para começar.</p>
                    </div>
                )}

                {filteredProjects.length > 0 && (
                    <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome do Projeto</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data Fim Prevista</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredProjects.map((project) => (
                                        <tr key={project.id} className="hover:bg-gray-700/60 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-orange-400 hover:text-orange-300">
                                                    <Link href={`/projects/${project.id}/kanban`}>{project.nome}</Link>
                                                </div>
                                                <div className="text-xs text-gray-400 truncate max-w-xs">{project.descricao || "Sem descrição"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{project.cliente_nome}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${project.status_nome === "Em Andamento" ? "bg-blue-600 text-blue-100" : project.status_nome === "Concluído" ? "bg-green-600 text-green-100" : "bg-gray-600 text-gray-100"}`}>
                                                    {project.status_nome}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {project.data_fim_prevista ? new Date(project.data_fim_prevista).toLocaleDateString("pt-BR") : "N/D"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                <Link href={`/projects/${project.id}/kanban`} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-gray-700 rounded-md" title="Ver Kanban">
                                                    <FiEye size={18}/>
                                                </Link>
                                                <Link href={`/projects/${project.id}/edit`} className="text-yellow-400 hover:text-yellow-300 p-1.5 hover:bg-gray-700 rounded-md" title="Editar Projeto">
                                                    <FiEdit size={18}/>
                                                </Link>
                                                <button onClick={() => handleDeleteProject(project.id)} className="text-red-500 hover:text-red-400 p-1.5 hover:bg-gray-700 rounded-md" title="Excluir Projeto">
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

