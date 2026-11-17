import re
import string
from phonemizer import phonemize
from phonemizer.separator import Separator

# Polskie samogłoski w zapisie fonetycznym (IPA)
VOWELS_IPA = r'[aɛiɔuɨ]'

class RhymeAnalyzer:
    def __init__(self):
        # Konfiguracja separatora phonemizera
        self.separator = Separator(phone='', word='', syllable='')

    def _transliterate(self, text: str) -> str:
        """Zamienia polski tekst na alfabet fonetyczny IPA."""
        if not text:
            return ""
        try:
            ipa = phonemize(
                text,
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
        """Przyjmuje listę linijek (list of strings) i zwraca statystyki rymów."""
        stats = {
            "dokładne": 0,
            "asonanse": 0,
            "konsonanse": 0,
            "wielokrotne": 0
        }
        
        matched_lines = set()
        
        for i in range(len(lines)):
            if i in matched_lines:
                continue
                
            for j in range(i + 1, min(i + 3, len(lines))):
                if j in matched_lines:
                    continue
                
                word1 = self._get_last_word(lines[i])
                word2 = self._get_last_word(lines[j])
                
                if not word1 or not word2:
                    continue
                
                ipa_word1 = self._transliterate(word1.lower())
                ipa_word2 = self._transliterate(word2.lower())
                
                data1 = self._extract_phonetics(ipa_word1)
                data2 = self._extract_phonetics(ipa_word2)
                
                rhyme_type = self._classify_rhyme(data1, data2)
                
                ipa_line1 = self._transliterate(lines[i].lower())
                ipa_line2 = self._transliterate(lines[j].lower())
                
                vowels1 = re.findall(VOWELS_IPA, ipa_line1)
                vowels2 = re.findall(VOWELS_IPA, ipa_line2)
                
                is_multi = False
                if len(vowels1) >= 4 and len(vowels2) >= 4:
                    if vowels1[-4:] == vowels2[-4:]:
                        is_multi = True
                        if rhyme_type == "brak":
                            rhyme_type = "asonanse"
                
                if rhyme_type != "brak":
                    stats[rhyme_type] += 1
                        
                    if is_multi:
                        stats["wielokrotne"] += 1
                    
                    matched_lines.add(i)
                    matched_lines.add(j)
                    break 
                    
        return stats