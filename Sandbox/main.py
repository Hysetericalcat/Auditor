import docker
import base64

client = docker.from_env()

def run_code(code: str, dataframe=None, timeout: int = 30) -> dict:

    encoded = base64.b64encode(code.encode()).decode()
    command = f"python -c \"import base64; exec(base64.b64decode('{encoded}').decode())\""

    container = None
    try:
        container = client.containers.create(
            image="python-sandbox",
            command=command,
            mem_limit="256m",
            cpu_quota=50000,
            network_mode="none",
            read_only=True,
            tmpfs={"/tmp": ""},
        )
        container.start()
        container.wait(timeout=timeout)

        logs = container.logs(stdout=True, stderr=True).decode("utf-8").strip()
        exit_code = container.attrs.get("State", {}).get("ExitCode")

    
        container.reload()
        exit_code = container.attrs["State"]["ExitCode"]

        if exit_code == 0:
            return {"success": True, "output": logs}
        else:
            return {"success": False, "output": logs}

    except Exception as e:
        return {
            "success": False,
            "output": f"Execution error: {str(e)}"
        }

    finally:
        if container:
            try:
                container.remove(force=True)
            except Exception:
                pass
