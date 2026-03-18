import sys
import os
sys.path.insert(0, "/app")  # must be before any app imports

import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c