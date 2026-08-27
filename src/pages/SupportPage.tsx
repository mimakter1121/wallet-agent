import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  PlusCircle, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Building2,
  Clock,
  CheckCircle2,
  Sparkles,
  Bot
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { SupportTicket } from '../types';

export const SupportPage: React.FC = () => {
  const { tickets, createTicket, addTicketMessage, agent } = useApp();
  
  const [activeTab, setActiveTab] = useState<'tickets' | 'chat' | 'faq'>('tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [newReplyMessage, setNewReplyMessage] = useState('');

  // Create ticket state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<SupportTicket['category']>('Deposit Processing');
  const [newPriority, setNewPriority] = useState<SupportTicket['priority']>('medium');
  const [newMessageText, setNewMessageText] = useState('');

  // Live Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello Marcus, welcome to the 24/7 Agent Treasury Desk. How can we assist with your liquidity or clearance operations today?',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How fast are bKash / Nagad / Bank deposit requests settled?',
      a: 'As an authorized Agent, deposit requests submitted with valid transaction reference numbers are automatically routed to our automated clearing system and approved within 1 to 5 minutes.'
    },
    {
      q: 'What is the commission calculation formula for deposits and withdrawals?',
      a: 'Standard deposit clearing yields a 1.5% gross commission. Customer withdrawal disbursements yield 1.2%. Direct sub-agent volume yields an additional 0.5% perpetual override credited directly to your commission ledger.'
    },
    {
      q: 'How do I request a temporary or permanent daily volume increase?',
      a: 'Account tiers upgrade automatically based on your float: Tier 1 ($200 daily limit), Tier 2 ($1,000 daily limit), Tier 3 ($1,000+ Unlimited daily limit).'
    },
    {
      q: 'What should I do if a customer provides an incorrect bank account reference?',
      a: 'Navigate to the transaction ledger, open the transaction details, and click "Reject / Flag". If the transaction is still pending, the customer float is automatically preserved in your Available Balance.'
    }
  ];

  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyMessage.trim() || !activeTicket) return;

    addTicketMessage(activeTicket.id, newReplyMessage);
    setNewReplyMessage('');
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newMessageText) return;

    createTicket(newSubject, newCategory, newPriority, newMessageText);
    setShowCreateModal(false);
    setNewSubject('');
    setNewMessageText('');
  };

  const handleSendLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time }]);
    setChatInput('');

    setTimeout(() => {
      let botResponse = 'Our clearing ops specialists have logged your request and verified your Tier 3 status. Liquidity routing is operating normally.';
      if (userText.toLowerCase().includes('limit') || userText.toLowerCase().includes('increase')) {
        botResponse = 'For daily limit adjustments, your tier updates automatically when float is added: Tier 1 ($200), Tier 2 ($1,000), Tier 3 (Unlimited).';
      } else if (userText.toLowerCase().includes('wire') || userText.toLowerCase().includes('deposit')) {
        botResponse = 'Deposit clearance is processed continuously 24/7. Verified TRC20 and Mobile Money transactions clear within 5 minutes.';
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 text-white">
      
      {/* Top Banner */}
      <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Agent Support & Help Desk
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              24/7 Priority Agent Ops assistance, dispute resolution, and automated settlement help
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-950/50 active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#233763] pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'tickets'
              ? 'bg-[#00c853] text-white shadow'
              : 'bg-[#121e3d] text-slate-300 border border-[#233763] hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Support Tickets ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'chat'
              ? 'bg-[#00c853] text-white shadow'
              : 'bg-[#121e3d] text-slate-300 border border-[#233763] hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-[#00b0ff]" />
          <span>Live Treasury Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'faq'
              ? 'bg-[#00c853] text-white shadow'
              : 'bg-[#121e3d] text-slate-300 border border-[#233763] hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Frequently Asked Questions</span>
        </button>
      </div>

      {/* Tab 1: Support Tickets List & Detail Thread */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Ticket List (1 Col) */}
          <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-5 shadow-card space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Active Inquiries
            </h3>

            <div className="space-y-2">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTicket?.id === ticket.id
                      ? 'bg-[#00c853]/20 border-[#00c853]/50 shadow-sm'
                      : 'bg-[#1a294e] border-[#233763] hover:bg-[#233763]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-black text-white">
                      {ticket.id}
                    </span>
                    <StatusBadge status={ticket.status} size="sm" />
                  </div>
                  <div className="font-bold text-xs text-white line-clamp-1">
                    {ticket.subject}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between font-medium">
                    <span>{ticket.category}</span>
                    <span className="font-mono text-slate-400">{ticket.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Detail & Reply Thread (2 Cols) */}
          <div className="lg:col-span-2 bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card flex flex-col h-[560px]">
            {activeTicket ? (
              <>
                {/* Header */}
                <div className="pb-4 border-b border-[#233763] flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-black text-xs text-[#00c853]">
                        {activeTicket.id}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-bold text-slate-300">
                        {activeTicket.category}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white">
                      {activeTicket.subject}
                    </h3>
                  </div>
                  <StatusBadge status={activeTicket.status} />
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {activeTicket.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 px-1 font-mono font-medium">
                        {msg.senderName} • {msg.timestamp}
                      </div>
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed font-medium ${
                          msg.sender === 'agent'
                            ? 'bg-[#00c853] text-white rounded-tr-none shadow-md shadow-emerald-950/50'
                            : 'bg-[#1a294e] text-white rounded-tl-none border border-[#233763]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                <form onSubmit={handleSendTicketReply} className="pt-3 border-t border-[#233763] flex gap-2">
                  <input
                    type="text"
                    value={newReplyMessage}
                    onChange={(e) => setNewReplyMessage(e.target.value)}
                    placeholder="Type reply to treasury analyst..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder-slate-400 text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#00c853] hover:bg-[#00e676] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-bold">
                Select a ticket to view message thread
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Chat */}
      {activeTab === 'chat' && (
        <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card max-w-2xl mx-auto h-[550px] flex flex-col">
          <div className="pb-3 border-b border-[#233763] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  Treasury Desk Automated Assistant
                </h3>
                <div className="text-[10px] text-[#00c853] flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
                  <span>Instant Response Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                    msg.sender === 'user'
                      ? 'bg-[#00c853] text-white rounded-tr-none shadow-md shadow-emerald-950/50'
                      : 'bg-[#1a294e] text-white rounded-tl-none border border-[#233763]'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{msg.time}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendLiveChat} className="pt-3 border-t border-[#233763] flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about clearing rails, commission rates, or limits..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white placeholder-slate-400 text-xs font-bold focus:outline-none focus:border-[#00c853]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#00c853] hover:bg-[#00e676] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-950/50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: FAQs */}
      {activeTab === 'faq' && (
        <div className="bg-[#121e3d] border border-[#233763] rounded-3xl p-6 shadow-card max-w-3xl mx-auto space-y-4">
          <h3 className="text-sm font-black text-white mb-2">
            Frequently Asked Questions by Verified Agents
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#233763] overflow-hidden bg-[#1a294e]"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-black text-white"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === index ? <ChevronUp className="w-4 h-4 text-[#00c853]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {openFaqIndex === index && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-[#233763] pt-3 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
          <div className="bg-[#121e3d] border border-[#233763] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp text-white">
            <div className="px-6 py-4 border-b border-[#233763] flex items-center justify-between bg-[#0a1128]">
              <h3 className="text-sm font-black text-white">
                Log New Support Inquiry
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Clearance delay on batch #4401"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-bold">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  >
                    <option value="Deposit Processing" className="bg-[#121e3d]">Deposit Processing</option>
                    <option value="Withdrawal Issue" className="bg-[#121e3d]">Withdrawal Issue</option>
                    <option value="KYC & Limits" className="bg-[#121e3d]">KYC & Limits</option>
                    <option value="Commission Claim" className="bg-[#121e3d]">Commission Claim</option>
                    <option value="Technical / Security" className="bg-[#121e3d]">Technical / Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-bold focus:outline-none focus:border-[#00c853]"
                  >
                    <option value="low" className="bg-[#121e3d]">Low Priority</option>
                    <option value="medium" className="bg-[#121e3d]">Medium Priority</option>
                    <option value="high" className="bg-[#121e3d]">High / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Detailed Message</label>
                <textarea
                  rows={4}
                  required
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Describe your inquiry with relevant reference codes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-white text-xs font-medium focus:outline-none focus:border-[#00c853]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a294e] border border-[#233763] text-slate-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-white font-black shadow-md shadow-emerald-950/50"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
