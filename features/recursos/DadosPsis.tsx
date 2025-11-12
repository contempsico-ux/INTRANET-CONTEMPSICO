import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '../../App';
import { Card, Button, Modal, ConfirmationModal } from '../../components/UI';
import { Profile, Psychologist } from '../../types';
import { getPsychologists, addPsychologist, updatePsychologist, deletePsychologist } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, SpinnerIcon, EyeIcon, ArrowDownTrayIcon } from '../../components/Icons';

const initialFormData = { name: '', crp: '', phone: '', email: '', specialty: '', cpf: '', graduationUniversity: '', specializationUniversity: '', theoreticalApproach: '' };
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DadosPsis: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [selectedPsi, setSelectedPsi] = useState<Psychologist | null>(null);
  const [editingPsi, setEditingPsi] = useState<Psychologist | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Psychologist | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const fetchPsis = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPsychologists();
        setPsychologists(data);
      } catch (err) {
        setError("Não foi possível carregar os dados dos psicólogos.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPsis();
  }, []);

  const canEdit = currentUser?.profile === Profile.Gestao || currentUser?.profile === Profile.Colaborador;

  const handleOpenFormModal = (psi: Psychologist | null = null) => {
    setEditingPsi(psi);
    setFormData(psi ? { ...psi } : initialFormData);
    setEmailError('');
    setIsDetailsModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailsModal = (psi: Psychologist) => {
    setSelectedPsi(psi);
    setIsDetailsModalOpen(true);
  }

  const validateEmail = (email: string) => {
    if (!emailRegex.test(email)) {
        setEmailError('Por favor, insira um formato de email válido.');
        return false;
    }
    setEmailError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateEmail(formData.email)) {
        addToast("Formato de email inválido.", "error");
        return;
    }
    setIsSubmitting(true);
    try {
      const apiCall = editingPsi
        ? updatePsychologist({ ...editingPsi, ...formData })
        : addPsychologist(formData);
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 25000) // 25-second timeout
      );

      const result = await Promise.race([apiCall, timeoutPromise]);

      if (editingPsi) {
        setPsychologists(psychologists.map(p => p.id === result.id ? result : p));
        addToast("Dados atualizados!", "success");
      } else {
        setPsychologists([result, ...psychologists]);
        addToast("Psicólogo(a) adicionado(a)!", "success");
      }
      setIsFormModalOpen(false);
    } catch (err) {
      console.error("Save psychologist failed:", err);
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
        await deletePsychologist(itemToDelete.id);
        setPsychologists(psychologists.filter(p => p.id !== itemToDelete.id));
        addToast("Registro excluído.", "success");
    } catch (e) {
        addToast("Falha ao excluir.", "error");
    } finally {
        setIsSubmitting(false);
        setItemToDelete(null);
    }
  };

  const handleDownload = () => {
    if (psychologists.length === 0) {
      addToast("Não há dados para baixar.", "error");
      return;
    }
  
    const headers = [
        "Nome", "CRP", "CPF", "Telefone", "Email", 
        "Especialidade", "IES Graduação", "IES Especialização", "Abordagem Teórica"
    ];
    const escapeCSV = (str: string | number) => `"${String(str).replace(/"/g, '""')}"`;
  
    const csvRows = [headers.join(',')];
  
    psychologists.forEach(psi => {
      const row = [
        escapeCSV(psi.name),
        escapeCSV(psi.crp),
        escapeCSV(psi.cpf),
        escapeCSV(psi.phone),
        escapeCSV(psi.email),
        escapeCSV(psi.specialty),
        escapeCSV(psi.graduationUniversity),
        escapeCSV(psi.specializationUniversity),
        escapeCSV(psi.theoreticalApproach),
      ];
      csvRows.push(row.join(','));
    });
  
    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'dados_psicologos_contempsico.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast("Download da tabela iniciado!", "success");
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center p-8"><SpinnerIcon className="w-8 h-8 text-primary mr-3" /> Carregando...</div>;
    }

    if (error) {
      return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {psychologists.map(psi => (
          <Card key={psi.id} className="flex flex-col">
            <div className="flex-grow">
              <h4 className="text-lg font-bold text-primary">{psi.name}</h4>
              <p className="text-sm text-gray-600">CRP: {psi.crp}</p>
              <p className="text-sm text-gray-500 mt-1">{psi.specialty}</p>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <Button variant="secondary" size="sm" onClick={() => handleOpenDetailsModal(psi)}>
                <EyeIcon className="w-4 h-4 mr-1" /> Ver Detalhes
              </Button>
              {canEdit && (
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleOpenFormModal(psi)}><PencilIcon className="w-4 h-4"/></Button>
                  {currentUser?.profile === Profile.Gestao && <Button variant="danger" size="sm" onClick={() => setItemToDelete(psi)}><TrashIcon className="w-4 h-4"/></Button>}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const renderDetailsModal = () => {
    if (!selectedPsi) return null;
    return (
        <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={selectedPsi.name}>
            <div className="space-y-4 text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <p><strong>CRP:</strong> {selectedPsi.crp}</p>
                    <p><strong>CPF:</strong> {selectedPsi.cpf}</p>
                    <p><strong>Telefone:</strong> {selectedPsi.phone}</p>
                    <p><strong>Email:</strong> {selectedPsi.email}</p>
                </div>
                <div className="border-t pt-3">
                    <p className="col-span-full"><strong>Especialidade:</strong> {selectedPsi.specialty}</p>
                </div>
                <div className="border-t pt-3">
                    <p><strong>IES Graduação:</strong> {selectedPsi.graduationUniversity}</p>
                    <p><strong>IES Especialização:</strong> {selectedPsi.specializationUniversity}</p>
                </div>
                 <div className="border-t pt-3">
                    <p><strong>Abordagem Teórica:</strong></p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md mt-1">{selectedPsi.theoreticalApproach}</p>
                </div>
                {canEdit && (
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={() => handleOpenFormModal(selectedPsi)}>
                            <PencilIcon className="w-4 h-4 mr-2" /> Editar
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold text-gray-800">Dados dos Psicólogos</h3>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={handleDownload}>
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Baixar
          </Button>
          {canEdit && (
            <Button onClick={() => handleOpenFormModal()}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Adicionar Psicólogo(a)
            </Button>
          )}
        </div>
      </div>
      
      {renderContent()}
      
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingPsi ? "Editar Dados" : "Adicionar Psicólogo(a)"}>
          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nome Completo" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="CRP" value={formData.crp} onChange={(e) => setFormData({ ...formData, crp: e.target.value })} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="CPF" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={formData.email} 
                    onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        validateEmail(e.target.value);
                    }} 
                    className={`w-full p-2 border rounded-md ${emailError ? 'border-red-500' : ''}`} 
                />
                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              </div>
              <input type="text" placeholder="Especialidade" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} className="w-full p-2 border rounded-md" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="IES Graduação" value={formData.graduationUniversity} onChange={(e) => setFormData({ ...formData, graduationUniversity: e.target.value })} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="IES Especialização" value={formData.specializationUniversity} onChange={(e) => setFormData({ ...formData, specializationUniversity: e.target.value })} className="w-full p-2 border rounded-md" />
              </div>
               <textarea placeholder="Abordagem Teórica (Resumo)" value={formData.theoreticalApproach} onChange={(e) => setFormData({ ...formData, theoreticalApproach: e.target.value })} rows={4} className="w-full p-2 border rounded-md"></textarea>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                  <Button variant="secondary" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                  <Button onClick={handleSave} isLoading={isSubmitting}>Salvar</Button>
              </div>
          </div>
      </Modal>

      {renderDetailsModal()}
      
      <ConfirmationModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão"
          message={<>Tem certeza que deseja excluir o registro de <strong>{itemToDelete?.name}</strong>?</>}
          isConfirming={isSubmitting}
      />
    </div>
  );
};

export default DadosPsis;