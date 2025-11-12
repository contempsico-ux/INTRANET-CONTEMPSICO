import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useToast } from '../../App';
import { Card, Button, Modal, ConfirmationModal } from '../../components/UI';
import { Profile, ServicePrice } from '../../types';
import { getServices, addService, updateService, deleteService } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, SpinnerIcon, ArrowDownTrayIcon } from '../../components/Icons';

const TabelaPrecos: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServicePrice | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ServicePrice | null>(null);
  const [formData, setFormData] = useState({ serviceName: '', description: '', value: 0, visibility: [Profile.Colaborador, Profile.Psicologo] });
  
  const sortServices = (s: ServicePrice[]) => s.sort((a, b) => a.serviceName.localeCompare(b.serviceName));

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getServices();
        setServices(sortServices(data));
      } catch (err) {
        setError("Não foi possível carregar a tabela de preços.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);
  
  const handleOpenModal = (service: ServicePrice | null = null) => {
    setEditingService(service);
    setFormData(service ? { ...service } : { serviceName: '', description: '', value: 0, visibility: [Profile.Colaborador, Profile.Psicologo] });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.serviceName.trim() || formData.value <= 0) {
        addToast("Nome do serviço e valor (maior que zero) são obrigatórios.", "error");
        return;
    }
    setIsSubmitting(true);
    try {
      const apiCall = editingService
        ? updateService({ ...editingService, ...formData })
        : addService(formData);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 25000) // 25-second timeout
      );

      const result = await Promise.race([apiCall, timeoutPromise]);

      if (editingService) {
        setServices(prev => sortServices(prev.map(s => s.id === result.id ? result : s)));
        addToast("Serviço atualizado!", "success");
      } else {
        setServices(prev => sortServices([result, ...prev]));
        addToast("Serviço adicionado!", "success");
      }
       setIsModalOpen(false);
    } catch (err) {
      console.error("Save service failed:", err);
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
      await deleteService(itemToDelete.id);
      setServices(services.filter(s => s.id !== itemToDelete.id));
      addToast("Serviço excluído.", "success");
    } catch (e) {
      addToast("Falha ao excluir.", "error");
    } finally {
      setIsSubmitting(false);
      setItemToDelete(null);
    }
  };

  const visibleServices = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.profile === Profile.Gestao) return services;
    return services.filter(s => s.visibility.includes(currentUser.profile));
  }, [services, currentUser]);

  const handleVisibilityChange = (p: Profile) => {
    setFormData(prev => {
        const newVisibility = prev.visibility.includes(p)
            ? prev.visibility.filter(v => v !== p)
            : [...prev.visibility, p];
        return {...prev, visibility: newVisibility};
    });
  };

  const profilesForSelection = [Profile.Psicologo, Profile.Colaborador];
  const allSelected = profilesForSelection.length > 0 && profilesForSelection.every(p => formData.visibility.includes(p));

  const handleToggleAllVisibility = () => {
      setFormData(prev => {
          const allCurrentlySelected = profilesForSelection.every(p => prev.visibility.includes(p));
          return { ...prev, visibility: allCurrentlySelected ? [] : profilesForSelection };
      });
  };

  const handleDownload = () => {
    if (visibleServices.length === 0) {
      addToast("Não há dados para baixar.", "error");
      return;
    }
  
    const headers = ["Serviço", "Descrição", "Valor"];
    const escapeCSV = (str: string | number) => `"${String(str).replace(/"/g, '""')}"`;
  
    const csvRows = [headers.join(',')];
  
    visibleServices.forEach(service => {
      const row = [
        escapeCSV(service.serviceName),
        escapeCSV(service.description),
        String(service.value).replace('.', ',')
      ];
      csvRows.push(row.join(','));
    });
  
    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tabela_de_precos_contempsico.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast("Download da tabela iniciado!", "success");
  };
  
  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center p-8"><SpinnerIcon className="w-8 h-8 text-primary mr-3" /> Carregando...</div>;
    if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;
     if (visibleServices.length === 0) {
        return <div className="text-center text-gray-500 p-4">Nenhum serviço foi adicionado.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleServices.map(service => (
          <Card key={service.id} className="flex flex-col justify-between relative">
            <div>
              <h2 className="text-xl font-bold text-primary mb-2 pr-16">{service.serviceName}</h2>
              <p className="text-gray-600 text-sm mb-4">{service.description}</p>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200">
              <p className="text-3xl font-extrabold text-gray-800">
                {service.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            {currentUser?.profile === Profile.Gestao && (
              <div className="absolute top-4 right-4 flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleOpenModal(service)}><PencilIcon className="w-4 h-4"/></Button>
                  <Button variant="danger" size="sm" onClick={() => setItemToDelete(service)}><TrashIcon className="w-4 h-4"/></Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold text-gray-800">Tabela de Preços</h3>
        <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={handleDownload}>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Baixar
            </Button>
            {currentUser?.profile === Profile.Gestao && (
            <Button onClick={() => handleOpenModal()}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Serviço
            </Button>
            )}
        </div>
      </div>
      
       {renderContent()}

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "Editar Serviço" : "Adicionar Novo Serviço"}>
        <div className="space-y-4">
          <input type="text" placeholder="Nome do Serviço" value={formData.serviceName} onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })} className="w-full p-2 border rounded-md" />
          <textarea placeholder="Descrição" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full p-2 border rounded-md"></textarea>
          <input type="number" placeholder="Valor" value={formData.value <= 0 ? '' : formData.value} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded-md" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visível para:</label>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label key="todos" className="flex items-center space-x-2 font-semibold">
                    <input 
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleAllVisibility}
                        className="rounded text-primary focus:ring-primary"
                    />
                    <span>Todos</span>
                </label>
                {profilesForSelection.map(p => (
                   <label key={p} className="flex items-center space-x-2">
                       <input 
                           type="checkbox"
                           checked={formData.visibility.includes(p)}
                           onChange={() => handleVisibilityChange(p)}
                           className="rounded text-primary focus:ring-primary"
                       />
                       <span>{p}</span>
                   </label>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">A Gestão sempre tem acesso a todos os serviços.</p>
          </div>

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
          message={<>Tem certeza que deseja excluir o serviço <strong>"{itemToDelete?.serviceName}"</strong>?</>}
          isConfirming={isSubmitting}
      />
    </div>
  );
};

export default TabelaPrecos;