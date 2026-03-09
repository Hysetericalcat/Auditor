import docker
client = docker.from_env()

def run_code(code: str, dataframe=None, timeout: int = 30) -> dict:
    #content inside the quotes only get transferred.
    full_code = code
    try:
        result = client.containers.run(
            image="python-sandbox",
            command="python -",      #tells to take stdin as input to run ,not a file
            stdin_open=True,
            input=full_code.encode(),   
            mem_limit="256m",
            cpu_quota=50000,
            network_mode="none",         
            read_only=True,
            tmpfs={"/tmp": ""},          
            remove=True,
            detach=False,
            stdout=True,
            stderr=True,
            timeout=timeout
        )
        return {
            "success": True,
            "output": result.decode("utf-8").strip()
        }

    except docker.errors.ContainerError as e:
        return {
            "success": False,
            "output": e.stderr.decode("utf-8").strip()
        }

    except docker.errors.APIError as e:
        return {
            "success": False,
            "output": f"Docker API error: {str(e)}"
        }
