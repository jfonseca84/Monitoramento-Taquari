import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const ContactView: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
      setSent(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-fade-in">
      
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 border rounded-3xl p-8 shadow-2xl transition-colors">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-2">Contato e Suporte Técnico</h2>
        <p className="text-xs dark:text-slate-400 text-slate-600 mb-6">
          Envie dúvidas, comunicados oficiais ou sugestões para a equipe do Centro de Monitoramento.
        </p>

        {sent ? (
          <div className="dark:bg-emerald-950/80 bg-emerald-50 dark:border-emerald-800 border-emerald-300 border p-6 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold dark:text-white text-slate-900">Mensagem Enviada!</h3>
            <p className="text-xs dark:text-emerald-300 text-emerald-800">Agradecemos o contato. Sua mensagem foi encaminhada à equipe do portal.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-300 rounded-xl px-3.5 py-2.5 dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-300 rounded-xl px-3.5 py-2.5 dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1">Mensagem</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-300 rounded-xl px-3.5 py-2.5 dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Mensagem</span>
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
