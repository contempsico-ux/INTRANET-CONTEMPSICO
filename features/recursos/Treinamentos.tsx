import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '../../App';
import { Card, Button, Modal, ConfirmationModal } from '../../components/UI';
import { Profile, TrainingMaterial, MaterialType } from '../../types';
import { getTrainings, addTraining, updateTraining, deleteTraining, uploadFile, deleteFile } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, SpinnerIcon, LinkIcon, XMarkIcon } from '../../components/Icons';

const Treinamentos: React.FC = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [trainings, setTrainings] = useState<TrainingMaterial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTraining, setEditingTraining] = useState<TrainingMaterial | null>(null);
    const [itemToDelete, setItemToDelete] = useState<TrainingMaterial | null>(null);

    const initialFormData = {
        title: '', description: '', type: MaterialType.Outro, url: '', filePath: '', category: '',
        file: null as File | null,
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getTrainings();
                setTrainings(data);
            } catch (err) {
                setError("Não foi possível carregar os treinamentos.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleOpenModal = (training: TrainingMaterial | null = null) => {
        setEditingTraining(training);
        if (training) {
            // FIX: Ensure filePath is always a string, even if undefined in the training object, to match the state type.
            setFormData({ ...training, filePath: training.filePath || '', file: null });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        // Validation logic
        if (!formData.title || !formData.category) {
            addToast("Título e Categoria são obrigatórios.", "error");
            return;
        }
        
        // Ensure either a URL is provided, a file is being uploaded, or an existing URL is present
        if (!formData.url && !formData.file && !editingTraining?.url) {
            addToast("Por favor, adicione um link externo ou faça o upload de um arquivo.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            let url = formData.url;
            let filePath = editingTraining?.filePath || '';

            // Handle file upload if a new file is present
            if (formData.file) {
                // If there was an old file, delete it first
                if (editingTraining?.filePath) {
                    await deleteFile(editingTraining.filePath);
                }
                const { publicUrl, path } = await uploadFile(formData.file);
                url = publicUrl; // The uploaded file URL takes precedence
                filePath = path;
            } else if (!formData.url && editingTraining?.filePath) {
                 // Case where user clears the URL input and there was a file before
                 await deleteFile(editingTraining.filePath);
                 url = '';
                 filePath = '';
            }


            const trainingData = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                category: formData.category,
                url,
                filePath
            };
            
            const apiCall = editingTraining
                ? updateTraining({ ...editingTraining, ...trainingData })
                : addTraining(trainingData);

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 25000) // 25-second timeout
            );
      
            const result = await Promise.race([apiCall, timeoutPromise]);
            
            let successMessage = '';
            if (editingTraining) {
                setTrainings(trainings.map(t => t.id === result.id ? result : t));
                successMessage = "Treinamento atualizado!";
            } else {
                setTrainings([result, ...trainings]);
                successMessage = "Treinamento adicionado!";
            }
            
            setIsModalOpen(false);
            addToast(successMessage, "success");

        } catch (err) {
            console.error("Save training failed:", err);
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
            if (itemToDelete.filePath) {
                await deleteFile(itemToDelete.filePath);
            }
            await deleteTraining(itemToDelete.id);
            setTrainings(trainings.filter(t => t.id !== itemToDelete.id));
            addToast("Treinamento excluído.", "success");
        } catch (e) {
            addToast("Falha ao excluir.", "error");
        } finally {
            setIsSubmitting(false);
            setItemToDelete(null);
        }
    };
    
    const groupedTrainings = trainings.reduce((acc: Record<string, TrainingMaterial[]>, item) => {
        const category = item.category || "Sem Categoria";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center p-8"><SpinnerIcon className="w-8 h-8 text-primary" /></div>;
        if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;
        if (Object.keys(groupedTrainings).length === 0) {
            return <div className="text-center text-gray-500 p-4">Nenhum material de treinamento adicionado.</div>;
        }

        return (
            <div className="space-y-6">
                {Object.keys(groupedTrainings).sort().map((category) => (
                    <div key={category}>
                        <h4 className="text-lg font-bold text-primary mb-2 pb-1 border-b-2 border-primary">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groupedTrainings[category].map(t => (
                                <Card key={t.id} className="relative flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-lg pr-20">{t.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                                    </div>
                                    <div className="mt-4">
                                        <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary-dark transition-colors">
                                            Acessar material
                                        </a>
                                    </div>
                                    {currentUser?.profile === Profile.Gestao && (
                                        <div className="absolute top-4 right-4 flex space-x-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(t)}><PencilIcon className="w-4 h-4"/></Button>
                                            <Button variant="danger" size="sm" onClick={() => setItemToDelete(t)}><TrashIcon className="w-4 h-4"/></Button>
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
                <h3 className="text-2xl font-semibold text-gray-800">Treinamentos</h3>
                {currentUser?.profile === Profile.Gestao && <Button onClick={() => handleOpenModal()}><PlusIcon className="w-4 h-4 mr-2" /> Adicionar</Button>}
            </div>
            {renderContent()}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTraining ? "Editar Treinamento" : "Adicionar Treinamento"}>
                <div className="space-y-4">
                    <input type="text" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-md" />
                    <input type="text" placeholder="Categoria" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded-md" />
                    <textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full p-2 border rounded-md"></textarea>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                        <p className="text-xs text-gray-500 mb-2">Forneça um link externo ou faça o upload de um arquivo.</p>
                        
                        <input
                            type="url"
                            placeholder="https://exemplo.com"
                            value={formData.url}
                            onChange={e => setFormData({...formData, url: e.target.value, file: null})} // Clear file if URL is typed
                            disabled={!!formData.file}
                            className="w-full p-2 border rounded-md mb-2 disabled:bg-gray-200"
                        />
                        
                        <div className="text-center my-2 text-xs text-gray-400 font-semibold">OU</div>

                         {formData.file ? (
                             <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md text-sm">
                                <span className="text-green-800 truncate">{formData.file.name}</span>
                                <button onClick={() => setFormData(prev => ({...prev, file: null}))} className="text-red-500 hover:text-red-700">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                             <input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFormData(prev => ({ ...prev, file: file, url: '' })); // Clear URL if file is chosen
                                }}
                                disabled={!!formData.url && !editingTraining?.filePath}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer disabled:opacity-50"
                            />
                        )}
                    </div>

                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as MaterialType})} className="w-full p-2 border rounded-md bg-white">
                        <option value={MaterialType.Outro}>Outro</option>
                        <option value={MaterialType.Video}>Vídeo</option>
                        <option value={MaterialType.PDF}>PDF</option>
                    </select>

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
                message={<>Tem certeza que deseja excluir o treinamento <strong>"{itemToDelete?.title}"</strong>?</>}
                isConfirming={isSubmitting}
            />
        </div>
    );
};

export default Treinamentos;