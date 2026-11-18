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
            <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Wyniki analizy tekstu</h2>
            
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

                // kolorowanie przekleństw
                const profanities = analysis.stats.przekleństwa_lista || [];
                const renderWithProfanities = (text) => {
                  if (!profanities.length || !text) return text;
                  
                  try {
                    // bezpieczny regex z obsługą polskich znaków (wyszukuje dokładnych słów z pominięciem znaków interpunkcyjnych)
                    const escapedProfs = profanities.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
                    const regex = new RegExp(`(?<![\\p{L}])(${escapedProfs})(?![\\p{L}])`, 'giu');
                    
                    const parts = text.split(regex);
                    return parts.map((part, i) => {
                      if (profanities.includes(part.toLowerCase())) {
                        return <span key={i} className="text-red-400 underline decoration-red-500 decoration-2">{part}</span>;
                      }
                      return part;
                    });
                  } catch (e) {
                    return text; // w razie błędu zwraca czysty tekst
                  }
                };

                // Kolory dla rymów
                const colorMap = {
                  'dokładne': 'bg-green-500/20 text-green-300 font-bold px-1 rounded border-b-2 border-green-500',
                  'asonanse': 'bg-yellow-500/20 text-yellow-300 font-bold px-1 rounded border-b-2 border-yellow-500',
                  'konsonanse': 'bg-orange-500/20 text-orange-300 font-bold px-1 rounded border-b-2 border-orange-500',
                  'wielokrotne': 'bg-pink-500/20 text-pink-300 font-bold px-1 rounded border-b-2 border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                };

                // renderowanie linii bazowej (bez rymów)
                if (line.type === 'brak' || !line.highlight) {
                  return <div key={idx} className="text-gray-300">{renderWithProfanities(line.text)}</div>;
                }

                const lastIndex = line.text.lastIndexOf(line.highlight);
                
                // zabezpieczenie przed błędem z ucięciem liter
                if (lastIndex === -1) {
                   return <div key={idx} className="text-gray-300">{renderWithProfanities(line.text)}</div>;
                }

                // dzielenie linijki dla rymów i aplikowanie przekleństw
                const before = line.text.slice(0, lastIndex);
                const after = line.text.slice(lastIndex + line.highlight.length);

                return (
                  <div key={idx} className="text-gray-300">
                    <span>{renderWithProfanities(before)}</span>
                    <span className={colorMap[line.type] || ''}>
                      {/* podkreślenie przekleństwa nawet, jeżeli będzie już zaznaczone jako rym */}
                      {renderWithProfanities(line.highlight)} 
                    </span>
                    <span>{renderWithProfanities(after)}</span>
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