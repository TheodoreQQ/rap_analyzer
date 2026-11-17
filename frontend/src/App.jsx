import { useState } from 'react'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  // Pobieranie podpowiedzi (Krok 1)
  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    
    const response = await fetch(`http://localhost:8000/api/search?q=${query}`);
    const data = await response.json();
    setResults(data.results);
    setLoading(false);
  }

  // Analiza konkretnej piosenki (Krok 2)
  const handleAnalyze = async (songUrl) => {
    setLoading(true);
    setResults([]); // Chowamy wyniki po kliknięciu
    
    const response = await fetch('http://localhost:8000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_url: songUrl })
    });
    
    const data = await response.json();
    setAnalysis(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-500">Rap Analyzer</h1>
        
        {/* Pasek wyszukiwania */}
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

        {loading && <p className="text-center text-gray-400">Ładowanie...</p>}

        {/* Lista wyników wyszukiwania */}
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

        {/* Sekcja wyników z backendu */}
        {analysis && !loading && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Wyniki analizy tekstu</h2>
            
            {/* 1. SEKCJA: Ogólne statystyki */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-700 p-4 rounded text-center">
                <p className="text-sm text-gray-400">Przekleństwa</p>
                <p className="text-3xl font-bold text-red-500">{analysis.stats.przekleństwa}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center">
                <p className="text-sm text-gray-400">Unikalne słowa</p>
                <p className="text-3xl font-bold text-blue-500">{analysis.stats.unikalne_słowa}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center">
                <p className="text-sm text-gray-400">Wszystkie słowa</p>
                <p className="text-3xl font-bold text-purple-500">{analysis.stats.łącznie_słów}</p>
              </div>
            </div>

            {/* 2. SEKCJA: Analiza Rymów (Fonetyka) */}
            <h3 className="text-xl font-bold mb-3 text-gray-200">Fonetyka i Rymy</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              <div className="bg-gray-700 p-4 rounded text-center border-b-4 border-pink-500">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Wielokrotne</p>
                <p className="text-2xl font-bold text-white">{analysis.stats.rymy.wielokrotne}</p>
              </div>
            </div>

            {/* Surowy tekst piosenki */}
            <h3 className="text-xl font-bold mb-3 text-gray-200 mt-8">Tekst utworu</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-300 max-h-96 overflow-y-auto p-4 bg-gray-900 rounded border border-gray-700">
              {analysis.tekst}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App