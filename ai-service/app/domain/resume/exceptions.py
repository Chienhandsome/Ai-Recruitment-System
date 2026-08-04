"""Errors classified at the domain boundary for transport retry decisions."""


class ResumePipelineError(Exception):
    """Base class for expected pipeline errors."""


class TransientError(ResumePipelineError):
    """An operation can reasonably succeed when attempted again."""


class PermanentError(ResumePipelineError):
    """Retrying the same input will not fix the failure."""


class ResumeValidationError(PermanentError):
    """The resume request or document failed validation."""


class SignedUrlExpiredError(PermanentError):
    """The backend must issue a fresh signed download URL."""

    error_code = "SIGNED_URL_EXPIRED"
