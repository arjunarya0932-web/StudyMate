from pydantic import BaseModel, Field, field_validator
import re


# Password must contain: 8-128 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
# We use a validator function instead of regex pattern because Pydantic's regex engine
# doesn't support look-ahead assertions
PASSWORD_PATTERN = re.compile(r'^.{8,128}$')
SPECIAL_CHARS = set('!@#$%^&*')


def validate_password_strength(password: str) -> str:
    """Validate password meets complexity requirements."""
    if not PASSWORD_PATTERN.match(password):
        raise ValueError(
            "Password must be 8-128 characters long"
        )
    if not any(c.islower() for c in password):
        raise ValueError(
            "Password must contain at least one lowercase letter"
        )
    if not any(c.isupper() for c in password):
        raise ValueError(
            "Password must contain at least one uppercase letter"
        )
    if not any(c.isdigit() for c in password):
        raise ValueError(
            "Password must contain at least one digit"
        )
    if not any(c in SPECIAL_CHARS for c in password):
        raise ValueError(
            "Password must contain at least one special character (!@#$%^&*)"
        )
    return password


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class UserLogin(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)