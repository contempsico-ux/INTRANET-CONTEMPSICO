import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useToast } from '../App';
import { Card, Button, Modal } from '../components/UI';
import { getAnnouncements, addAnnouncement, getTasks } from '../services/api';
import { Announcement, Profile, Task, TaskStatus } from '../types';
import { PlusIcon, SpinnerIcon } from '../components/Icons';

interface MuralProps {
  setActivePage: (page: string) => void;
}

const Mural: React.FC<MuralProps> = ({ setActivePage }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', visibility: [Profile.Psicologo, Profile.Colaborador] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [announcementsData, tasksData] = await Promise.all([
          getAnnouncements(),
          getTasks()
        ]);
        setAnnouncements(announcementsData);
        setTasks(tasksData);
      } catch (err) {
        setError('Não foi possível carregar os dados do mural.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingTasksCount = useMemo(() => {
    if (!currentUser || currentUser.profile === Profile.Gestao) return 0;
    return tasks.filter(task => 
      task.assignedTo?.includes(currentUser.id) && task.status === TaskStatus.Pendente
    ).length;
  }, [tasks, currentUser]);

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.content) {
        addToast("Título e conteúdo são obrigatórios.", "error");
        return;
    }
    setIsSubmitting(true);
    try {
        const post: Omit<Announcement, 'id' | 'date' | 'author'> = {
            title: newPost.title,
            content: newPost.content,
            visibility: newPost.visibility,
        };
        const addedPost = await addAnnouncement(post);
        setAnnouncements([addedPost, ...announcements]);
        setIsModalOpen(false);
        setNewPost({ title: '', content: '', visibility: [Profile.Psicologo, Profile.Colaborador] });
        addToast("Postagem publicada com sucesso!", "success");
    } catch (err) {
        addToast("Falha ao criar postagem. Tente novamente.", "error");
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleVisibilityChange = (p: Profile) => {
    setNewPost(prev => {
        const newVisibility = prev.visibility.includes(p)
            ? prev.visibility.filter(v => v !== p)
            : [...prev.visibility, p];
        return {...prev, visibility: newVisibility};
    });
  };

  const visibleAnnouncements = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.profile === Profile.Gestao) {
      return announcements;
    }
    return announcements.filter(a => a.visibility.includes(currentUser.profile));
  }, [announcements, currentUser]);

  const renderTasksWidget = () => {
    if (!currentUser || isLoading || ![Profile.Colaborador, Profile.Psicologo].includes(currentUser.profile)) {
      return null;
    }
    
    const message = pendingTasksCount === 1
      ? "Você tem 1 tarefa pendente."
      : `Você tem ${pendingTasksCount} tarefas pendentes.`;
    
    const positiveMessage = "Você está em dia com suas tarefas!";

    return (
      <Card className="mb-6 bg-primary/5 border-l-4 border-primary">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-primary">Minhas Tarefas</h3>
            <p className="text-gray-600">{pendingTasksCount > 0 ? message : positiveMessage}</p>
          </div>
          <Button className="mt-4 md:mt-0" onClick={() => setActivePage('Tarefas')}>
            Ver Tarefas
          </Button>
        </div>
      </Card>
    );
  };


  const renderAnnouncements = () => {
    if (isLoading) {
      return (
        <Card className="text-center text-gray-500 py-10">
          <div className="flex justify-center items-center">
            <SpinnerIcon className="h-6 w-6 mr-3" />
            Carregando recados...
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="text-center text-red-600 bg-red-50 py-10">
          {error}
        </Card>
      );
    }

    if (visibleAnnouncements.length === 0) {
      return (
        <Card className="text-center text-gray-500 py-10">
          Nenhum recado no mural para você no momento.
        </Card>
      );
    }
    
    return visibleAnnouncements.map(post => (
      <Card key={post.id}>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{post.title}</h2>
          <p className="text-sm text-gray-500 mb-2">
            Por {post.author} em {new Date(post.date).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
           {currentUser?.profile === Profile.Gestao && <div className="text-xs text-gray-400 mt-2">Visível para: {post.visibility.join(', ')}</div>}
        </div>
      </Card>
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Mural de Recados</h1>
        {currentUser?.profile === Profile.Gestao && (
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Nova Postagem
          </Button>
        )}
      </div>

      {renderTasksWidget()}
      
      <div className="space-y-6">
        {renderAnnouncements()}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Postagem no Mural">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Título"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            className="w-full p-2 border rounded-md"
          />
          <textarea
            placeholder="Conteúdo"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            rows={5}
            className="w-full p-2 border rounded-md"
          ></textarea>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visível para:</label>
              <div className="flex space-x-4">
                {[Profile.Psicologo, Profile.Colaborador].map(p => (
                   <label key={p} className="flex items-center space-x-2">
                       <input 
                           type="checkbox"
                           checked={newPost.visibility.includes(p)}
                           onChange={() => handleVisibilityChange(p)}
                           className="rounded text-primary focus:ring-primary"
                       />
                       <span>{p}</span>
                   </label>
                ))}
              </div>
           </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleAddPost} isLoading={isSubmitting}>Publicar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Mural;