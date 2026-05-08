"""
Groq API client for FinTrack AI Chatbot.
Replaces the local Qwen 2.5-3B-Instruct model with Groq's gpt-oss-120b API.
"""

from __future__ import annotations

import os
import re
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

# Load from environment with fallback chain
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_TIMEOUT = int(os.getenv("GROQ_TIMEOUT_SECONDS", "60"))
GROQ_MAX_TOKENS = int(os.getenv("GROQ_MAX_TOKENS", "2048"))
GROQ_TEMPERATURE = float(os.getenv("GROQ_TEMPERATURE", "0.4"))


class GroqChatClient:
    def __init__(self, api_key: str | None = None, model: str = GROQ_MODEL):
        self.api_key = api_key or GROQ_API_KEY
        self.model = model
        self.base_url = GROQ_BASE_URL.rstrip("/")
        self.timeout = GROQ_TIMEOUT

    def chat(self, messages: list[dict[str, str]], **kwargs) -> str:
        """
        Send a chat completion request to Groq API.

        Args:
            messages: List of message dicts with 'role' and 'content' keys.
                      Example: [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]
            **kwargs: Optional overrides for max_tokens, temperature, top_p, etc.

        Returns:
            The assistant's response content as a string.
        """
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not set. Please configure it in your .env file.")

        payload: dict[str, Any] = {
            "model": kwargs.pop("model", self.model),
            "messages": messages,
            "max_tokens": kwargs.pop("max_tokens", GROQ_MAX_TOKENS),
            "temperature": kwargs.pop("temperature", GROQ_TEMPERATURE),
        }

        if kwargs.get("top_p"):
            payload["top_p"] = kwargs.pop("top_p")

        if kwargs.get("stop"):
            payload["stop"] = kwargs.pop("stop")

        # Pass through any remaining kwargs
        payload.update(kwargs)

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code >= 400:
            error_detail = ""
            try:
                error_detail = response.json().get("error", {}).get("message", response.text)
            except Exception:
                error_detail = response.text
            raise RuntimeError(
                f"Groq API error ({response.status_code}): {error_detail}"
            )

        result = response.json()
        return result["choices"][0]["message"]["content"]


def get_groq_client() -> GroqChatClient:
    return GroqChatClient(api_key=GROQ_API_KEY, model=GROQ_MODEL)
