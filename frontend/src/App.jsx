import { useState } from 'react'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/search?q=${query}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Błąd wyszukiwania:", err);
    }
    setLoading(false);
  }

  const handleAnalyze = async (songUrl) => {
    setLoading(true);
    setResults([]); 
    setAnalysis(null); 
    
    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_url: songUrl })
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error("Błąd analizy:", err);
      setAnalysis({ error: "Błąd połączenia z serwerem" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-500">Rap Analyzer</h1>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Wpisz np. Taco Hemingway" 
            className="flex-1 p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSearch}
            className="bg-blue-600 px-6 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Szukaj
          </button>
        </div>

        {loading && <p className="text-center text-gray-400 my-4">Ładowanie...</p>}

        {/* Wyniki wyszukiwania */}
        {!loading && results.length > 0 && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {results.map((song) => (
              <div 
                key={song.id} 
                onClick={() => handleAnalyze(song.url)}
                className="flex items-center gap-4 p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0"
              >
                <img src={song.thumbnail} alt="cover" className="w-12 h-12 rounded" />
                <div>
                  <p className="font-bold">{song.title}</p>
                  <p className="text-sm text-gray-400">{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BŁĄD Z BACKENDU */}
        {analysis && analysis.error && !loading && (
          <div className="mt-8 bg-red-900/50 border border-red-500 p-4 rounded-lg text-center text-red-200">
            {analysis.error}
          </div>
        )}

        {/* SUKCES: Sekcja wyników */}
        {analysis && analysis.stats && !loading && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
            
            {/* NAGŁÓWEK Z ODZNAKĄ FLEXU */}
            <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-4">
              <h2 className="text-2xl font-bold">Wyniki analizy tekstu</h2>
              
              {/* Złota odznaka Flexu - wyświetla się z boku */}
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-1.5 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.1)]">
                <span className="text-yellow-400 font-bold text-sm uppercase tracking-wider">
                  Punkty Flexu
                </span>
                <span className="bg-yellow-500 text-gray-900 font-black px-2 py-0.5 rounded-full text-sm">
                  {analysis.stats.flex}
                </span>
              </div>
            </div>
            
            {/* 1. SEKCJA: Ogólne statystyki (3 kolumny) */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-700 p-4 rounded text-center shadow-inner">
                <p className="text-sm text-gray-400">Przekleństwa</p>
                <p className="text-3xl font-bold text-red-500">{analysis.stats.przekleństwa}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center shadow-inner">
                <p className="text-sm text-gray-400">Unikalne słowa</p>
                <p className="text-3xl font-bold text-blue-500">{analysis.stats.unikalne_słowa}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center shadow-inner">
                <p className="text-sm text-gray-400">Wszystkie słowa</p>
                <p className="text-3xl font-bold text-purple-500">{analysis.stats.łącznie_słów}</p>
              </div>
            </div>

            {/* 2. SEKCJA: Analiza Rymów (4 kolumny) */}
            <h3 className="text-xl font-bold mb-3 text-gray-200">Fonetyka i Rymy</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-700 p-4 rounded text-center border-b-4 border-green-500">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Dokładne</p>
                <p className="text-2xl font-bold text-white">{analysis.stats.rymy.dokładne}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center border-b-4 border-yellow-500">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Asonanse</p>
                <p className="text-2xl font-bold text-white">{analysis.stats.rymy.asonanse}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center border-b-4 border-orange-500">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Konsonanse</p>
                <p className="text-2xl font-bold text-white">{analysis.stats.rymy.konsonanse}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center border-b-4 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Wielokrotne</p>
                <p className="text-2xl font-bold text-white">{analysis.stats.rymy.wielokrotne}</p>
              </div>
            </div>

            {/* 3. SEKCJA: Surowy tekst piosenki */}
            <h3 className="text-xl font-bold mb-3 text-gray-200 mt-8">Analiza linijka po linijce</h3>
            
            <div className="text-base text-gray-200 max-h-[600px] overflow-y-auto p-6 bg-gray-900 rounded-lg border border-gray-700 leading-relaxed shadow-inner">
              {analysis.stats.annotated_lines && analysis.stats.annotated_lines.map((line, idx) => {
                if (!line.text) return <br key={idx} />;

                if (line.type === 'tag') {
                  return (
                    <div key={idx} className="mt-6 mb-2 text-blue-400 font-bold text-lg uppercase tracking-wider">
                      {line.text}
                    </div>
                  );
                }

                const profanities = analysis.stats.przekleństwa_lista || [];
                const flexes = (analysis.stats.flex_lista || []).flatMap(f => f.split(' '));

                // POTĘŻNA FUNKCJA DO NAKŁADANIA EFEKTÓW NA TEKST
                const applyHighlights = (text) => {
                  if (!text) return text;
                  
                  let elements = [text];

                  const styleWords = (wordsList, className) => {
                    if (!wordsList.length) return;
                    
                    const sortedWords = [...wordsList].sort((a, b) => b.length - a.length);
                    const escapedWords = sortedWords.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
                    const regex = new RegExp(`(?<![\\p{L}])(${escapedWords})(?![\\p{L}])`, 'giu');

                    elements = elements.flatMap(el => {
                      if (typeof el !== 'string') return el;
                      
                      const parts = el.split(regex);
                      return parts.map((part, i) => {
                        if (sortedWords.includes(part.toLowerCase())) {
                          return <span key={`${part}-${i}`} className={className}>{part}</span>;
                        }
                        return part;
                      });
                    });
                  };

                  try {
                    styleWords(flexes, "text-yellow-400 font-bold tracking-wide drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]");
                    styleWords(profanities, "text-red-400 underline decoration-red-500 decoration-2");
                    return elements;
                  } catch (e) {
                    return text;
                  }
                };

                const colorMap = {
                  'dokładne': 'bg-green-500/20 text-green-300 font-bold px-1 rounded border-b-2 border-green-500',
                  'asonanse': 'bg-yellow-500/20 text-yellow-300 font-bold px-1 rounded border-b-2 border-yellow-500',
                  'konsonanse': 'bg-orange-500/20 text-orange-300 font-bold px-1 rounded border-b-2 border-orange-500',
                  'wielokrotne': 'bg-pink-500/20 text-pink-300 font-bold px-1 rounded border-b-2 border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                };

                if (line.type === 'brak' || !line.highlight) {
                  return <div key={idx} className="text-gray-300">{applyHighlights(line.text)}</div>;
                }

                const lastIndex = line.text.lastIndexOf(line.highlight);
                
                if (lastIndex === -1) {
                   return <div key={idx} className="text-gray-300">{applyHighlights(line.text)}</div>;
                }

                const before = line.text.slice(0, lastIndex);
                const after = line.text.slice(lastIndex + line.highlight.length);

                return (
                  <div key={idx} className="text-gray-300">
                    <span>{applyHighlights(before)}</span>
                    <span className={colorMap[line.type] || ''}>
                      {applyHighlights(line.highlight)}
                    </span>
                    <span>{applyHighlights(after)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App