from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


TierStatus = Literal["pass", "fail", "review", "unavailable"]
Decision = Literal["CLEAR", "REVIEW", "FLAG", "HARD_REJECT"]


class TierResult(BaseModel):
    tier: int = Field(ge=1, le=5)
    title: str
    status: TierStatus
    score: float | None = Field(default=None, ge=0, le=1)
    summary: str
    details: dict[str, Any] = Field(default_factory=dict)


class ScreeningResponse(BaseModel):
    screening_id: str
    created_at: datetime
    decision: Decision
    risk_score: int = Field(ge=0, le=100)
    reasons: list[str]
    tiers: list[TierResult]
    audit: dict[str, Any]
    artifacts: dict[str, str] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
