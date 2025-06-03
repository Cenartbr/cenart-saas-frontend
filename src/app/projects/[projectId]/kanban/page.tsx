"use client";
import apiClient from "@/lib/apiClient";
import AppLayout from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiClipboard, FiClock, FiUser, FiTag } from "react-icons/fi";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Link from "next/link";

// Interface para uma Tarefa (deve corresponder ao modelo do backend)
interface Tarefa {
    id: number;
    nome: string;
    descricao?: string;
    projeto_id: number;
    status_id: number;
    status_nome?: string; // Ex: "A Fazer", "Em Andamento", "Concluída", "Bloqueada"
    responsavel_id?: number;
    responsavel_nome?: string;
    data_criacao: string;
    data_prazo?: string;
    prioridade?: "Baixa" | "Média" | "Alta";
    tags?: string[];
    ordem_kanban?: number; // Para manter a ordem dentro da coluna
}

// Interface para Status de Tarefa (para colunas do Kanban)
interface StatusTarefa {
    id: number;
    nome: string;
    ordem: number; // Para ordenar as colunas
}

// Interface para Projeto (para obter o nome do projeto)
interface Projeto {
    id: number;
    nome: string;
}

export default function ProjectKanbanPage({ params }: { params: { projectId: string } }) {
    const projectId = parseInt(params.projectId);
    const [project, setProject] = useState<Projeto | null>(null);
    const [tasksByStatus, setTasksByStatus] = useState<Record<string, Tarefa[]>>({});
    const [statusColunas, setStatusColunas] = useState<StatusTarefa[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchKanbanData() {
            if (!projectId) return;
            setLoading(true);
            setError(null);
            try {
                const [projectData, tasksData, statusesData] = await Promise.all([
                    apiClient<Projeto>(`/api/projetos/${projectId}`),
                    apiClient<Tarefa[]>(`/api/projetos/${projectId}/tarefas`), 
                    apiClient<StatusTarefa[]>("/api/status_tarefa") 
                ]);

                setProject(projectData);
                
                const orderedStatuses = statusesData.sort((a, b) => a.ordem - b.ordem);
                setStatusColunas(orderedStatuses);

                const initialTasksByStatus: Record<string, Tarefa[]> = {};
                orderedStatuses.forEach(status => {
                    initialTasksByStatus[status.id.toString()] = [];
                });

                tasksData.forEach(task => {
                    const taskWithDetails = {
                        ...task,
                        status_nome: orderedStatuses.find(s => s.id === task.status_id)?.nome || `Status ${task.status_id}`,
                        // responsavel_nome: ... buscar de /api/usuarios se necessário
                    };
                    if (initialTasksByStatus[task.status_id.toString()]) {
                        initialTasksByStatus[task.status_id.toString()].push(taskWithDetails);
                    } else {
                        // Fallback se uma tarefa tiver um status não listado (improvável com dados consistentes)
                        initialTasksByStatus[task.status_id.toString()] = [taskWithDetails];
                    }
                });

                // Ordenar tarefas dentro de cada status pela ordem_kanban, se disponível
                for (const statusId in initialTasksByStatus) {
                    initialTasksByStatus[statusId].sort((a, b) => (a.ordem_kanban || 0) - (b.ordem_kanban || 0));
                }

                setTasksByStatus(initialTasksByStatus);

            } catch (err: any) {
                console.error("Failed to fetch Kanban data:", err);
                setError(err.data?.message || err.message || "Falha ao carregar dados do Kanban.");
            } finally {
                setLoading(false);
            }
        }

        fetchKanbanData();
    }, [projectId]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        const taskId = parseInt(draggableId);
        const sourceStatusId = source.droppableId;
        const destStatusId = destination.droppableId;

        // Copia profunda do estado atual para manipulação otimista
        const newTasksByStatus = JSON.parse(JSON.stringify(tasksByStatus));
        
        const taskToMove = newTasksByStatus[sourceStatusId]?.find((t: Tarefa) => t.id === taskId);
        if (!taskToMove) return;

        // Remover da coluna de origem
        newTasksByStatus[sourceStatusId] = newTasksByStatus[sourceStatusId].filter((t: Tarefa) => t.id !== taskId);
        // Adicionar à coluna de destino na posição correta
        if (!newTasksByStatus[destStatusId]) newTasksByStatus[destStatusId] = [];
        newTasksByStatus[destStatusId].splice(destination.index, 0, taskToMove);

        // Atualizar o status_id e status_nome da tarefa movida
        taskToMove.status_id = parseInt(destStatusId);
        taskToMove.status_nome = statusColunas.find(s => s.id === parseInt(destStatusId))?.nome;

        // Atualizar a ordem_kanban para todas as tarefas na coluna de destino
        newTasksByStatus[destStatusId].forEach((task: Tarefa, index: number) => {
            task.ordem_kanban = index;
        });
        // Se a tarefa foi movida de uma coluna diferente, atualizar a ordem na coluna de origem também
        if (sourceStatusId !== destStatusId && newTasksByStatus[sourceStatusId]) {
            newTasksByStatus[sourceStatusId].forEach((task: Tarefa, index: number) => {
                task.ordem_kanban = index;
            });
        }

        setTasksByStatus(newTasksByStatus); // Atualização otimista da UI

        try {
            // TODO: Adicionar autenticação (passar token)
            await apiClient(`/api/tarefas/${taskId}/move`, { 
                method: "PUT", 
                body: { 
                    novo_status_id: parseInt(destStatusId),
                    nova_ordem_kanban: destination.index 
                }
            });
            // Se a API for bem-sucedida, o estado já está atualizado otimisticamente.
            // Poderia re-buscar os dados para garantir consistência, mas para drag-n-drop rápido, otimismo é comum.
        } catch (err: any) {
            console.error("Failed to update task status/order:", err);
            setError(err.data?.message || err.message || "Falha ao mover tarefa. Revertendo.");
            // Reverter para o estado anterior em caso de erro na API
            // Isso requer armazenar o estado anterior ou re-buscar os dados.
            // Por simplicidade, vamos apenas logar o erro por enquanto.
            // Para uma UI robusta, um rollback ou refetch seria ideal aqui.
            // Exemplo de refetch:
            // fetchKanbanData(); 
        }
    };

    const getTaskCardColor = (statusNome?: string) => {
        if (!statusNome) return "bg-gray-700 hover:bg-gray-600";
        switch (statusNome.toLowerCase()) {
            case "a fazer": return "bg-blue-700 hover:bg-blue-600";
            case "em andamento": return "bg-indigo-700 hover:bg-indigo-600";
            case "revisão": return "bg-purple-700 hover:bg-purple-600";
            case "concluída": return "bg-green-700 hover:bg-green-600";
            case "bloqueada": return "bg-red-700 hover:bg-red-600";
            default: return "bg-gray-700 hover:bg-gray-600";
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-10 text-center text-xl">Carregando Kanban do projeto...</div>
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
            <div className="p-6 md:p-10 h-full flex flex-col">
                <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center">
                    <div className="mb-4 md:mb-0">
                        <h1 className="text-3xl font-bold text-orange-500">
                            Kanban: {project?.nome || `Projeto ${projectId}`}
                        </h1>
                        <p className="text-gray-400">Visualize e gerencie o fluxo de tarefas do projeto.</p>
                    </div>
                    <Link href={`/projects/${projectId}/tasks/create`}> 
                        <button className="w-full md:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md transition-colors flex items-center justify-center">
                            <FiPlus className="mr-2" /> Nova Tarefa
                        </button>
                    </Link>
                </header>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex-grow overflow-x-auto pb-4">
                        <div className="flex space-x-4 min-h-full">
                            {statusColunas.map(status => (
                                <Droppable key={status.id.toString()} droppableId={status.id.toString()}>
                                    {(provided, snapshot) => (
                                        <div 
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`w-72 md:w-80 lg:w-96 bg-gray-800 rounded-xl shadow-lg p-4 flex-shrink-0 flex flex-col ${snapshot.isDraggingOver ? "bg-gray-700/70" : ""}`}
                                        >
                                            <h2 className="text-xl font-semibold text-orange-400 mb-4 px-1 pb-2 border-b-2 border-orange-500/50">
                                                {status.nome} 
                                                <span className="text-sm text-gray-400 ml-2">
                                                    ({tasksByStatus[status.id.toString()]?.length || 0})
                                                </span>
                                            </h2>
                                            <div className="flex-grow min-h-[200px] space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                                {tasksByStatus[status.id.toString()]?.map((task, index) => (
                                                    <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                                        {(providedDraggable, snapshotDraggable) => (
                                                            <div
                                                                ref={providedDraggable.innerRef}
                                                                {...providedDraggable.draggableProps}
                                                                {...providedDraggable.dragHandleProps}
                                                                className={`p-3.5 rounded-lg shadow-md transition-all duration-150 ease-in-out ${getTaskCardColor(task.status_nome)} ${snapshotDraggable.isDragging ? "ring-2 ring-orange-500 shadow-2xl transform scale-105" : ""}`}
                                                            >
                                                                <h3 className="font-semibold text-gray-100 mb-1.5 text-md leading-tight">{task.nome}</h3>
                                                                {task.descricao && <p className="text-xs text-gray-300 mb-2 line-clamp-2">{task.descricao}</p>}
                                                                <div className="flex items-center justify-between text-xs text-gray-400">
                                                                    {task.data_prazo && 
                                                                        <span className="flex items-center">
                                                                            <FiClock className="mr-1" /> {new Date(task.data_prazo).toLocaleDateString("pt-BR")}
                                                                        </span>
                                                                    }
                                                                    {task.responsavel_nome && 
                                                                        <span className="flex items-center bg-gray-600/50 px-1.5 py-0.5 rounded">
                                                                            <FiUser className="mr-1" /> {task.responsavel_nome}
                                                                        </span>
                                                                    }
                                                                </div>
                                                                {task.tags && task.tags.length > 0 && (
                                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                                        {task.tags.map(tag => (
                                                                            <span key={tag} className="px-2 py-0.5 bg-gray-500/70 text-gray-300 rounded-full text-xs flex items-center">
                                                                                <FiTag className="mr-1 text-orange-400"/> {tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div className="mt-2.5 pt-2 border-t border-gray-600/50 flex items-center justify-end space-x-2">
                                                                    <Link href={`/projects/${projectId}/tasks/${task.id}/edit`} className="text-gray-400 hover:text-yellow-400" title="Editar Tarefa">
                                                                        <FiEdit2 size={15}/>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </div>
                    </div>
                </DragDropContext>
            </div>
        </AppLayout>
    );
}

