from __future__ import annotations

import contextvars
from datetime import datetime, timezone
import json
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import time
import traceback
from typing import Any, Callable, ParamSpec, TypeVar, cast

from config import LOG_DIR


screening_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("screening_id", default="no-session")
tier_var: contextvars.ContextVar[int | None] = contextvars.ContextVar("tier", default=None)

P = ParamSpec("P")
T = TypeVar("T")


class ContextFilter(logging.Filter):
    """Attach per-screening context and structured fields to every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.screening_id = getattr(record, "screening_id", screening_id_var.get())
        record.tier = getattr(record, "tier", tier_var.get())
        record.data = getattr(record, "data", {})
        return True


class SentinelLoggerAdapter(logging.LoggerAdapter[logging.Logger]):
    """Merge structured event fields with the adapter's fixed tier metadata."""

    def process(self, msg: Any, kwargs: Any) -> tuple[Any, Any]:
        extra = dict(self.extra or {})
        extra.update(kwargs.get("extra") or {})
        kwargs["extra"] = extra
        return msg, kwargs


class JsonLinesFormatter(logging.Formatter):
    """Emit a valid machine-parseable JSON object for each file log line."""

    def format(self, record: logging.LogRecord) -> str:
        exception = self.formatException(record.exc_info) if record.exc_info else None
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "screening_id": getattr(record, "screening_id", screening_id_var.get()),
            "tier": getattr(record, "tier", tier_var.get()),
            "message": record.getMessage(),
            "data": getattr(record, "data", {}),
            "exception": exception,
        }
        return json.dumps(payload, ensure_ascii=False, default=str, separators=(",", ":"))


class ConsoleFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        tier = getattr(record, "tier", tier_var.get())
        screening_id = getattr(record, "screening_id", screening_id_var.get())
        prefix = f"{record.levelname:<5} | {record.name} | session={screening_id}"
        if tier is not None:
            prefix += f" | tier={tier}"
        return f"{prefix} | {record.getMessage()}"


def configure_logging(log_dir: Path = LOG_DIR) -> None:
    """Configure SentinelAI logging once, without changing root application logs."""
    log_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("sentinelai")
    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    if any(getattr(handler, "_sentinelai_handler", False) for handler in logger.handlers):
        return

    context_filter = ContextFilter()
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(ConsoleFormatter())
    console.addFilter(context_filter)
    console._sentinelai_handler = True  # type: ignore[attr-defined]

    file_handler = RotatingFileHandler(
        log_dir / "sentinelai.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(JsonLinesFormatter())
    file_handler.addFilter(context_filter)
    file_handler._sentinelai_handler = True  # type: ignore[attr-defined]

    logger.addHandler(console)
    logger.addHandler(file_handler)


def get_logger(name: str, tier: int | None = None) -> SentinelLoggerAdapter:
    return SentinelLoggerAdapter(logging.getLogger(name), {"tier": tier} if tier is not None else {})


def log_event(
    logger: logging.Logger | logging.LoggerAdapter[Any],
    level: int,
    message: str,
    *,
    data: dict[str, Any] | None = None,
    exc_info: bool = False,
) -> None:
    """Log with a consistent structured payload while keeping call sites compact."""
    logger.log(level, message, extra={"data": data or {}}, exc_info=exc_info)


def timed(tier: int | None = None, operation: str | None = None) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """Log a synchronous operation's lifecycle and duration in milliseconds."""

    def decorate(function: Callable[P, T]) -> Callable[P, T]:
        logger = get_logger(f"sentinelai.{function.__module__.removeprefix('backend.')}", tier)
        label = operation or function.__qualname__

        def wrapped(*args: P.args, **kwargs: P.kwargs) -> T:
            start = time.perf_counter()
            log_event(logger, logging.DEBUG, "OPERATION_STARTED", data={"operation": label})
            try:
                result = function(*args, **kwargs)
            except Exception:
                log_event(
                    logger,
                    logging.ERROR,
                    "OPERATION_FAILED",
                    data={"operation": label, "duration_ms": round((time.perf_counter() - start) * 1000, 2)},
                    exc_info=True,
                )
                raise
            log_event(
                logger,
                logging.INFO,
                "OPERATION_COMPLETE",
                data={"operation": label, "duration_ms": round((time.perf_counter() - start) * 1000, 2)},
            )
            return result

        return cast(Callable[P, T], wrapped)

    return decorate


def set_screening_context(screening_id: str) -> tuple[contextvars.Token[str], contextvars.Token[int | None]]:
    return screening_id_var.set(screening_id), tier_var.set(None)


def set_tier_context(tier: int | None) -> contextvars.Token[int | None]:
    return tier_var.set(tier)


def reset_screening_context(tokens: tuple[contextvars.Token[str], contextvars.Token[int | None]]) -> None:
    screening_id_var.reset(tokens[0])
    tier_var.reset(tokens[1])


def reset_tier_context(token: contextvars.Token[int | None]) -> None:
    tier_var.reset(token)
