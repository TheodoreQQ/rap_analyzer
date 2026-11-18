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

def count_profanities(words: list) -> tuple:
    count = 0 
    found_profanities = set() 
    
    for word in words:
        if word in exceptions_words:
            continue
        
        if word in profanities_acc:
            count += 1 
            found_profanities.add(word)
            continue
            
        if any(exc in word for exc in core_contains):
            continue 
        
        for core in profanity_core:
            if core in word:
                count += 1
                found_profanities.add(word)
                break 
                
    return count, list(found_profanities)

def analyze_text(raw_lyrics: str) -> dict:
    clean_text = clean_lyrics(raw_lyrics)
    words_only_text = re.sub(r'[^\w\s]', '', clean_text.lower())
    words = words_only_text.split() 
    
    lines = [line.strip() for line in raw_lyrics.split('\n')]
    
    if not words:
        return {
            "przekleństwa": 0, 
            "przekleństwa_lista": [], 
            "rymy": {"dokładne": 0, "asonanse": 0, "konsonanse": 0, "wielokrotne": 0}, 
            "unikalne_słowa": 0, 
            "łącznie_słów": 0,
            "annotated_lines": [] 
        }
    
    profanities_count, profanities_list = count_profanities(words)
    unique_words_count = len(set(words))  
    
    rhymes_data = rhyme_analyzer.analyze(lines)
    
    return {
        "przekleństwa": profanities_count,
        "przekleństwa_lista": profanities_list, 
        "rymy": rhymes_data["stats"],
        "unikalne_słowa": unique_words_count,
        "łącznie_słów": len(words),
        "annotated_lines": rhymes_data["lines"] 
    }