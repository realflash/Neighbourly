import sys

filepath = '/home/igibbs/localdev/election-tools/src/app/main.py'
with open(filepath, 'r') as f:
    content = f.read()

old_header = """import json
import urllib.parse

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from fastapi.templating import Jinja2Templates

from src.app.config import settings
from src.app.dependencies import get_current_user_or_redirect
from src.app.routers import auth

app = FastAPI(title="Election Tools Containing Website")
"""

new_header = """import json
import urllib.parse
from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from fastapi.templating import Jinja2Templates

from src.app.config import settings
from src.app.dependencies import get_current_user_or_redirect
from src.app.routers import auth

proxy_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global proxy_client
    proxy_client = httpx.AsyncClient()
    yield
    await proxy_client.aclose()

app = FastAPI(title="Election Tools Containing Website", lifespan=lifespan)
"""

content = content.replace(old_header, new_header)

old_proxy_logic = """    client = httpx.AsyncClient()

    # Forward headers but remove host and avoid some that cause issues
    headers = dict(request.headers)
    headers.pop("host", None)

    req = client.build_request(
        method=request.method,
        url=target_url,
        headers=headers,
        content=request.stream(),
    )

    response = await client.send(req, stream=True)

    return StreamingResponse(
        response.aiter_raw(),
        status_code=response.status_code,
        headers=dict(response.headers),
        background=client.aclose,
    )"""

new_proxy_logic = """    # Forward headers but remove host and avoid some that cause issues
    headers = dict(request.headers)
    headers.pop("host", None)

    req = proxy_client.build_request(
        method=request.method,
        url=target_url,
        headers=headers,
        content=request.stream(),
    )

    response = await proxy_client.send(req, stream=True)

    return StreamingResponse(
        response.aiter_raw(),
        status_code=response.status_code,
        headers=dict(response.headers),
    )"""

content = content.replace(old_proxy_logic, new_proxy_logic)

with open(filepath, 'w') as f:
    f.write(content)
print("Patch successfully applied!")
