import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '../../App';
import { Button, Modal, ConfirmationModal } from '../../components/UI';
import { Profile, RegulationSection } from '../../types';
import { getRegulations, addRegulation, updateRegulation, deleteRegulation } from '../../services/api';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon, SpinnerIcon } from '../../components/Icons';

const Regulamento: React.FC = () => {
    // FIX: Destructure currentUser from useAuth to access the user's profile.
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [regulations, setRegulations] = useState<RegulationSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<RegulationSection | null>(null);
    const [itemToDelete, setItemToDelete] = useState<RegulationSection | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '', visibility: [Profile.Colaborador, Profile.Psicologo] });

    const [openSection, setOpenSection] = useState<string | null>(null);

    const sortRegulations = (r: RegulationSection[]) => r.sort((a, b) => a.title.localeCompare(b.title));

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getRegulations();
                setRegulations(sortRegulations(data));
            } catch (err) {
                setError("Não foi possível carregar o regulamento.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleOpenModal = (section: RegulationSection | null = null) => {
        setEditingSection(section);
        setFormData(section ? { ...section } : { title: '', content: '', visibility: [Profile.Colaborador, Profile.Psicologo] });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            addToast("Título e conteúdo são obrigatórios.", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const apiCall = editingSection
                ? updateRegulation({ ...editingSection, ...formData })
                : addRegulation(formData);

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 25000) // 25-second timeout
            );

            const result = await Promise.race([apiCall, timeoutPromise]);

            if (editingSection) {
                setRegulations(prev => sortRegulations(prev.map(r => r.id === result.id ? result : r)));
                addToast("Seção atualizada!", "success");
            } else {
                setRegulations(prev => sortRegulations([result, ...prev]));
                addToast("Seção adicionada!", "success");
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Save regulation failed:", err);
            if (err instanceof Error && err.message === 'Timeout') {
                addToast("A operação está demorando mais que o esperado. Verifique sua conexão ou tente novamente em alguns instantes.", "error");
            } else {
                addToast("Falha ao salvar. Tente novamente.", "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteRegulation(itemToDelete.id);
            setRegulations(regulations.filter(r => r.id !== itemToDelete.id));
            addToast("Seção excluída.", "success");
        } catch (e) {
            addToast("Falha ao excluir.", "error");
        } finally {
            setIsSubmitting(false);
            setItemToDelete(null);
        }
    };

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center p-8"><SpinnerIcon className="w-8 h-8 text-primary" /></div>;
        if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;
        if (regulations.length === 0) {
            return <div className="text-center text-gray-500 p-4">Nenhuma seção do regulamento foi adicionada.</div>;
        }

        return (
            <div className="space-y-2">
                {regulations.map(r => (
                    <div key={r.id} className="border rounded-md">
                        <div className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                            <button onClick={() => setOpenSection(openSection === r.id ? null : r.id)} className="flex-grow text-left">
                                <span className="font-semibold text-gray-700">{r.title}</span>
                            </button>
                            <div className="flex items-center space-x-4">
                               {/* FIX: Use currentUser.profile to check for permissions. */}
                               {currentUser?.profile === Profile.Gestao && (
                                   <div className="flex space-x-2">
                                        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(r)}><PencilIcon className="w-4 h-4"/></Button>
                                        <Button variant="danger" size="sm" onClick={() => setItemToDelete(r)}><TrashIcon className="w-4 h-4"/></Button>
                                   </div>
                               )}
                                <button onClick={() => setOpenSection(openSection === r.id ? null : r.id)}>
                                    {openSection === r.id ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                                </button>
                            </div>
                        </div>
                        {openSection === r.id && <div className="p-4 bg-white"><p className="whitespace-pre-wrap">{r.content}</p></div>}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">Regulamento Interno</h3>
                {/* FIX: Use currentUser.profile to check for permissions. */}
                {currentUser?.profile === Profile.Gestao && <Button onClick={() => handleOpenModal()}><PlusIcon className="w-4 h-4 mr-2" /> Adicionar Seção</Button>}
            </div>
            {renderContent()}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSection ? "Editar Seção" : "Adicionar Seção"}>
                <div className="space-y-4">
                    <input type="text" placeholder="Título da Seção" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-md" />
                    <textarea placeholder="Conteúdo" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={8} className="w-full p-2 border rounded-md"></textarea>
                    {/* TODO: Adicionar seletor de visibilidade se necessário */}
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleSave} isLoading={isSubmitting}>Salvar</Button>
                    </div>
                </div>
            </Modal>
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={<>Tem certeza que deseja excluir a seção <strong>"{itemToDelete?.title}"</strong>?</>}
                isConfirming={isSubmitting}
            />
        </div>
    );
};

export default Regulamento;