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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!formData.serviceName.trim() || formData.value <= 0) {
        addToast("Nome do serviço e valor (maior que zero) são obrigatórios.", "error");
        return;
    }
    
    setIsSubmitting(true);
    try {
      const result = editingService
        ? await updateService({ ...editingService, ...formData })
        : await addService(formData);

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
      addToast("Falha ao salvar. Tente novamente.", "error");
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
  
  // Agrupar serviços que têm versão À vista, Parcelado e Pacote
  const groupedServices = useMemo(() => {
    const groups: { [key: string]: { base: string, aVista?: ServicePrice, parcelado?: ServicePrice, pacote?: ServicePrice, single?: ServicePrice } } = {};
    
    visibleServices.forEach(service => {
      const name = service.serviceName;
      
      // Remover numeração do início
      const cleanName = name.replace(/^\d+\.\s*/, '');
      
      if (cleanName.includes('(À vista)')) {
        const baseName = cleanName.replace(' (À vista)', '');
        if (!groups[baseName]) groups[baseName] = { base: baseName };
        groups[baseName].aVista = service;
      } else if (cleanName.includes('(Parcelado)')) {
        const baseName = cleanName.replace(' (Parcelado)', '');
        if (!groups[baseName]) groups[baseName] = { base: baseName };
        groups[baseName].parcelado = service;
      } else if (cleanName.includes('(Pacote)')) {
        const baseName = cleanName.replace(' (Pacote)', '');
        if (!groups[baseName]) groups[baseName] = { base: baseName };
        groups[baseName].pacote = service;
      } else {
        groups[cleanName] = { base: cleanName, single: service };
      }
    });
    
    return Object.values(groups);
  }, [visibleServices]);

  const [paymentModes, setPaymentModes] = useState<{ [key: string]: 'avulsa' | 'pacote' | 'aVista' | 'parcelado' }>({});

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center p-8"><SpinnerIcon className="w-8 h-8 text-primary mr-3" /> Carregando...</div>;
    if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;
    if (groupedServices.length === 0) {
        return <div className="text-center text-gray-500 p-4">Nenhum serviço foi adicionado.</div>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedServices.map((group, idx) => {
          // Detectar tipo de serviço
          const hasPaymentModes = group.aVista && group.parcelado; // Avaliações
          const hasPackageMode = group.pacote && group.single; // Psicoterapias
          
          let currentMode: string;
          let displayService: ServicePrice;
          
          if (hasPaymentModes) {
            currentMode = paymentModes[group.base] || 'aVista';
            displayService = currentMode === 'aVista' ? group.aVista! : group.parcelado!;
          } else if (hasPackageMode) {
            currentMode = paymentModes[group.base] || 'avulsa';
            displayService = currentMode === 'avulsa' ? group.single! : group.pacote!;
          } else {
            displayService = group.single!;
          }
          
          return (
            <Card key={displayService.id} className="flex flex-col justify-between relative">
              <div>
                <h2 className="text-xl font-bold text-primary mb-2 pr-16">
                  {group.base}
                </h2>
                <p className="text-gray-600 text-sm mb-4">{displayService.description}</p>
                
                {hasPaymentModes && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setPaymentModes(prev => ({ ...prev, [group.base]: 'aVista' }))}
                      className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${
                        currentMode === 'aVista'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      À vista
                    </button>
                    <button
                      onClick={() => setPaymentModes(prev => ({ ...prev, [group.base]: 'parcelado' }))}
                      className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${
                        currentMode === 'parcelado'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Parcelado
                    </button>
                  </div>
                )}
                
                {hasPackageMode && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setPaymentModes(prev => ({ ...prev, [group.base]: 'avulsa' }))}
                      className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${
                        currentMode === 'avulsa'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Avulsa
                    </button>
                    <button
                      onClick={() => setPaymentModes(prev => ({ ...prev, [group.base]: 'pacote' }))}
                      className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${
                        currentMode === 'pacote'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Pacote
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-4 border-t border-gray-200">
                <p className="text-3xl font-extrabold text-gray-800">
                  {displayService.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              {currentUser?.profile === Profile.Gestao && (
                <div className="absolute top-4 right-4 flex space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenModal(displayService)}><PencilIcon className="w-4 h-4"/></Button>
                    <Button variant="danger" size="sm" onClick={() => setItemToDelete(displayService)}><TrashIcon className="w-4 h-4"/></Button>
                </div>
              )}
            </Card>
          );
        })}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Nome do Serviço" 
            value={formData.serviceName} 
            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })} 
            className="w-full p-2 border rounded-md"
            disabled={isSubmitting}
          />
          <textarea 
            placeholder="Descrição" 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            rows={3} 
            className="w-full p-2 border rounded-md"
            disabled={isSubmitting}
          />
          <input 
            type="number" 
            placeholder="Valor" 
            value={formData.value <= 0 ? '' : formData.value} 
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} 
            className="w-full p-2 border rounded-md"
            disabled={isSubmitting}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visível para:</label>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label key="todos" className="flex items-center space-x-2 font-semibold">
                    <input 
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleAllVisibility}
                        className="rounded text-primary focus:ring-primary"
                        disabled={isSubmitting}
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
                           disabled={isSubmitting}
                       />
                       <span>{p}</span>
                   </label>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">A Gestão sempre tem acesso a todos os serviços.</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
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
