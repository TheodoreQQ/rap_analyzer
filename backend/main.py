from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import lyricsgenius
from analyzer import analyze_text
import os

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

TOKEN = os.getenv("GENIUS_TOKEN")
genius = lyricsgenius.Genius(TOKEN)
genius.verbose = False 

class AnalyzeRequest(BaseModel):
  song_url: str
  
@app.get("/api/search")
def search_song(q: str):
  if not q:
    return {"results": []}
  
  results = genius.search_songs(q)
  
  prop = []
  for hit in results.get('hits', [])[:5]:
    result = hit['result']
    prop.append({
      "id": result['id'],
      "title": result['title'],
      "artist": result['primary_artist']['name'],
      "thumbnail": result['song_art_image_thumbnail_url'],
      "url": result['url']
    })
    
  return {"results": prop}

@app.post("/api/analyze")
def analyze_song(request: AnalyzeRequest):
  text = genius.lyrics(song_url=request.song_url)
  
  if not text:
    return {"error": "Nie udało się pobrać tekstu!"}
  
  stats = analyze_text(text)
  
  return {
    "tekst": text,
    "stats": stats
  }