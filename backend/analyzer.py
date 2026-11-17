import re
from rhymes import RhymeAnalyzer

# Inicjalizacja analizatora rymów na poziomie pliku (ładuje się raz)
rhyme_analyzer = RhymeAnalyzer()

profanities_acc = [
    # Angielskie wrażliwe:
    'ass', 'asses', 'cock', 'cocks', 'whore', 'whores'
]

profanity_core = [
    # POLSKIE:
    'kurw', 'pierdol', 'pierdal', 'pieprz', 'jeb', 'chuj', 'huj', 
    'pizd', 'piździ','sra', 'kutas', 'sukinsyn', 'fiut', 
    'dziwk', 'szmat', 'dup', 'rucha',
    # ANGIELSKIE:
    'fuck', 'shit', 'dick', 'pussy', 'slut', 'bastard', 'nigg',      
    'fagg', 'twat', 'asshol', 'dumbass', 'jackass', 'cocksuck'   
]

exceptions_words = [
    'szmat', 'pieprz', 'ruch', 'sraczka'      
]

core_contains = [
    # Pułapki PL 
    'rachuj', 'machuj', 'słuchuj', 'dmuchuj', 'wąchuj', 'niuchuj', 'cechuj', 'dachuj',
    'podupad', 'duplik', 'duplo', 'duplex', 
    'pieprzyk', 'pieprzniczk', 'pieprzow', 
    'zdziwk', 'kurwatur',
    # Pułapki ENG 
    'scunthorp', 'dickens', 'dickson', 'pussycat',    
    'pussywillow', 'snigger', 'niggl'        
]

def clean_lyrics(text: str) -> str:
    """Usuwa tagi strukturalne np. [Zwrotka 1], [Refren]"""
    return re.sub(r'\[.*?\]', '', text)

def count_profanities(words: list) -> int:
    count = 0 
    for word in words:
        if word in exceptions_words:
            continue
        
        if word in profanities_acc:
            count += 1 
            print(f"Przekleństwo (acc): {word}") # Zostawiłem Printy dla Twoich testów
            continue
            
        if any(exc in word for exc in core_contains):
            continue 
        
        if any(core in word for core in profanity_core):
            count += 1
            print(f"Przekleństwo (core): {word}")
            
    return count 

def analyze_text(raw_lyrics: str) -> dict:
    clean_text = clean_lyrics(raw_lyrics)
    
    # Wyciągamy same linijki z tekstu do analizy rymów
    lines = [line.strip() for line in clean_text.split('\n') if line.strip()]
    
    # Wyciągamy same słowa (bez interpunkcji) do statystyk i wulgaryzmów
    words_only_text = re.sub(r'[^\w\s]', '', clean_text.lower())
    words = words_only_text.split() 
    
    # Zabezpieczenie przed pustym tekstem (np. instrumental)
    if not words:
        return {
            "przekleństwa": 0, 
            "rymy": {"dokładne": 0, "asonanse": 0, "konsonanse": 0, "wielokrotne": 0}, 
            "unikalne_słowa": 0, 
            "łącznie_słów": 0
        }
    
    profanities_count = count_profanities(words)
    unique_words_count = len(set(words))  
    
    # Odpalenie naszego nowego skryptu z rhymes.py
    rhymes_stats = rhyme_analyzer.analyze(lines)
    
    return {
        "przekleństwa": profanities_count,
        "rymy": rhymes_stats,             # Tu wejdzie słownik od phonemizera
        "unikalne_słowa": unique_words_count,
        "łącznie_słów": len(words)        # Poprawiłem Ci tu literówkę z "łącznie_słow"
    }