"""
Structured JSON logging for ML service
"""

import logging
import sys
import json
from datetime import datetime, timezone
from typing import Optional, Any, Dict


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if hasattr(record, "extra_data") and record.extra_data:
            log_data["context"] = record.extra_data
        if record.exc_info and record.exc_info[0]:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


def get_logger(name: str = "forecastai-ml") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)

    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(JsonFormatter())
    logger.addHandler(stdout_handler)

    try:
        file_handler = logging.FileHandler("ml-service.log")
        file_handler.setLevel(logging.WARNING)
        file_handler.setFormatter(JsonFormatter())
        logger.addHandler(file_handler)
    except OSError:
        pass

    return logger


logger = get_logger()


def log_with_context(
    log_logger: logging.Logger,
    level: int,
    message: str,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    record = log_logger.makeRecord(
        log_logger.name, level, "(logging)", 0, message, (), None
    )
    record.extra_data = extra or {}
    log_logger.handle(record)
