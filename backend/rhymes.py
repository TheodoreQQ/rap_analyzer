import re
import string
from phonemizer import phonemize
from phonemizer.separator import Separator

# polskie samogłoski w zapisie fonetycznym (IPA)
VOWELS_IPA = r'[aɛiɔuɨ]'

class RhymeAnalyzer:
    def __init__(self):
        # konfiguracja separatora, żeby IPA było ciągłym stringiem bez spacji między głoskami
        self.separator = Separator(phone='', word='', syllable='')
        
        self.phonetic_exceptions = {
            "superman": "supermen",
            "spiderman": "spajdermen",
            "batman": "betmen",
            "iphone": "ajfon",
            "fake": "fejk",
            "vibe": "wajb",
            "cash": "kesz",
            "uber": "uber", 
            "game": "gejm",
            "fame": "fejm",
            "richard mille": "riszard mil"
        }

    def _transliterate(self, text: str) -> str:
        """Zamienia polski tekst na alfabet fonetyczny IPA."""
        if not text:
            return ""
        
        text_lower = text.lower()
        for eng, pol in self.phonetic_exceptions.items():
            text_lower = re.sub(r'\b' + eng + r'\b', pol, text_lower)
        
        try:
            ipa = phonemize(
                text_lower,
                language='pl',
                backend='espeak',
                separator=self.separator,
                strip=True,
                preserve_punctuation=False
            )
            return ipa.strip()
        except RuntimeError as e:
            print("BŁĄD ESPEAK: Upewnij się, że espeak-ng jest zainstalowany w systemie!")
            return ""

    def _get_last_word(self, line: str) -> str:
        clean_line = line.translate(str.maketrans('', '', string.punctuation))
        words = clean_line.strip().split()
        return words[-1] if words else ""

    def _extract_phonetics(self, ipa_word: str) -> dict:
        vowels = re.findall(VOWELS_IPA, ipa_word)
        consonants = re.sub(VOWELS_IPA, '', ipa_word)
        return {"ipa": ipa_word, "vowels": vowels, "consonants": consonants}

    def _get_exact_ending(self, ipa_word: str) -> str:
        vowel_matches = list(re.finditer(VOWELS_IPA, ipa_word))
        if len(vowel_matches) >= 2:
            idx = vowel_matches[-2].start()
            return ipa_word[idx:]
        elif len(vowel_matches) == 1:
            idx = vowel_matches[0].start()
            return ipa_word[idx:]
        return ipa_word

    def _classify_rhyme(self, word1_data: dict, word2_data: dict) -> str:
        end1 = self._get_exact_ending(word1_data['ipa'])
        end2 = self._get_exact_ending(word2_data['ipa'])
        
        if end1 == end2 and len(end1) > 0:
            return "dokładne"
            
        v1_last2 = word1_data['vowels'][-2:] if len(word1_data['vowels']) >= 2 else word1_data['vowels']
        v2_last2 = word2_data['vowels'][-2:] if len(word2_data['vowels']) >= 2 else word2_data['vowels']
        
        if v1_last2 == v2_last2 and len(v1_last2) > 0:
            return "asonanse"
            
        c1_end = word1_data['consonants'][-2:]
        c2_end = word2_data['consonants'][-2:]
        if c1_end == c2_end and len(c1_end) > 0:
            return "konsonanse"
            
        return "brak"

    def analyze(self, lines: list) -> dict:
        """przyjmuje listę linijek (z tagami) i zwraca statystyki oraz pokolorowane linie."""
        stats = {
            "dokładne": 0,
            "asonanse": 0,
            "konsonanse": 0,
            "wielokrotne": 0
        }
        
        matched_lines = set()
        annotated_lines = [{"text": line, "type": "brak", "highlight": ""} for line in lines]
        
        score_map = {
            "wielokrotne": 4,
            "dokładne": 3,
            "konsonanse": 2,
            "asonanse": 1,
            "brak": 0
        }
        
        for i in range(len(lines)):
            line_stripped = lines[i].strip()
            
            # pomijanie pustych i już dopasowanych
            if not line_stripped or i in matched_lines:
                continue
                
            # wykrywanie tagów strukturalnych 
            if line_stripped.startswith('[') and line_stripped.endswith(']'):
                annotated_lines[i]["type"] = "tag"
                matched_lines.add(i)
                continue
            
            best_j = -1
            best_score = 0
            best_type = "brak"
            best_highlight1 = ""
            best_highlight2 = ""
            
            # przeszukiwanie do 5 linijek w przód (szukanie krzyżowych ABAB i okalających ABBA)
            for j in range(i + 1, min(i + 5, len(lines))):
                line_j_stripped = lines[j].strip()
                
                if not line_j_stripped or j in matched_lines:
                    continue
                    
                if line_j_stripped.startswith('[') and line_j_stripped.endswith(']'):
                    continue
                
                word1 = self._get_last_word(lines[i])
                word2 = self._get_last_word(lines[j])
                
                if not word1 or not word2:
                    continue
                
                # zabezpieczenie przed tautologią - powtórzenia w refrenie
                if word1.lower() == word2.lower() or lines[i].strip().lower() == lines[j].strip().lower():
                    continue
                    
                ipa_word1 = self._transliterate(word1.lower())
                ipa_word2 = self._transliterate(word2.lower())
                
                data1 = self._extract_phonetics(ipa_word1)
                data2 = self._extract_phonetics(ipa_word2)
                
                # ocena bazowa na pojedynczym (ostatnim) słowie
                rhyme_type = self._classify_rhyme(data1, data2)
                
                # przejście do analizy całych linijek w poszukiwaniu rymów wielokrotnych
                ipa_line1 = self._transliterate(lines[i].lower())
                ipa_line2 = self._transliterate(lines[j].lower())
                
                vowels1 = re.findall(VOWELS_IPA, ipa_line1)
                vowels2 = re.findall(VOWELS_IPA, ipa_line2)
                
                # zliczanie samogłosek od końca
                match_count = 0
                for v1, v2 in zip(reversed(vowels1), reversed(vowels2)):
                    if v1 == v2:
                        match_count += 1
                    else:
                        break
                
                # minimum 4 pasujące samogłoski - rym wielokrotny
                is_multi = match_count >= 4
                if is_multi and rhyme_type == "brak":
                    rhyme_type = "asonanse"
                
                actual_type = "wielokrotne" if is_multi else rhyme_type
                current_score = score_map[actual_type]
                
                # jeśli ten rym jest silniejszy (lub pierwszy znaleziony), zapamiętujemy go
                if current_score > best_score:
                    best_score = current_score
                    best_j = j
                    best_type = actual_type
                    
                    if is_multi:
                        # wewnętrzna funkcja: wyciąga dynamicznie odpowiednią ilość słów
                        def get_highlighted_phrase(line_str, target_vowels):
                            clean_line = line_str.translate(str.maketrans('', '', string.punctuation))
                            words = clean_line.strip().split()
                            v_seen = 0
                            w_count = 0
                            for w in reversed(words):
                                w_ipa = self._transliterate(w.lower())
                                w_vowels = re.findall(VOWELS_IPA, w_ipa)
                                v_seen += len(w_vowels)
                                w_count += 1
                                if v_seen >= target_vowels:
                                    break
                            
                            # wyciągnięcie odpowiednich słów używając split() na oryginalnej linii (aby zachować znaki na froncie)
                            original_words = line_str.strip().split()
                            return " ".join(original_words[-w_count:]) if w_count > 0 else original_words[-1]

                        best_highlight1 = get_highlighted_phrase(lines[i], match_count)
                        best_highlight2 = get_highlighted_phrase(lines[j], match_count)
                    else:
                        best_highlight1 = self._get_last_word(lines[i])
                        best_highlight2 = self._get_last_word(lines[j])
            
            # zapisanie najlepszego dopasowania
            if best_j != -1 and best_score > 0:
                stats[best_type] += 1
                
                annotated_lines[i]["type"] = best_type
                annotated_lines[i]["highlight"] = best_highlight1
                
                annotated_lines[best_j]["type"] = best_type
                annotated_lines[best_j]["highlight"] = best_highlight2
                
                matched_lines.add(i)
                matched_lines.add(best_j)
                    
        return {"stats": stats, "lines": annotated_lines}