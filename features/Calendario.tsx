import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '../App';
import { getCalendarEvents, addCalendarEvent } from '../services/api';
import { CalendarEvent, Profile } from '../types';
import { Card, Button, Modal } from '../components/UI';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, SpinnerIcon } from '../components/Icons';

const saoPauloHolidays = ['01-01', '01-25', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25']; // MM-DD

const Calendario: React.FC = () => {
    // FIX: Destructure currentUser from useAuth to access the user's profile.
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newEvent, setNewEvent] = useState({ title: '', status: 'Fechado' as 'Fechado' | 'Funcionamento Normal'});

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getCalendarEvents();
                setEvents(data);
            } catch (err) {
                setError("Não foi possível carregar os eventos do calendário.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();

    const handleAddEventClick = (day: number) => {
      // FIX: Use currentUser.profile to check for permissions.
      if (currentUser?.profile !== Profile.Gestao) return;
      const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setSelectedDate(dateStr);
      setIsModalOpen(true);
    };

    const handleSaveEvent = async () => {
      if (!selectedDate || !newEvent.title) {
        addToast("O título do evento é obrigatório.", "error");
        return;
      }
      setIsSubmitting(true);
      try {
        const event: Omit<CalendarEvent, 'id'> = {
          date: selectedDate,
          title: newEvent.title,
          status: newEvent.status,
        };
        const addedEvent = await addCalendarEvent(event);
        setEvents([...events, addedEvent]);
        setIsModalOpen(false);
        setNewEvent({ title: '', status: 'Fechado' });
        setSelectedDate(null);
        addToast("Evento salvo com sucesso!", "success");
      } catch (err) {
          addToast("Não foi possível salvar o evento.", "error");
          console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const renderCalendar = () => {
        if (isLoading) {
             return (
                <div className="col-span-7 flex justify-center items-center h-96">
                    <SpinnerIcon className="h-8 w-8 mr-3 text-primary" />
                    Carregando...
                </div>
            );
        }
        if (error) {
            return <div className="col-span-7 text-center text-red-600 bg-red-50 p-4 rounded-md">{error}</div>
        }

        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="border p-2 text-center bg-gray-50"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = new Date(year, currentDate.getMonth(), day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const monthDay = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isHoliday = saoPauloHolidays.includes(monthDay);
            const event = events.find(e => e.date === dateStr);

            let dayStatus: React.ReactNode = null;
            let bgColor = 'bg-white';
            if (event) {
                dayStatus = <span className={`text-xs font-bold ${event.status === 'Fechado' ? 'text-red-600' : 'text-green-600'}`}>{event.title}</span>;
                bgColor = event.status === 'Fechado' ? 'bg-red-100' : 'bg-green-100';
            } else if (isHoliday) {
                dayStatus = <span className="text-xs font-bold text-red-600">Feriado</span>;
                bgColor = 'bg-red-100';
            } else if (isWeekend) {
                dayStatus = <span className="text-xs font-bold text-red-600">Fechado</span>;
                bgColor = 'bg-red-100';
            }

            days.push(
                <div key={day} 
                    // FIX: Use currentUser.profile to check for permissions.
                    className={`border p-2 text-center h-24 flex flex-col justify-start items-center space-y-1 pt-3 ${currentUser?.profile === Profile.Gestao ? 'cursor-pointer' : ''} hover:bg-gray-100 transition-colors ${bgColor}`}
                    onClick={() => handleAddEventClick(day)}
                    >
                    <span className="font-semibold text-gray-800">{day}</span>
                    {dayStatus}
                </div>
            );
        }
        return days;
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6">Calendário</h1>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <Button variant="secondary" onClick={() => changeMonth(-1)}><ChevronLeftIcon className="h-5 w-5" /></Button>
                    <h2 className="text-2xl font-bold text-gray-700 capitalize">{monthName} {year}</h2>
                    <Button variant="secondary" onClick={() => changeMonth(1)}><ChevronRightIcon className="h-5 w-5" /></Button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="font-bold text-center text-gray-600 p-2">{day}</div>
                    ))}
                    {renderCalendar()}
                </div>
                 <div className="mt-4 text-xs text-gray-500 text-center">
                    {/* FIX: Use currentUser.profile to check for permissions. */}
                    {currentUser?.profile === Profile.Gestao ? 'Clique em um dia para adicionar um evento.' : ''}
                </div>
            </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adicionar Evento para ${selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}`}>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Título do Evento (ex: Manutenção)"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="w-full p-2 border rounded-md"
                    />
                    <select
                        value={newEvent.status}
                        onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as any })}
                        className="w-full p-2 border rounded-md bg-white"
                    >
                        <option value="Fechado">Fechado</option>
                        <option value="Funcionamento Normal">Funcionamento Normal</option>
                    </select>
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleSaveEvent} isLoading={isSubmitting}>Salvar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Calendario;