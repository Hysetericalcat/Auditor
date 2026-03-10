from fastapi import FastAPI
from pydantic import BaseModel
from main import run_code

app = FastAPI()


class CodeRequest(BaseModel):
    code: str
    timeout: int = 30


@app.post("/run")
async def execute_code(request: CodeRequest):
    result = run_code(request.code, timeout=request.timeout)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
