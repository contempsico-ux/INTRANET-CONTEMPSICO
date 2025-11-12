import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card } from '../components/UI';
import { Profile } from '../types';

import Treinamentos from './recursos/Treinamentos';
import Regulamento from './recursos/Regulamento';
import LinksUteis from './recursos/LinksUteis';
import DadosPsis from './recursos/DadosPsis';
import TabelaPrecos from './recursos/TabelaPrecos';
import RelatorioProdutividade from './recursos/RelatorioProdutividade';


const Recursos: React.FC = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('treinamentos');

    useEffect(() => {
      const restrictedTabsForCollab = ['dados-psis', 'tabela-precos'];
      const restrictedTabsForPsi = ['dados-psis', 'tabela-precos', 'relatorio-produtividade'];
      
      let currentRestrictedTabs: string[] = [];
      if (currentUser?.profile === Profile.Colaborador) {
        currentRestrictedTabs = restrictedTabsForCollab;
      } else if (currentUser?.profile === Profile.Psicologo) {
        currentRestrictedTabs = restrictedTabsForPsi;
      }

      // Se o perfil mudar para um que não pode ver a aba atual, volta para a primeira aba
      if (currentRestrictedTabs.includes(activeTab)) {
        setActiveTab('treinamentos');
      }
    }, [currentUser, activeTab]);

    const navItemClasses = (tabName: string) => 
      `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tabName ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;

    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6">Recursos</h1>
            <Card>
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setActiveTab('treinamentos')} className={navItemClasses('treinamentos')}>
                            Treinamentos
                        </button>
                        <button onClick={() => setActiveTab('regulamento')} className={navItemClasses('regulamento')}>
                            Regulamento Interno
                        </button>
                        <button onClick={() => setActiveTab('links')} className={navItemClasses('links')}>
                            Links Úteis
                        </button>
                        {currentUser?.profile && [Profile.Gestao, Profile.Colaborador].includes(currentUser.profile) && (
                           <>
                               <button onClick={() => setActiveTab('tabela-precos')} className={navItemClasses('tabela-precos')}>
                                   Tabela de Preços
                               </button>
                               <button onClick={() => setActiveTab('dados-psis')} className={navItemClasses('dados-psis')}>
                                   Dados Psis
                               </button>
                           </>
                        )}
                        {currentUser?.profile === Profile.Gestao && (
                           <button onClick={() => setActiveTab('relatorio-produtividade')} className={navItemClasses('relatorio-produtividade')}>
                               Relatório de Produtividade
                           </button>
                        )}
                    </nav>
                </div>
                <div>
                    <div hidden={activeTab !== 'treinamentos'}><Treinamentos /></div>
                    <div hidden={activeTab !== 'regulamento'}><Regulamento /></div>
                    <div hidden={activeTab !== 'links'}><LinksUteis /></div>
                    <div hidden={activeTab !== 'tabela-precos'}><TabelaPrecos /></div>
                    <div hidden={activeTab !== 'dados-psis'}><DadosPsis /></div>
                    <div hidden={activeTab !== 'relatorio-produtividade'}><RelatorioProdutividade /></div>
                </div>
            </Card>
        </div>
    );
};

export default Recursos;