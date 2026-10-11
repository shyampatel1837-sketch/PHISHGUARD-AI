from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FRONTEND_ENV = ROOT.parent / 'frontend' / '.env'


def test_frontend_uses_ipv4_localhost_for_backend_calls():
    env_text = FRONTEND_ENV.read_text(encoding='utf-8')
    assert 'VITE_API_URL=http://127.0.0.1:8000' in env_text


def test_backend_allows_local_frontend_origin_on_ipv4_loopback():
    config_path = ROOT / 'app' / 'core' / 'config.py'
    config_text = config_path.read_text(encoding='utf-8')
    assert 'http://127.0.0.1:5173' in config_text
