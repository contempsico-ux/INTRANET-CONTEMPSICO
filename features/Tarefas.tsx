import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useAuth, useToast } from '../App';
import { getTasks, addTask, updateTask, deleteTask, getAssignableUsers, uploadFile, deleteFile } from '../services/api';
import { User, Task, TaskStatus, TaskPriority, TaskType, Profile, Subtask } from '../types';
import { Card, Button, Modal, ConfirmationModal } from '../components/UI';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArchiveBoxIcon, SpinnerIcon, ExclamationTriangleIcon, ListBulletIcon, XMarkIcon, LinkIcon } from '../components/Icons';

const statusColors: { [key in TaskStatus]: string } = {
  [TaskStatus.Pendente]: 'bg-yellow-200 text-yellow-800',
  [TaskStatus.EmAndamento]: 'bg-blue-200 text-blue-800',
  [TaskStatus.Concluida]: 'bg-green-200 text-green-800',
  [TaskStatus.Arquivada]: 'bg-gray-200 text-gray-800',
};

const priorityDisplay: { [key in TaskPriority]: { text: string; bg: string; border: string } } = {
    [TaskPriority.Alta]: { text: 'text-red-800', bg: 'bg-red-200', border: 'border-red-500' },
    [TaskPriority.Media]: { text: 'text-yellow-800', bg: 'bg-yellow-200', border: 'border-yellow-500' },
    [TaskPriority.Baixa]: { text: 'text-green-800', bg: 'bg-green-200', border: 'border-green-500' },
};

const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(url);
};


interface TaskCardProps {
    task: Task;
    onDetails: (task: Task) => void;
    assignableUsers: User[];
}

const TaskCard: React.FC<TaskCardProps> = memo(({ task, onDetails, assignableUsers }) => {
    const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.status !== TaskStatus.Concluida;
    const assignedUsers = assignableUsers.filter(u => task.assignedTo?.includes(u.id));
    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;

    const priorityBackgrounds: { [key in TaskPriority]: string } = {
        [TaskPriority.Alta]: 'bg-red-50',
        [TaskPriority.Media]: 'bg-yellow-50',
        [TaskPriority.Baixa]: 'bg-green-50',
    };

    return (
        <Card 
            className={`border-l-4 ${isOverdue ? `border-amber-500 bg-amber-50` : `${priorityDisplay[task.priority].border} ${priorityBackgrounds[task.priority]}`} transition-all duration-200`}
        >
            <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center space-x-2">
                    <p className="font-bold text-lg text-gray-800">{task.title}</p>
                    {isOverdue && task.status !== TaskStatus.Concluida && <span title="TAREFA ATRASADA"><ExclamationTriangleIcon className="w-6 h-6 text-amber-600"/></span>}
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    <p><strong>Criação:</strong> {new Date(task.creationDate).toLocaleDateString('pt-BR')}</p>
                    {task.conclusionDate && (
                       <p><strong>Finalização:</strong> {new Date(task.conclusionDate).toLocaleDateString('pt-BR')}</p>
                    )}
                    <p><strong>Tipo:</strong> {task.type}</p>
                </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>
                    {task.status}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityDisplay[task.priority].bg} ${priorityDisplay[task.priority].text}`}>
                    {task.priority}
                </span>
            </div>
            </div>
            <div className="mt-4 flex justify-between items-end">
                <div className="flex items-end space-x-4">
                    <div className="text-sm text-gray-600">
                        <p>Solicitante: {task.requester}</p>
                        {assignedUsers.length > 0 && <p>Atribuído a: <span className="font-semibold">{assignedUsers.map(u => u.name).join(', ')}</span></p>}
                    </div>
                     {totalSubtasks > 0 && (
                        <div className="flex items-center text-sm text-gray-500 pb-0.5" title="Progresso das subtarefas">
                            <ListBulletIcon className="w-5 h-5 mr-1" />
                            <span className="font-semibold">{completedSubtasks}/{totalSubtasks}</span>
                        </div>
                    )}
                </div>
                <Button size="sm" variant="secondary" onClick={() => onDetails(task)}>
                    <EyeIcon className="w-4 h-4 mr-1" /> Detalhes
                </Button>
            </div>
        </Card>
    );
});

const TABS = [
    { status: TaskStatus.Pendente, label: 'Pendentes' },
    { status: TaskStatus.EmAndamento, label: 'Em Andamento' },
    { status: TaskStatus.Concluida, label: 'Concluídas' },
    { status: TaskStatus.Arquivada, label: 'Arquivadas' },
];

const Tarefas: React.FC = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [activeTab, setActiveTab] = useState<TaskStatus>(TaskStatus.Pendente);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('all');
    const [assigneeSearch, setAssigneeSearch] = useState('');
    
    const initialNewTaskState = {
        title: '', description: '', type: TaskType.ExecutarTarefaRotina, priority: TaskPriority.Media,
        patientName: '',
        assignedTo: [] as string[],
        startDate: '', endDate: '',
        subtasks: [] as Subtask[],
        attachmentUrl: '', 
        attachmentPath: '',
        conclusionNotes: '',
        // Form-specific state
        attachmentFile: null as File | null,
        removeAttachment: false,
    };
    const [newTask, setNewTask] = useState(initialNewTaskState);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [tasksData, usersData] = await Promise.all([getTasks(), getAssignableUsers()]);
                setTasks(tasksData);
                setAssignableUsers(usersData);
            } catch (err) {
                setError("Não foi possível carregar os dados das tarefas.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const visibleTasks = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.profile === Profile.Gestao) return tasks;
        return tasks.filter(task => task.assignedTo?.includes(currentUser.id));
    }, [tasks, currentUser]);


    const finalFilteredTasks = useMemo(() => {
        return visibleTasks
            .filter(task => task.status === activeTab)
            .filter(task => {
                const matchesSearch = searchTerm === '' || 
                    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task.description.toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesAssignee = filterAssignee === 'all' || 
                    task.assignedTo?.includes(filterAssignee);

                return matchesSearch && matchesAssignee;
            });
    }, [visibleTasks, activeTab, searchTerm, filterAssignee]);
    
    const handleOpenCreateModal = () => {
        setEditingTask(null);
        setNewTask(initialNewTaskState);
        setAssigneeSearch('');
        setIsFormModalOpen(true);
    };
    
    const handleOpenEditModal = (task: Task) => {
        setEditingTask(task);
        setNewTask({
            title: task.title, description: task.description, type: task.type,
            priority: task.priority,
            patientName: task.patientName || '',
            assignedTo: task.assignedTo || [],
            startDate: task.startDate || '',
            endDate: task.endDate || '',
            subtasks: task.subtasks || [],
            attachmentUrl: task.attachmentUrl || '',
            attachmentPath: task.attachmentPath || '',
            conclusionNotes: task.conclusionNotes || '',
             // Form-specific state
            attachmentFile: null,
            removeAttachment: false,
        });
        setAssigneeSearch('');
        setIsDetailsModalOpen(false);
        setIsFormModalOpen(true);
    };

    const handleSaveTask = async () => {
        if (!currentUser) return;
        setIsSubmitting(true);
        try {
            // Use the URL directly from the input field
            const attachmentUrl = newTask.attachmentUrl || undefined;
            const attachmentPath = undefined; // Not used anymore

            const taskData = {
                title: newTask.title, description: newTask.description, type: newTask.type,
                priority: newTask.priority,
                patientName: newTask.type === TaskType.GestaoDocumentosPaciente ? newTask.patientName : undefined,
                assignedTo: newTask.assignedTo,
                startDate: newTask.startDate || undefined,
                endDate: newTask.endDate || undefined,
                subtasks: newTask.subtasks,
                conclusionNotes: newTask.conclusionNotes || undefined,
                attachmentUrl,
                attachmentPath,
            };

            let successMessage = '';
            if (editingTask) {
                const updated = await updateTask({ ...editingTask, ...taskData });
                setTasks(tasks.map(t => t.id === updated.id ? updated : t));
                successMessage = "Tarefa atualizada com sucesso!";
            } else {
                const addedTask = await addTask(taskData, currentUser);
                setTasks([addedTask, ...tasks]);
                successMessage = "Tarefa criada com sucesso!";
            }
            
            // FIX: Close modal and reset state BEFORE showing the toast.
            setIsFormModalOpen(false);
            setEditingTask(null);
            setNewTask(initialNewTaskState);
            addToast(successMessage, "success");

        } catch (err) {
            addToast("Não foi possível salvar a tarefa.", "error");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDetails = useCallback((task: Task) => {
        setCurrentTask(task);
        setIsDetailsModalOpen(true);
    }, []);
    
    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;
        
        // Delete file from storage first, then delete the task record
        if (taskToDelete.attachmentPath) {
            await deleteFile(taskToDelete.attachmentPath);
        }
        await deleteTask(taskToDelete.id);

        setTasks(tasks.filter(t => t.id !== taskToDelete.id));
        addToast("Tarefa excluída com sucesso.", "success");
        setIsDetailsModalOpen(false);
        setCurrentTask(null);
        setTaskToDelete(null);
    }
    
    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;

        const originalTasks = [...tasks];
        let updatedTask = { ...task, status: newStatus };

        if (newStatus === TaskStatus.Concluida && !task.conclusionDate) {
            updatedTask.conclusionDate = new Date().toISOString();
        } else if (newStatus !== TaskStatus.Concluida && task.conclusionDate) {
            updatedTask.conclusionDate = undefined;
        }
        
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
        if (currentTask?.id === taskId) {
            setCurrentTask(updatedTask);
        }

        try {
            await updateTask(updatedTask);
            addToast(`Status da tarefa alterado para "${newStatus}".`, "success");

            if (newStatus === TaskStatus.Arquivada) {
                setIsDetailsModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to update task status:", error);
            setTasks(originalTasks);
             if (currentTask?.id === taskId) {
                setCurrentTask(task);
            }
            addToast("Não foi possível atualizar o status.", "error");
        }
    };

    const handleAssigneeChange = (userId: string) => {
        setNewTask(prev => {
            const newAssignedTo = prev.assignedTo.includes(userId)
                ? prev.assignedTo.filter(id => id !== userId)
                : [...prev.assignedTo, userId];
            return { ...prev, assignedTo: newAssignedTo };
        });
    };
    
    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        const newSubtask: Subtask = {
            id: `sub-${Date.now()}`,
            title: newSubtaskTitle.trim(),
            completed: false,
        };
        setNewTask(prev => ({ ...prev, subtasks: [...prev.subtasks, newSubtask] }));
        setNewSubtaskTitle('');
    };

    const handleRemoveSubtask = (subtaskId: string) => {
        setNewTask(prev => ({ ...prev, subtasks: prev.subtasks.filter(st => st.id !== subtaskId) }));
    };

    const handleSubtaskToggle = async (subtaskId: string) => {
        if (!currentTask) return;
        const originalTask = { ...currentTask };
        const updatedSubtasks = currentTask.subtasks?.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        if (!updatedSubtasks) return;

        const updatedTask = { ...currentTask, subtasks: updatedSubtasks };
        
        setCurrentTask(updatedTask);
        setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));

        try {
            await updateTask(updatedTask);
            addToast("Subtarefa atualizada!", "success");
        } catch (error) {
            setCurrentTask(originalTask);
            setTasks(prevTasks => prevTasks.map(t => t.id === originalTask.id ? originalTask : t));
            addToast("Falha ao atualizar subtarefa.", "error");
            console.error(error);
        }
    };
    
    const renderNewTaskForm = () => (
        <div className="space-y-4">
            <input type="text" placeholder="Título da Tarefa" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full p-2 border rounded-md" />
            <textarea placeholder="Descrição detalhada" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} rows={3} className="w-full p-2 border rounded-md"></textarea>
            
            <div className="border-t pt-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Anexo</label>
                    {editingTask?.attachmentUrl && !newTask.removeAttachment && !newTask.attachmentFile ? (
                        <div className="flex items-center justify-between p-2 bg-gray-100 rounded-md text-sm">
                            <a href={editingTask.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex items-center">
                                <LinkIcon className="w-4 h-4 mr-2" />
                                {editingTask.attachmentUrl.split('/').pop()?.split('?')[0].substring(14) || 'Ver anexo existente'}
                            </a>
                            <Button size="sm" variant="secondary" onClick={() => setNewTask(prev => ({ ...prev, removeAttachment: true, attachmentFile: null }))}>
                                Substituir
                            </Button>
                        </div>
                    ) : (
                         <input
                            type="url"
                            placeholder="Cole o link do arquivo (Google Drive, Dropbox, etc.)"
                            value={newTask.attachmentUrl || ''}
                            onChange={(e) => setNewTask(prev => ({ ...prev, attachmentUrl: e.target.value }))}
                            className="w-full p-2 border rounded-md text-sm"
                        />
                    )}
                </div>
                <textarea placeholder="Relatório de Evolução/Finalização" value={newTask.conclusionNotes} onChange={e => setNewTask({...newTask, conclusionNotes: e.target.value})} rows={3} className="w-full p-2 border rounded-md"></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as TaskType})} className="w-full p-2 border rounded-md bg-white">
                    {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})} className="w-full p-2 border rounded-md bg-white">
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            {newTask.type === TaskType.GestaoDocumentosPaciente && <input type="text" placeholder="Nome do Paciente" value={newTask.patientName} onChange={e => setNewTask({...newTask, patientName: e.target.value})} className="w-full p-2 border rounded-md" />}
            
            <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Atribuir para:</label>
                <input 
                    type="text"
                    placeholder="Buscar responsável..."
                    value={assigneeSearch}
                    onChange={e => setAssigneeSearch(e.target.value)}
                    className="w-full p-2 border rounded-md mb-2"
                />
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-3">
                    {assignableUsers
                        .filter(user => user.name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                        .map(user => (
                            <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                               <input 
                                   type="checkbox"
                                   checked={newTask.assignedTo.includes(user.id)}
                                   onChange={() => handleAssigneeChange(user.id)}
                                   className="rounded text-primary focus:ring-primary"
                               />
                               <span>{user.name} ({user.profile})</span>
                           </label>
                        ))
                    }
                </div>
            </div>

            <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtarefas</label>
                <div className="flex space-x-2">
                    <input 
                        type="text" 
                        placeholder="Nova subtarefa"
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); }}}
                        className="flex-grow p-2 border rounded-md"
                    />
                    <Button type="button" variant="secondary" onClick={handleAddSubtask}>Adicionar</Button>
                </div>
                {newTask.subtasks.length > 0 && (
                    <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                        {newTask.subtasks.map(st => (
                            <li key={st.id} className="flex justify-between items-center text-sm p-1 bg-gray-50 rounded">
                                <span>{st.title}</span>
                                <button type="button" onClick={() => handleRemoveSubtask(st.id)} className="text-red-500 hover:text-red-700">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                    <input 
                        type="date" 
                        value={newTask.startDate || ''} 
                        onChange={e => setNewTask({...newTask, startDate: e.target.value, endDate: ''})} 
                        className="w-full p-2 border rounded-md" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                    <input 
                        type="date" 
                        value={newTask.endDate || ''} 
                        onChange={e => setNewTask({...newTask, endDate: e.target.value})} 
                        className="w-full p-2 border rounded-md" 
                        disabled={!newTask.startDate}
                        min={newTask.startDate}
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                <Button onClick={handleSaveTask} isLoading={isSubmitting}>{editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}</Button>
            </div>
        </div>
    );

    const renderTaskDetails = () => {
        if (!currentTask) return null;
        const assignedUsers = assignableUsers.filter(u => currentTask.assignedTo?.includes(u.id));
        const totalSubtasks = currentTask.subtasks?.length || 0;
        const completedSubtasks = currentTask.subtasks?.filter(st => st.completed).length || 0;
        const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="taskStatus" className="font-semibold text-gray-700">Status:</label>
                        <select
                            id="taskStatus"
                            value={currentTask.status}
                            onChange={(e) => handleStatusChange(currentTask.id, e.target.value as TaskStatus)}
                            className={`p-1 rounded-md text-sm font-semibold border-2 ${statusColors[currentTask.status].replace('bg-', 'border-').replace('-200', '-400')} focus:ring-primary`}
                            >
                            {Object.values(TaskStatus).filter(s => s !== TaskStatus.Arquivada).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-700">Prioridade:</span>
                        <span className={`px-2 py-1 text-sm font-bold rounded-full ${priorityDisplay[currentTask.priority].bg} ${priorityDisplay[currentTask.priority].text}`}>
                            {currentTask.priority}
                        </span>
                    </div>
                </div>
                <p><strong className="text-gray-600">Descrição:</strong> {currentTask.description}</p>
                {currentTask.patientName && <p><strong className="text-gray-600">Paciente:</strong> {currentTask.patientName}</p>}
                
                {currentTask.subtasks && currentTask.subtasks.length > 0 && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Subtarefas ({completedSubtasks}/{totalSubtasks})</h4>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {currentTask.subtasks.map(st => (
                                <li key={st.id}>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={st.completed}
                                            onChange={() => handleSubtaskToggle(st.id)}
                                            className="w-5 h-5 rounded text-primary focus:ring-primary focus:ring-2"
                                        />
                                        <span className={st.completed ? 'line-through text-gray-500' : ''}>
                                            {st.title}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {(currentTask.attachmentUrl || currentTask.conclusionNotes) && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold text-gray-700">Recursos & Relatórios</h4>
                    
                    {currentTask.attachmentUrl && (
                      <div>
                        <strong className="text-gray-600 block text-sm mb-1">Anexo:</strong>
                        {isImageUrl(currentTask.attachmentUrl) ? (
                            <div>
                                <a href={currentTask.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline mb-2">
                                    <LinkIcon className="w-5 h-5 mr-2" /> Abrir anexo em nova aba
                                </a>
                                <img 
                                    src={currentTask.attachmentUrl} 
                                    alt="Preview do anexo" 
                                    className="mt-2 max-w-full rounded-lg border object-contain" 
                                />
                            </div>
                        ) : (
                          <a href={currentTask.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                            <LinkIcon className="w-5 h-5 mr-2" /> Ver/Baixar Anexo
                          </a>
                        )}
                      </div>
                    )}

                    {currentTask.conclusionNotes && (
                      <div>
                        <strong className="text-gray-600 block text-sm">Relatório de Evolução/Finalização:</strong>
                        <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md mt-1 text-sm">{currentTask.conclusionNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 border-t pt-4 mt-4">
                    <p>
                        <strong className="text-gray-600">Atribuído a:</strong> 
                        {assignedUsers.length > 0 ? assignedUsers.map(u => u.name).join(', ') : ' Ninguém'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <p>
                            <strong className="text-gray-600 block text-sm">Data de Início:</strong>
                            {currentTask.startDate ? new Date(currentTask.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não definida'}
                        </p>
                        <p>
                            <strong className="text-gray-600 block text-sm">Data de Fim:</strong>
                            {currentTask.endDate ? new Date(currentTask.endDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não definida'}
                        </p>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <p>
                            <strong className="text-gray-600 block text-sm">Criado em:</strong>
                            {new Date(currentTask.creationDate).toLocaleString('pt-BR')}
                        </p>
                         <p>
                            <strong className="text-gray-600 block text-sm">Concluído em:</strong>
                            {currentTask.conclusionDate ? new Date(currentTask.conclusionDate).toLocaleString('pt-BR') : 'Não concluída'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                    <Button variant="secondary" onClick={() => handleStatusChange(currentTask.id, TaskStatus.Arquivada)}>
                        <ArchiveBoxIcon className="w-4 h-4 mr-1" /> Arquivar
                    </Button>
                    <div className="flex space-x-2">
                        <Button variant="secondary" onClick={() => handleOpenEditModal(currentTask)}><PencilIcon className="w-4 h-4 mr-1" /> Editar</Button>
                        {currentUser?.profile === Profile.Gestao && <Button variant="danger" onClick={() => setTaskToDelete(currentTask)}><TrashIcon className="w-4 h-4 mr-1" /> Excluir</Button>}
                    </div>
                </div>
            </div>
        )
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <SpinnerIcon className="h-8 w-8 mr-3 text-primary" />
                    Carregando tarefas...
                </div>
            );
        }

        if (error) {
            return <div className="text-center text-red-600 bg-red-50 p-4 rounded-md">{error}</div>;
        }

        if (finalFilteredTasks.length === 0) {
            return (
                <Card className="text-center text-gray-500 py-10 mt-6">
                  Nenhuma tarefa encontrada. Tente ajustar a busca ou os filtros.
                </Card>
            );
        }
        
        return (
            <div className="space-y-4 mt-6">
                {finalFilteredTasks.map(task => (
                    <TaskCard key={task.id} task={task} onDetails={handleOpenDetails} assignableUsers={assignableUsers} />
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primary">Acompanhamento de Tarefas</h1>
                <Button onClick={handleOpenCreateModal}><PlusIcon className="h-5 w-5 mr-2" /> Nova Tarefa</Button>
            </div>
            
            <div className="mb-4 border-b">
                <div className="flex space-x-2 -mb-px overflow-x-auto">
                    {TABS.map(tab => (
                        <button 
                            key={tab.status}
                            className={`py-2 px-4 font-semibold whitespace-nowrap ${activeTab === tab.status ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`} 
                            onClick={() => setActiveTab(tab.status)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                    type="text"
                    placeholder="Buscar por título ou descrição..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
                <select
                    value={filterAssignee}
                    onChange={e => setFilterAssignee(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white"
                >
                    <option value="all">Filtrar por Responsável</option>
                    {assignableUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            </div>

            {renderContent()}

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingTask ? "Editar Tarefa" : "Criar Nova Tarefa"}>
                {renderNewTaskForm()}
            </Modal>
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={currentTask?.title || ''}>
                {renderTaskDetails()}
            </Modal>
            <ConfirmationModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={<>Tem certeza que deseja excluir a tarefa <strong>"{taskToDelete?.title}"</strong>? Esta ação não pode ser desfeita.</>}
            />
        </div>
    );
};

export default Tarefas;