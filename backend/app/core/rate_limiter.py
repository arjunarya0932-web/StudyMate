"""
Rate limiting configuration for StudyMate.
Uses slowapi with in-memory storage (no Redis dependency).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create limiter instance with IP-based key function
# This uses in-memory storage by default (no Redis required)
limiter = Limiter(key_func=get_remote_address)