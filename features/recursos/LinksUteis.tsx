import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useToast } from '../../App';
import { Card, Button, Modal, ConfirmationModal } from '../../components/UI';
import { Profile, UsefulLink } from '../../types';
import { getLinks, addLink, updateLink, deleteLink } from '../../services/api';
import { PlusIcon, LinkIcon, PencilIcon, TrashIcon, SpinnerIcon } from '../../components/Icons';

const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

const LinksUteis: React.FC = () => {
    // FIX: Destructure currentUser from useAuth to access the user's profile.
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [links, setLinks] = useState<UsefulLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<UsefulLink | null>(null);
    const [itemToDelete, setItemToDelete] = useState<UsefulLink | null>(null);
    const [formData, setFormData] = useState({ title: '', url: '', category: '', visibility: [Profile.Colaborador, Profile.Psicologo] });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getLinks();
                setLinks(data);
            } catch (err) {
                setError("Não foi possível carregar os links.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleOpenModal = (link: UsefulLink | null = null) => {
        setEditingLink(link);
        setFormData(link ? { ...link } : { title: '', url: '', category: '', visibility: [Profile.Colaborador, Profile.Psicologo] });
        setIsModalOpen(true);
    };

    const handleSave = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        console.log('handleSave called', { isSubmittingRef: isSubmittingRef.current });
        if (isSubmittingRef.current) {
            console.log('Already submitting, ignoring duplicate call');
            return;
        }
        isSubmittingRef.current = true;
        
        if (!formData.title || !formData.url || !formData.category) {
            addToast("Por favor, preencha todos os campos.", "error");
            isSubmittingRef.current = false;
            return;
        }
        if (!urlRegex.test(formData.url)) {
            console.log('URL validation failed:', formData.url);
            addToast("Por favor, insira uma URL válida (ex: https://site.com).", "error");
            isSubmittingRef.current = false;
            return;
        }

        console.log('Starting API call...');
        setIsSubmitting(true);
        try {
            const apiCall = editingLink
              ? updateLink({ ...editingLink, ...formData })
              : addLink(formData);
            console.log('API call created');
              
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 25000) // 25-second timeout
            );
      
            console.log('Waiting for result...');
            const result = await Promise.race([apiCall, timeoutPromise]);
            console.log('Result received:', result);

            if (editingLink) {
                setLinks(links.map(l => l.id === result.id ? result : l));
                addToast("Link atualizado!", "success");
            } else {
                setLinks([result, ...links]);
                addToast("Link adicionado!", "success");
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Save link failed:", err);
            if (err instanceof Error && err.message === 'Timeout') {
                addToast("Falha de comunicação: o servidor não respondeu a tempo. Por favor, contate o suporte.", "error");
            } else {
                addToast("Falha ao salvar. Tente novamente.", "error");
            }
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteLink(itemToDelete.id);
            setLinks(links.filter(l => l.id !== itemToDelete.id));
            addToast("Link excluído.", "success");
        } catch (e) {
            addToast("Falha ao excluir.", "error");
        } finally {
            setIsSubmitting(false);
            setItemToDelete(null);
        }
    };

    const groupedLinks = links.reduce((acc: Record<string, UsefulLink[]>, link) => {
        const category = link.category || "Outros";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(link);
        return acc;
    }, {});

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center p-8"><SpinnerIcon className="w-8 h-8 text-primary" /></div>;
        if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;
        if (Object.keys(groupedLinks).length === 0) {
            return <div className="text-center text-gray-500 p-4">Nenhum link útil adicionado.</div>;
        }

        return (
             <div className="space-y-6">
                {/* FIX: Use Object.keys to iterate over grouped items to avoid type inference issues with Object.entries. */}
                {Object.keys(groupedLinks).sort().map((category) => (
                    <div key={category}>
                        <h4 className="text-lg font-bold text-primary mb-2 pb-1 border-b-2 border-primary">{category}</h4>
                        <div className="space-y-2">
                            {groupedLinks[category].map(l => (
                                <Card key={l.id} className="py-3 px-4 flex justify-between items-center">
                                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-primary font-medium">
                                        <LinkIcon className="w-5 h-5 mr-3"/> {l.title}
                                    </a>
                                    {/* FIX: Use currentUser.profile to check for permissions. */}
                                    {currentUser?.profile === Profile.Gestao && (
                                        <div className="flex space-x-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(l)}><PencilIcon className="w-4 h-4"/></Button>
                                            <Button variant="danger" size="sm" onClick={() => setItemToDelete(l)}><TrashIcon className="w-4 h-4"/></Button>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">Links Úteis</h3>
                {/* FIX: Use currentUser.profile to check for permissions. */}
                {currentUser?.profile === Profile.Gestao && <Button onClick={() => handleOpenModal()}><PlusIcon className="w-4 h-4 mr-2" /> Adicionar Link</Button>}
            </div>
            {renderContent()}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLink ? "Editar Link" : "Adicionar Link"}>
                <div className="space-y-4">
                    <input type="text" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-md" />
                    <input type="text" placeholder="Categoria" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded-md" />
                    <input type="url" placeholder="URL Completa (ex: https://site.com)" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full p-2 border rounded-md" />
                    {/* TODO: Adicionar seletor de visibilidade se necessário */}
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="button" onClick={handleSave} disabled={isSubmitting} isLoading={isSubmitting}>Salvar</Button>
                    </div>
                </div>
            </Modal>
             <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={<>Tem certeza que deseja excluir o link <strong>"{itemToDelete?.title}"</strong>?</>}
                isConfirming={isSubmitting}
            />
        </div>
    );
};

export default LinksUteis;