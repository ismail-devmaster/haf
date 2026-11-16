"""Static asset serving tests for the Domolux Roles frontend integration.

These tests live in the Domolux integration test tree (``tests/``) because
they exercise the custom component and need the Home Assistant module stubs
provided by ``tests/conftest.py``.  The previous copy under ``test/`` could
never be collected: ``test/`` belongs to the Home Assistant frontend's
Vitest suite and has no Home Assistant stubs, so importing the integration
raised ``ModuleNotFoundError: No module named 'homeassistant'``.
"""

from pathlib import Path

import pytest

from custom_components.domolux_roles.frontend import (
    _MIME_MAP,
    _content_type,
    serve_chunk_safe,
)


def test_chunk_has_text_javascript():
    """JavaScript chunks must be served as JavaScript, never as HTML."""
    path = Path("dummy/11584.d4170153ed4ba5d1.js")
    assert _content_type(path) == "text/javascript"


def test_map_is_json_css_is_css_png_is_png():
    """Every runtime asset type maps to the correct MIME type."""
    assert _content_type(Path("x.js.map")) == "application/json"
    assert _content_type(Path("x.css")) == "text/css"
    assert _content_type(Path("x.png")) == "image/png"
    assert _content_type(Path("x.svg")) == "image/svg+xml"
    assert _content_type(Path("x.js")) == "text/javascript"
    assert _content_type(Path("x.mjs")) == "text/javascript"


def test_unknown_extension_falls_back_to_octet_stream():
    """Unknown extensions never accidentally resolve to text/html."""
    assert _content_type(Path("x.unknown")) == "application/octet-stream"
    assert "text/html" not in _MIME_MAP.values()


async def test_traversal_blocked(tmp_path):
    """A traversal attempt is refused before any file is read."""
    frontend_dir = tmp_path / "frontend"
    frontend_dir.mkdir()
    (frontend_dir / "chunk.js").write_text("x")

    with pytest.raises(ValueError) as excinfo:
        await serve_chunk_safe("../secret", frontend_dir)

    assert "Traversal blocked" in str(excinfo.value)


async def test_absolute_path_cannot_escape_the_served_directory(tmp_path):
    """Neither a traversal nor an absolute path can read a sibling file."""
    frontend_dir = tmp_path / "frontend"
    frontend_dir.mkdir()
    (frontend_dir / "chunk.js").write_text("x")
    secret = tmp_path / "secret.txt"
    secret.write_text("top-secret")

    # Traversal to a sibling file is refused outright.
    with pytest.raises(ValueError):
        await serve_chunk_safe("../secret.txt", frontend_dir)

    # An absolute path is neutralised and cannot reach the file either.
    with pytest.raises((ValueError, FileNotFoundError)):
        await serve_chunk_safe(str(secret), frontend_dir)


async def test_valid_chunk_is_served(tmp_path):
    """A regular chunk inside the served directory is returned with its type."""
    frontend_dir = tmp_path / "frontend"
    frontend_dir.mkdir()
    (frontend_dir / "chunk.js").write_text("console.log(1)")

    content_type, data = await serve_chunk_safe("chunk.js", frontend_dir)

    assert content_type == "text/javascript"
    assert data == b"console.log(1)"
