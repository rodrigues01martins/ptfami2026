// No useState do activeTab:
const [activeTab, setActiveTab] = useState<'entry' | 'report' | 'relatorio'>('entry');

// No bloco dos botões de tab:
<button onClick={() => setActiveTab('relatorio')}
  className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'relatorio' ? 'bg-[#00735C] text-white shadow-lg' : 'bg-white text-[#00735C] border'}`}>
  Relatório Final
</button>

// No bloco de renderização, antes do fechamento do activeTab === 'report':
{activeTab === 'relatorio' && (
  <RelatorioFinal onBack={() => setActiveTab('entry')} />
)}
