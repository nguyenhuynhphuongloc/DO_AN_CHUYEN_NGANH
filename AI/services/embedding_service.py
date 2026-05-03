import json
import os
import numpy as np
import torch
from sentence_transformers import SentenceTransformer, util

class EmbeddingService:
    def __init__(self, model_name='paraphrase-multilingual-MiniLM-L12-v2', seed_file=None):
        self.model_name = model_name
        self.model = None

        if seed_file is None:
            base_dir = os.path.dirname(__file__)
            seed_file = os.path.join(base_dir, 'categories_seed.json')

        self.seed_file = seed_file
        self.categories = []
        self.sentences = []
        self.sentence_embeddings = None
        self.load_categories_only()

    def _get_model(self):
        if self.model is None:
            print(f"Loading Embedding Model: {self.model_name}...")
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            self.model = SentenceTransformer(self.model_name, device=device)
        return self.model

    def load_categories_only(self):
        if not os.path.exists(self.seed_file):
            return
        try:
            with open(self.seed_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for category, examples in data.items():
                    for example in examples:
                        self.sentences.append(example)
                        self.categories.append(category)
        except Exception as e:
            print(f"Error loading categories: {e}")

    def reload(self):
        print("Reloading seed data...")
        self.sentences = []
        self.categories = []
        self.sentence_embeddings = None
        self.load_categories_only()

    def load_seed_data(self):
        pass

    def classify(self, text, threshold=0.35):
        try:
            model = self._get_model()

            if self.sentence_embeddings is None and self.sentences:
                print(f"Encoding {len(self.sentences)} seed sentences...")
                self.sentence_embeddings = model.encode(self.sentences, convert_to_tensor=True)
                print("Seed embeddings ready.")

            if self.sentence_embeddings is None:
                return None, 0.0

            query_embedding = model.encode(text, convert_to_tensor=True)

            cos_scores = util.cos_sim(query_embedding, self.sentence_embeddings)[0]
            best_idx = torch.argmax(cos_scores).item()
            best_score = cos_scores[best_idx].item()

            if best_score >= threshold:
                return self.categories[best_idx], best_score

            return None, best_score
        except Exception as e:
            print(f"Error during classification: {e}")
            return None, 0.0

_instance = None

def get_embedding_service():
    global _instance
    if _instance is None:
        _instance = EmbeddingService()
    return _instance