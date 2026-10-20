"""Unit test: chunk served as text/javascript. Static/mock only."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "custom_components/domolux_roles"))

from frontend import _content_type, _MIME_MAP, serve_chunk_safe

def test_chunk_has_text_javascript():
    p = Path("dummy/11584.d4170153ed4ba5d1.js")
    assert _content_type(p) == "text/javascript"

def test_map_is_json_css_is_css_png_is_png():
    from pathlib import Path
    assert _content_type(Path("x.js.map")) == "application/json"
    assert _content_type(Path("x.css")) == "text/css"
    assert _content_type(Path("x.png")) == "image/png"
    assert _content_type(Path("x.svg")) == "image/svg+xml"

# Traversal guard verification (static)
async def test_traversal_blocked():
    from pathlib import Path
    d = Path("frontend")
    d.mkdir(exist_ok=True)
    (d / "chunk.js").write_text("x")
    try:
        await serve_chunk_safe("../secret", d)
        assert False, "Traversal should block"
    except ValueError as e:
        assert "Traversal blocked" in str(e)
