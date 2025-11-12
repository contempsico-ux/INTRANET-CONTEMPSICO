import React, { useState, useEffect, useMemo } from 'react';
import { getTasks, getAssignableUsers } from '../../services/api';
// FIX: Module '"../../types"' has no exported member 'AssignableUser'. Replaced with User.
import { User, Profile, Task, TaskStatus, TaskType } from '../../types';
import { Card } from '../../components/UI';
import { SpinnerIcon } from '../../components/Icons';

interface ReportData {
  userId: string;
  name: string;
  profile: Profile;
  totalAssigned: number;
  totalCompleted: number;
  completedLate: number;
  errorTasks: number;
  recurrentErrorTasks: number;
}

const RelatorioProdutividade: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  // FIX: Changed state type from AssignableUser[] to User[] to match API response.
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [tasksData, usersData] = await Promise.all([getTasks(), getAssignableUsers()]);
        setTasks(tasksData);
        // FIX: Removed 'as any' cast as usersData is of type User[] which matches the state.
        setUsers(usersData);
      } catch (err) {
        setError("Não foi possível carregar os dados para o relatório.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const reportData = useMemo<ReportData[]>(() => {
    if (isLoading || error) return [];

    const reportUsers = users.filter(u => u.profile !== Profile.Gestao);

    return reportUsers.map(user => {
      const assignedTasks = tasks.filter(t => t.assignedTo?.includes(user.id));
      const completedTasks = assignedTasks.filter(t => t.status === TaskStatus.Concluida);
      
      const completedLate = completedTasks.filter(t => 
        t.conclusionDate && t.endDate && new Date(t.conclusionDate) > new Date(t.endDate)
      ).length;

      const errorTasks = assignedTasks.filter(t => t.type === TaskType.ApontarErroProcedimento).length;
      const recurrentErrorTasks = assignedTasks.filter(t => t.type === TaskType.ApontarErroRecorrenteProcedimento).length;

      return {
        userId: user.id,
        name: user.name,
        profile: user.profile,
        totalAssigned: assignedTasks.length,
        totalCompleted: completedTasks.length,
        completedLate,
        errorTasks,
        recurrentErrorTasks,
      };
    });
  }, [tasks, users, isLoading, error]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center p-8"><SpinnerIcon className="w-8 h-8 text-primary" /> Carregando relatório...</div>;
    }

    if (error) {
      return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;
    }
    
    if (reportData.length === 0) {
        return <div className="text-center text-gray-500 p-4">Não há dados de colaboradores para exibir.</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tarefas</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concluídas</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concl. Atrasadas</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erros Apontados</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erros Recorrentes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((data) => (
              <tr key={data.userId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{data.name}</div>
                  <div className="text-sm text-gray-500">{data.profile}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.totalAssigned}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.totalCompleted}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={data.completedLate > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                        {data.completedLate}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.errorTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.recurrentErrorTasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Relatório de Produtividade</h3>
      <Card>
        {renderContent()}
      </Card>
    </div>
  );
};

export default RelatorioProdutividade;